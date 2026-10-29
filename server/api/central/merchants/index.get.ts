import { z } from 'zod';
import { defineCentralHandler } from '../../../utils/auth';
import { apiOk, paginationMeta } from '../../../utils/api';
import { paginationQuery, readValidatedQuery } from '../../../utils/validation';
import { chargeCountsByMerchant, listMerchants } from '../../../domain/merchants';
import { serializeCentralMerchant } from '../../../domain/serializers';

const querySchema = z.object({ ...paginationQuery });

export default defineCentralHandler(async (event) => {
  const query = readValidatedQuery(event, querySchema);
  const { items, total } = await listMerchants(query.page, query.per_page);
  const counts = await chargeCountsByMerchant(items.map(item => item.id));

  return apiOk(event, {
    items: items.map(item => serializeCentralMerchant(item, counts.get(item.id))),
    meta: paginationMeta(query.page, query.per_page, total),
  });
});
