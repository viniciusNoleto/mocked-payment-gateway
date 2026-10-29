import { appClient } from '~/utils/appClient';
import type { ICentralMerchant } from '#shared/resources/merchant/models/Merchant';
import type { EWebhookAuthMode } from '#shared/resources/webhook/enums/WebhookAuthMode';
import type { EWebhookPayloadMode } from '#shared/resources/webhook/enums/WebhookPayloadMode';
import type { PayloadBody } from '#shared/types/api';

export type UpdateMerchantServicePayload = {
  name?: string;
  pix_key?: string;
  city?: string;
  webhook_url?: string | null;
  webhook_auth_mode?: `${EWebhookAuthMode}`;
  webhook_payload_mode?: `${EWebhookPayloadMode}`;
};

export function updateMerchantService({ merchantId, body }: PayloadBody<UpdateMerchantServicePayload> & { merchantId: string }) {
  return appClient.put<ICentralMerchant>(`/api/central/merchants/${merchantId}`, { body });
}
