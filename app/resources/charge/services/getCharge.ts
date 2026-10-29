import { appClient } from '~/utils/appClient';
import type { ICentralCharge } from '#shared/resources/charge/models/Charge';
import type { QueryFnCtx } from '#shared/types/tanstack';

export const GET_CHARGE_KEY = (txid: string) => ['get-charge', txid];

export function getChargeService({ signal, txid }: QueryFnCtx & { txid: string }) {
  return appClient.get<ICentralCharge>(`/api/central/charges/${txid}`, { signal });
}
