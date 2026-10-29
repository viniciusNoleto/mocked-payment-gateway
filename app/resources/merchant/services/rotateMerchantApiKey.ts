import { appClient } from '~/utils/appClient';
import type { IMerchantApiKey } from '#shared/resources/merchant/models/Merchant';

export function rotateMerchantApiKeyService({ merchantId }: { merchantId: string }) {
  return appClient.patch<IMerchantApiKey>(`/api/central/merchants/${merchantId}/rotate-api-key`, { body: {} });
}
