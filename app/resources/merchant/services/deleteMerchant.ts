import { appClient } from '~/utils/appClient';

export function deleteMerchantService({ merchantId }: { merchantId: string }) {
  return appClient.delete<null>(`/api/central/merchants/${merchantId}`);
}
