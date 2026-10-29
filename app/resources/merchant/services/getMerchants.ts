import { appClient } from '~/utils/appClient';
import type { ICentralMerchant } from '#shared/resources/merchant/models/Merchant';
import type { PaginatedResponse, PayloadQuery } from '#shared/types/api';
import type { QueryFnCtx } from '#shared/types/tanstack';

export type GetMerchantsServiceQuery = {
  page?: number;
  per_page?: number;
};

export const GET_MERCHANTS_KEY = ['get-merchants'];

export function getMerchantsService({ signal, query }: QueryFnCtx & PayloadQuery<GetMerchantsServiceQuery>) {
  const params = new URLSearchParams();

  if (query?.page) params.set('page', String(query.page));
  if (query?.per_page) params.set('per_page', String(query.per_page));

  const qs = params.toString();

  return appClient.get<PaginatedResponse<ICentralMerchant>>(`/api/central/merchants${qs ? `?${qs}` : ''}`, { signal });
}
