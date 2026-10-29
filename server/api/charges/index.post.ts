import { getHeader } from 'h3';
import { z } from 'zod';
import { defineMerchantHandler } from '../../utils/auth';
import { apiOk, ApiError } from '../../utils/api';
import { amountSchema, readValidatedJson } from '../../utils/validation';
import { TXID_REGEX } from '../../utils/pix/ids';
import { createCharge } from '../../domain/charges';
import { serializeCharge } from '../../domain/serializers';
import { EApiCode } from '#shared/constants/apiCode';

const bodySchema = z.object({
  amount: amountSchema,
  txid: z.string().regex(TXID_REGEX).optional(),
  expires_in: z.number().int().min(1).max(7 * 24 * 60 * 60).default(1800),
  description: z.string().max(140).optional(),
  external_reference: z.string().max(100).optional(),
  payer: z.object({
    name: z.string().min(1).max(200).optional(),
    document: z.string().regex(/^(\d{11}|\d{14})$/).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export default defineMerchantHandler(async (event, merchant) => {
  const body = await readValidatedJson(event, bodySchema);
  const idempotencyKey = getHeader(event, 'idempotency-key')?.trim() || null;

  if (idempotencyKey && idempotencyKey.length > 255) throw new ApiError(422, EApiCode.INVALID_PAYLOAD);

  const { charge, created } = await createCharge(merchant, body, idempotencyKey);

  return apiOk(
    event,
    serializeCharge(charge),
    created ? EApiCode.CHARGE_CREATED : EApiCode.CHARGE_REPLAYED,
    created ? 201 : 200,
  );
});
