import { z } from 'zod';
import { defineMerchantHandler } from '../../utils/auth';
import { apiOk, paginationMeta } from '../../utils/api';
import { paginationQuery, readValidatedQuery } from '../../utils/validation';
import { listCharges } from '../../domain/charges';
import { serializeCharge } from '../../domain/serializers';
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';

const querySchema = z.object({
  status: z.enum(EChargeStatus).optional(),
  external_reference: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  ...paginationQuery,
});

export default defineMerchantHandler(async (event, merchant) => {
  const query = readValidatedQuery(event, querySchema);
  const { items, total } = await listCharges(merchant.id, { ...query, perPage: query.per_page });

  return apiOk(event, {
    items: items.map(serializeCharge),
    meta: paginationMeta(query.page, query.per_page, total),
  });
});
