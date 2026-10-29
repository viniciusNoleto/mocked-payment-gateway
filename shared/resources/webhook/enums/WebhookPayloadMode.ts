/**
 * `full` envia a cobrança e o Pix no corpo; `minimal` envia só o txid,
 * obrigando o merchant a consultar GET /api/charges/:txid (como alguns PSPs reais).
 */
export enum EWebhookPayloadMode {
  FULL = 'full',
  MINIMAL = 'minimal',
}
