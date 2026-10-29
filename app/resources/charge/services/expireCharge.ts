import { appClient } from '~/utils/appClient';
import type { ICentralCharge } from '#shared/resources/charge/models/Charge';

export function expireChargeService({ txid }: { txid: string }) {
  return appClient.post<ICentralCharge>(`/api/central/charges/${txid}/expire`, { body: {} });
}
