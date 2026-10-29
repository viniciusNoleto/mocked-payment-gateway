import { getRouterParam } from 'h3';
import { defineCentralHandler } from '../../../../utils/auth';
import { apiOk } from '../../../../utils/api';
import { assertUuid } from '../../../../utils/validation';
import { rotateMerchantApiKey } from '../../../../domain/merchants';
import type { IMerchantApiKey } from '#shared/resources/merchant/models/Merchant';
import { EApiCode } from '#shared/constants/apiCode';

export default defineCentralHandler(async (event) => {
  const { merchant, apiKey } = await rotateMerchantApiKey(assertUuid(getRouterParam(event, 'merchant_id')));
  const data: IMerchantApiKey = { api_key: apiKey, api_key_prefix: merchant.api_key_prefix };

  return apiOk(event, data, EApiCode.API_KEY_ROTATED);
});
