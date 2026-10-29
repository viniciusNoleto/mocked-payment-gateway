import { getRouterParam } from 'h3';
import { defineCentralHandler } from '../../../../utils/auth';
import { apiOk } from '../../../../utils/api';
import { cancelCharge, findChargeWithMerchant } from '../../../../domain/charges';
import { serializeCentralCharge } from '../../../../domain/serializers';
import { EApiCode } from '#shared/constants/apiCode';

export default defineCentralHandler(async (event) => {
  const { charge, merchant } = await findChargeWithMerchant(getRouterParam(event, 'txid')!);
  const cancelled = await cancelCharge(merchant, charge.txid);

  return apiOk(event, serializeCentralCharge(cancelled, merchant), EApiCode.CHARGE_CANCELLED);
});
