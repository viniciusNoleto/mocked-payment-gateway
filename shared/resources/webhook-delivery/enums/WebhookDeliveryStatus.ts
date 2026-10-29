export enum EWebhookDeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  /** Perdida de propósito pela simulação (webhook_drop ou webhook.mode = skip). Pode ser reenviada. */
  DROPPED = 'dropped',
}
