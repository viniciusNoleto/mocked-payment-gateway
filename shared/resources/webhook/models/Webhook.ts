import type { EWebhookEvent } from '../enums/WebhookEvent';

/** Corpo enviado ao merchant em cada entrega de webhook. */
export interface IWebhookPayload<T = Record<string, unknown>> {
  id: string;
  event: EWebhookEvent;
  created_at: string;
  data: T;
}
