/** Como o merchant valida que o webhook veio do gateway. */
export enum EWebhookAuthMode {
  HMAC = 'hmac',
  TOKEN = 'token',
}
