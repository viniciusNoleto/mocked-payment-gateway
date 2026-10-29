import type { charges, merchants, pixPayments, webhookDeliveries } from '../db/schema';
import type { ICentralCharge, ICharge } from '#shared/resources/charge/models/Charge';
import type { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';
import type { EChargeConfirmationSource } from '#shared/resources/charge/enums/ChargeConfirmationSource';
import type { IPix } from '#shared/resources/pix/models/Pix';
import type { ICentralMerchant, IMerchant } from '#shared/resources/merchant/models/Merchant';
import type { EWebhookAuthMode } from '#shared/resources/webhook/enums/WebhookAuthMode';
import type { EWebhookPayloadMode } from '#shared/resources/webhook/enums/WebhookPayloadMode';
import type { EWebhookEvent } from '#shared/resources/webhook/enums/WebhookEvent';
import { toIso } from '../utils/api';

export type ChargeRow = typeof charges.$inferSelect;
export type PixRow = typeof pixPayments.$inferSelect;
export type MerchantRow = typeof merchants.$inferSelect;
export type WebhookDeliveryRow = typeof webhookDeliveries.$inferSelect;

export function serializeCharge(row: ChargeRow): ICharge {
  return {
    id: row.id,
    txid: row.txid,
    location_id: row.location_id,
    amount: row.amount,
    status: row.status as EChargeStatus,
    description: row.description,
    external_reference: row.external_reference,
    payer: { name: row.payer_name, document: row.payer_document },
    metadata: row.metadata ?? null,
    qr_code: row.qr_code,
    expires_in: row.expires_in,
    expires_at: row.expires_at.toISOString(),
    auto_pay_at: toIso(row.auto_pay_at),
    paid_at: toIso(row.paid_at),
    e2e_id: row.e2e_id,
    confirmed_by: row.confirmed_by as EChargeConfirmationSource | null,
    cancelled_at: toIso(row.cancelled_at),
    expired_at: toIso(row.expired_at),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

/** Cobrança vista pela central: a mesma de sempre, com o cliente dono dela. */
export function serializeCentralCharge(row: ChargeRow, merchant: Pick<MerchantRow, 'id' | 'name'>): ICentralCharge {
  return { ...serializeCharge(row), merchant: { id: merchant.id, name: merchant.name } };
}

export function serializePix(row: PixRow): IPix {
  return {
    id: row.id,
    e2e_id: row.e2e_id,
    txid: row.txid,
    charge_id: row.charge_id,
    amount: row.amount,
    info_payer: row.info_payer,
    payer: {
      name: row.payer_name,
      document: row.payer_document,
      ispb: row.payer_ispb,
      bank_name: row.payer_bank_name,
    },
    paid_at: row.paid_at.toISOString(),
    created_at: row.created_at.toISOString(),
  };
}

export function serializeMerchant(row: MerchantRow): IMerchant {
  return {
    id: row.id,
    name: row.name,
    pix_key: row.pix_key,
    city: row.city,
    api_key_prefix: row.api_key_prefix,
    webhook_url: row.webhook_url,
    webhook_auth_mode: row.webhook_auth_mode as EWebhookAuthMode,
    webhook_payload_mode: row.webhook_payload_mode as EWebhookPayloadMode,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export type MerchantChargeCounts = { pending: number; total: number };

export function serializeCentralMerchant(row: MerchantRow, counts: MerchantChargeCounts = { pending: 0, total: 0 }): ICentralMerchant {
  return {
    ...serializeMerchant(row),
    webhook_secret: row.webhook_secret,
    simulation_settings: row.simulation_settings,
    pending_charges: counts.pending,
    charges_total: counts.total,
  };
}
