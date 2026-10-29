import { appClient } from '~/utils/appClient';
import type { ICentralMerchant } from '#shared/resources/merchant/models/Merchant';
import type { ISimulationSettings } from '#shared/resources/simulation/models/SimulationSettings';
import type { PayloadBody } from '#shared/types/api';

export type UpdateMerchantSimulationServicePayload = Partial<ISimulationSettings>;

export function updateMerchantSimulationService({ merchantId, body }: PayloadBody<UpdateMerchantSimulationServicePayload> & { merchantId: string }) {
  return appClient.put<ICentralMerchant>(`/api/central/merchants/${merchantId}/simulation`, { body });
}
