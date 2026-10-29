import { getRouterParam } from 'h3';
import { defineCentralHandler } from '../../../../utils/auth';
import { apiOk } from '../../../../utils/api';
import { assertUuid } from '../../../../utils/validation';
import { deleteMerchant } from '../../../../domain/merchants';
import { EApiCode } from '#shared/constants/apiCode';

export default defineCentralHandler(async (event) => {
  await deleteMerchant(assertUuid(getRouterParam(event, 'merchant_id')));

  return apiOk(event, null, EApiCode.MERCHANT_DELETED);
});
