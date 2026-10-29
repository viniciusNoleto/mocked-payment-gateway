import { z } from 'zod';
import { EWebhookAuthMode } from '#shared/resources/webhook/enums/WebhookAuthMode';
import { EWebhookPayloadMode } from '#shared/resources/webhook/enums/WebhookPayloadMode';

export const merchantFields = {
  name: z.string().min(1).max(150),
  pix_key: z.string().min(1).max(77),
  city: z.string().min(1).max(15),
  webhook_url: z.url({ protocol: /^https?$/ }).nullable(),
  webhook_auth_mode: z.enum(EWebhookAuthMode),
  webhook_payload_mode: z.enum(EWebhookPayloadMode),
};
