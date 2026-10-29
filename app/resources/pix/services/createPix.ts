import { appClient } from '~/utils/appClient';
import type { IPix } from '#shared/resources/pix/models/Pix';
import type { PayloadBody } from '#shared/types/api';

export type CreatePixServicePayload = {
  merchant_id: string;
  amount: number;
  payer?: { name?: string; document?: string; ispb?: string };
  info_payer?: string;
};

export function createPixService({ body }: PayloadBody<CreatePixServicePayload>) {
  return appClient.post<IPix>('/api/central/pix', { body });
}
