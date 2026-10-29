import { appClient } from '~/utils/appClient';
import type { IMerchantWebhookSecret } from '#shared/resources/merchant/models/Merchant';

export function rotateMerchantWebhookSecretService({ merchantId }: { merchantId: string }) {
  return appClient.patch<IMerchantWebhookSecret>(`/api/central/merchants/${merchantId}/rotate-webhook-secret`, { body: {} });
}
