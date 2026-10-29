import { getRouterParam } from 'h3';
import { z } from 'zod';
import { defineCentralHandler } from '../../../../utils/auth';
import { apiOk } from '../../../../utils/api';
import { readValidatedJson } from '../../../../utils/validation';
import { findChargeWithMerchant } from '../../../../domain/charges';
import { payCharge } from '../../../../domain/simulation';
import { serializeCentralCharge, serializePix } from '../../../../domain/serializers';
import { payerSchema, toWebhookOptions, webhookSimulationSchema } from '../../../../schemas/simulation';
import { EApiCode } from '#shared/constants/apiCode';
import { EChargeConfirmationSource } from '#shared/resources/charge/enums/ChargeConfirmationSource';

const bodySchema = z.object({
  payer: payerSchema.optional(),
  webhook: webhookSimulationSchema,
});

/** A central marca a cobrança como paga, sempre pelo valor cobrado. */
export default defineCentralHandler(async (event) => {
  const body = await readValidatedJson(event, bodySchema);
  const { charge, merchant } = await findChargeWithMerchant(getRouterParam(event, 'txid')!);

  const result = await payCharge(charge, {
    source: EChargeConfirmationSource.SIMULATION,
    payer: body.payer,
    webhook: toWebhookOptions(body.webhook),
  });

  return apiOk(event, { charge: serializeCentralCharge(result.charge, merchant), pix: serializePix(result.pix) }, EApiCode.CHARGE_PAID);
});
