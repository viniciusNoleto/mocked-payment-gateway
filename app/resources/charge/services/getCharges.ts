import { appClient } from '~/utils/appClient';
import type { ICentralCharge } from '#shared/resources/charge/models/Charge';
import type { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';
import type { PaginatedResponse, PayloadQuery } from '#shared/types/api';
import type { QueryFnCtx } from '#shared/types/tanstack';

export type GetChargesServiceQuery = {
  status?: `${EChargeStatus}`;
  merchant_id?: string;
  page?: number;
  per_page?: number;
};

export const GET_CHARGES_KEY = ['get-charges'];

export function getChargesService({ signal, query }: QueryFnCtx & PayloadQuery<GetChargesServiceQuery>) {
  const params = new URLSearchParams();

  if (query?.status) params.set('status', query.status);
  if (query?.merchant_id) params.set('merchant_id', query.merchant_id);
  if (query?.page) params.set('page', String(query.page));
  if (query?.per_page) params.set('per_page', String(query.per_page));

  const qs = params.toString();

  return appClient.get<PaginatedResponse<ICentralCharge>>(`/api/central/charges${qs ? `?${qs}` : ''}`, { signal });
}
