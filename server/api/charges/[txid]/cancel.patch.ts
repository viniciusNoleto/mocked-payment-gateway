import { getRouterParam } from 'h3';
import { defineMerchantHandler } from '../../../utils/auth';
import { apiOk } from '../../../utils/api';
import { cancelCharge } from '../../../domain/charges';
import { serializeCharge } from '../../../domain/serializers';
import { EApiCode } from '#shared/constants/apiCode';

export default defineMerchantHandler(async (event, merchant) => {
  const charge = await cancelCharge(merchant, getRouterParam(event, 'txid')!);

  return apiOk(event, serializeCharge(charge), EApiCode.CHARGE_CANCELLED);
});
