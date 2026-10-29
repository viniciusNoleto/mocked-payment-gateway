import { appClient } from '~/utils/appClient';
import type { ICentralCharge } from '#shared/resources/charge/models/Charge';
import type { IPix } from '#shared/resources/pix/models/Pix';
import type { ESimulationWebhookMode } from '#shared/resources/simulation/enums/SimulationWebhookMode';
import type { PayloadBody } from '#shared/types/api';

export type PayChargeServicePayload = {
  payer?: { name?: string; document?: string; ispb?: string };
  webhook?: {
    mode?: `${ESimulationWebhookMode}`;
    delay_seconds?: number;
    duplicates?: number;
  };
};

export function payChargeService({ txid, body }: PayloadBody<PayChargeServicePayload> & { txid: string }) {
  return appClient.post<{ charge: ICentralCharge; pix: IPix }>(`/api/central/charges/${txid}/pay`, { body });
}
