import type { EWebhookAuthMode } from '../../webhook/enums/WebhookAuthMode';
import type { EWebhookPayloadMode } from '../../webhook/enums/WebhookPayloadMode';
import type { ISimulationSettings } from '../../simulation/models/SimulationSettings';

export interface IMerchant {
  id: string;
  name: string;
  pix_key: string;
  city: string;
  api_key_prefix: string;
  webhook_url: string | null;
  webhook_auth_mode: EWebhookAuthMode;
  webhook_payload_mode: EWebhookPayloadMode;
  created_at: string;
  updated_at: string;
}

export interface IMerchantApiKey {
  api_key: string;
  api_key_prefix: string;
}

/** Merchant visto pela central: o segredo do webhook fica visível para configurar o sistema do cliente. */
export interface ICentralMerchant extends IMerchant {
  webhook_secret: string;
  /** Cenários de simulação: só a central vê e altera. */
  simulation_settings: ISimulationSettings;
  /** Cobranças deste cliente aguardando pagamento agora. */
  pending_charges: number;
  charges_total: number;
}

/** Retornado só na criação: a API key não é exibida de novo. */
export interface IMerchantWithCredentials extends ICentralMerchant {
  api_key: string;
}

export interface IMerchantWebhookSecret {
  webhook_secret: string;
}
