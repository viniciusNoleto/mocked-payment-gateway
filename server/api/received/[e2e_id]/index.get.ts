import { getRouterParam } from 'h3';
import { defineMerchantHandler } from '../../../utils/auth';
import { apiOk } from '../../../utils/api';
import { findPixByE2eId } from '../../../domain/pix';
import { serializePix } from '../../../domain/serializers';

export default defineMerchantHandler(async (event, merchant) => {
  const pix = await findPixByE2eId(merchant.id, getRouterParam(event, 'e2e_id')!);

  return apiOk(event, serializePix(pix));
});
