import { z } from 'zod';
import { defineCentralHandler } from '../../../utils/auth';
import { apiOk, paginationMeta } from '../../../utils/api';
import { paginationQuery, readValidatedQuery } from '../../../utils/validation';
import { listCentralCharges } from '../../../domain/charges';
import { serializeCentralCharge } from '../../../domain/serializers';
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';

const querySchema = z.object({
  status: z.enum(EChargeStatus).optional(),
  merchant_id: z.uuid().optional(),
  ...paginationQuery,
});

/** Cobranças de todos os clientes, com o cliente dono de cada uma. */
export default defineCentralHandler(async (event) => {
  const query = readValidatedQuery(event, querySchema);
  const { items, total } = await listCentralCharges({ ...query, perPage: query.per_page });

  return apiOk(event, {
    items: items.map(row => serializeCentralCharge(row.charge, row.merchant)),
    meta: paginationMeta(query.page, query.per_page, total),
  });
});
