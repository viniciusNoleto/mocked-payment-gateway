/**
 * Código de toda resposta da API. As rotas de integração respondem só com ele (`{ success, code, data }`);
 * as rotas da central acrescentam `message` traduzida para o painel.
 */
export enum EApiCode {
  OK = 'ok',
  INVALID_PAYLOAD = 'invalid_payload',
  VALIDATION_ERROR = 'validation_error',
  UNAUTHORIZED = 'unauthorized',
  NOT_FOUND = 'not_found',
  ROUTE_NOT_FOUND = 'route_not_found',
  SERVER_ERROR = 'server_error',
  CENTRAL_DISABLED = 'central_disabled',
  GATEWAY_UNAVAILABLE = 'gateway_unavailable',
  SIMULATED_FAILURE = 'simulated_failure',

  CHARGE_CREATED = 'charge_created',
  CHARGE_REPLAYED = 'charge_replayed',
  TXID_TAKEN = 'txid_taken',
  CHARGE_CANCELLED = 'charge_cancelled',
  CHARGE_EXPIRED = 'charge_expired',
  CHARGE_NOT_PENDING = 'charge_not_pending',
  CHARGE_PAID = 'charge_paid',
  CHARGE_ALREADY_PAID = 'charge_already_paid',
  CHARGE_NOT_PAYABLE = 'charge_not_payable',
  PIX_RECEIVED = 'pix_received',
  SIMULATION_SETTINGS_UPDATED = 'simulation_settings_updated',

  WEBHOOK_SECRET_ROTATED = 'webhook_secret_rotated',

  MERCHANT_CREATED = 'merchant_created',
  MERCHANT_UPDATED = 'merchant_updated',
  MERCHANT_DELETED = 'merchant_deleted',
  API_KEY_ROTATED = 'api_key_rotated',
  API_KEY_TAKEN = 'api_key_taken',
}
