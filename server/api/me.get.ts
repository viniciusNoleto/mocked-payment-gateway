import { defineMerchantHandler } from '../utils/auth';
import { apiOk } from '../utils/api';
import { serializeMerchant } from '../domain/serializers';

/** Merchant dono da API key — útil para validar credenciais. */
export default defineMerchantHandler(async (event, merchant) => {
  return apiOk(event, serializeMerchant(merchant));
});
