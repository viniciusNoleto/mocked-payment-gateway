import { getRouterParam } from 'h3';
import { z } from 'zod';
import { defineCentralHandler } from '../../../../utils/auth';
import { apiOk } from '../../../../utils/api';
import { assertUuid, readValidatedJson } from '../../../../utils/validation';
import { chargeCountsByMerchant, updateMerchant } from '../../../../domain/merchants';
import { serializeCentralMerchant } from '../../../../domain/serializers';
import { merchantFields } from '../../../../schemas/merchant';
import { EApiCode } from '#shared/constants/apiCode';

const bodySchema = z.object(merchantFields).partial();

export default defineCentralHandler(async (event) => {
  const merchantId = assertUuid(getRouterParam(event, 'merchant_id'));
  const body = await readValidatedJson(event, bodySchema);
  const merchant = await updateMerchant(merchantId, body);

  const counts = await chargeCountsByMerchant([merchant.id]);

  return apiOk(event, serializeCentralMerchant(merchant, counts.get(merchant.id)), EApiCode.MERCHANT_UPDATED);
});
