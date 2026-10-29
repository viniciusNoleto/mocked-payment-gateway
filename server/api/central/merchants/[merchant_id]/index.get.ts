import { getRouterParam } from 'h3';
import { defineCentralHandler } from '../../../../utils/auth';
import { apiOk } from '../../../../utils/api';
import { assertUuid } from '../../../../utils/validation';
import { chargeCountsByMerchant, findMerchant } from '../../../../domain/merchants';
import { serializeCentralMerchant } from '../../../../domain/serializers';

export default defineCentralHandler(async (event) => {
  const merchant = await findMerchant(assertUuid(getRouterParam(event, 'merchant_id')));

  const counts = await chargeCountsByMerchant([merchant.id]);

  return apiOk(event, serializeCentralMerchant(merchant, counts.get(merchant.id)));
});
