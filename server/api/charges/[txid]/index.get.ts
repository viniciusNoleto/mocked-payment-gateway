import { getRouterParam } from 'h3';
import { defineMerchantHandler } from '../../../utils/auth';
import { apiOk } from '../../../utils/api';
import { findChargeByTxid } from '../../../domain/charges';
import { serializeCharge } from '../../../domain/serializers';

/** Fonte da verdade: o merchant consulta aqui antes de confiar em qualquer webhook. */
export default defineMerchantHandler(async (event, merchant) => {
  const charge = await findChargeByTxid(merchant.id, getRouterParam(event, 'txid')!);

  return apiOk(event, serializeCharge(charge));
});
