import { z } from 'zod';
import { defineCentralHandler } from '../../../utils/auth';
import { apiOk } from '../../../utils/api';
import { amountSchema, readValidatedJson } from '../../../utils/validation';
import { createCharge } from '../../../domain/charges';
import { findMerchant } from '../../../domain/merchants';
import { serializeCentralCharge } from '../../../domain/serializers';
import { EApiCode } from '#shared/constants/apiCode';

const bodySchema = z.object({
  merchant_id: z.uuid(),
  amount: amountSchema,
  expires_in: z.number().int().min(1).max(7 * 24 * 60 * 60).default(1800),
  description: z.string().max(140).optional(),
  auto_pay_after_seconds: z.number().int().min(0).optional(),
});

/** Cobrança de teste criada pela central em nome de um cliente, como se o sistema dele tivesse chamado POST /api/charges. */
export default defineCentralHandler(async (event) => {
  const { merchant_id: merchantId, ...input } = await readValidatedJson(event, bodySchema);
  const merchant = await findMerchant(merchantId);
  const { charge } = await createCharge(merchant, input, null);

  return apiOk(event, serializeCentralCharge(charge, merchant), EApiCode.CHARGE_CREATED, 201);
});
