import { appClient } from '~/utils/appClient';
import type { IChargeStats } from '#shared/resources/charge/models/ChargeStats';
import type { PayloadQuery } from '#shared/types/api';
import type { QueryFnCtx } from '#shared/types/tanstack';

export type GetChargeStatsServiceQuery = {
  merchant_id?: string;
};

export const GET_CHARGE_STATS_KEY = ['get-charge-stats'];

export function getChargeStatsService({ signal, query }: QueryFnCtx & PayloadQuery<GetChargeStatsServiceQuery>) {
  const params = new URLSearchParams();

  if (query?.merchant_id) params.set('merchant_id', query.merchant_id);

  const qs = params.toString();

  return appClient.get<IChargeStats>(`/api/central/charges/stats${qs ? `?${qs}` : ''}`, { signal });
}
