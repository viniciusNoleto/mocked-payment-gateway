import { appClient } from '~/utils/appClient';
import type { ICentralMerchant } from '#shared/resources/merchant/models/Merchant';
import type { QueryFnCtx } from '#shared/types/tanstack';

export const GET_MERCHANT_KEY = (merchantId: string) => ['get-merchant', merchantId];

export function getMerchantService({ signal, merchantId }: QueryFnCtx & { merchantId: string }) {
  return appClient.get<ICentralMerchant>(`/api/central/merchants/${merchantId}`, { signal });
}
