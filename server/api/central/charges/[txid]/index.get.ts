import { getRouterParam } from 'h3';
import { defineCentralHandler } from '../../../../utils/auth';
import { apiOk } from '../../../../utils/api';
import { findChargeWithMerchant } from '../../../../domain/charges';
import { serializeCentralCharge } from '../../../../domain/serializers';

export default defineCentralHandler(async (event) => {
  const { charge, merchant } = await findChargeWithMerchant(getRouterParam(event, 'txid')!);

  return apiOk(event, serializeCentralCharge(charge, merchant));
});
