import { z } from 'zod';
import { defineCentralHandler } from '../../utils/auth';
import { apiOk } from '../../utils/api';
import { amountSchema, readValidatedJson } from '../../utils/validation';
import { findMerchant } from '../../domain/merchants';
import { receiveUnsolicitedPix } from '../../domain/payments';
import { serializePix } from '../../domain/serializers';
import { payerSchema, toWebhookOptions, webhookSimulationSchema } from '../../schemas/simulation';
import { EApiCode } from '#shared/constants/apiCode';

const bodySchema = z.object({
  merchant_id: z.uuid(),
  amount: amountSchema,
  payer: payerSchema.optional(),
  info_payer: z.string().max(140).optional(),
  webhook: webhookSimulationSchema,
});

/** Pix sem cobrança local para um cliente — o caso que a conferência diária dele precisa encontrar. */
export default defineCentralHandler(async (event) => {
  const { merchant_id: merchantId, ...body } = await readValidatedJson(event, bodySchema);
  const merchant = await findMerchant(merchantId);

  const pix = await receiveUnsolicitedPix(merchant, {
    amount: body.amount,
    payer: body.payer,
    infoPayer: body.info_payer,
    webhook: toWebhookOptions(body.webhook),
  });

  return apiOk(event, serializePix(pix), EApiCode.PIX_RECEIVED, 201);
});
