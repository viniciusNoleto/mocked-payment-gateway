import type { EChargeStatus } from '../enums/ChargeStatus';
import type { EChargeConfirmationSource } from '../enums/ChargeConfirmationSource';

export interface IChargePayer {
  name: string | null;
  document: string | null;
}

export interface ICharge {
  id: string;
  txid: string;
  location_id: string;
  amount: number;
  status: EChargeStatus;
  description: string | null;
  external_reference: string | null;
  payer: IChargePayer;
  metadata: Record<string, unknown> | null;
  /** BR Code "copia e cola". A imagem do QR Code é gerada pelo seu sistema a partir dele. */
  qr_code: string;
  expires_in: number;
  expires_at: string;
  auto_pay_at: string | null;
  paid_at: string | null;
  e2e_id: string | null;
  confirmed_by: EChargeConfirmationSource | null;
  cancelled_at: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IChargeMerchant {
  id: string;
  name: string;
}

/** Cobrança na central: inclui o cliente (merchant) dono dela. */
export interface ICentralCharge extends ICharge {
  merchant: IChargeMerchant;
}

/** Visão pública da location do BR Code (GET /api/qr/:location_id), sem dados do merchant além do nome. */
export interface IChargeLocation {
  location_id: string;
  txid: string;
  amount: number;
  status: EChargeStatus;
  description: string | null;
  merchant_name: string;
  pix_key: string;
  expires_at: string;
}
