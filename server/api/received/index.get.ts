import { z } from 'zod';
import { defineMerchantHandler } from '../../utils/auth';
import { apiOk, paginationMeta } from '../../utils/api';
import { paginationQuery, readValidatedQuery } from '../../utils/validation';
import { listReceivedPix } from '../../domain/pix';
import { serializePix } from '../../domain/serializers';

const DAY_MS = 24 * 60 * 60 * 1000;

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  txid: z.string().optional(),
  with_charge: z.enum(['true', 'false']).transform(value => value === 'true').optional(),
  ...paginationQuery,
});

/** Pix recebidos no período (padrão: últimas 24h). */
export default defineMerchantHandler(async (event, merchant) => {
  const query = readValidatedQuery(event, querySchema);
  const to = query.to ?? new Date();
  const from = query.from ?? new Date(to.getTime() - DAY_MS);

  const { items, total } = await listReceivedPix(merchant.id, { ...query, from, to, perPage: query.per_page });

  return apiOk(event, {
    items: items.map(serializePix),
    meta: paginationMeta(query.page, query.per_page, total),
  });
});
