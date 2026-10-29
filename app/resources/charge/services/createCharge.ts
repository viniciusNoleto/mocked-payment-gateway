import { appClient } from '~/utils/appClient';
import type { ICentralCharge } from '#shared/resources/charge/models/Charge';
import type { PayloadBody } from '#shared/types/api';

export type CreateChargeServicePayload = {
  merchant_id: string;
  amount: number;
  expires_in?: number;
  description?: string;
  auto_pay_after_seconds?: number;
};

export function createChargeService({ body }: PayloadBody<CreateChargeServicePayload>) {
  return appClient.post<ICentralCharge>('/api/central/charges', { body });
}
