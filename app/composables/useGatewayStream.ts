import { useQueryClient } from '@tanstack/vue-query';
import { openGatewayStream, type GatewayStreamStatus } from '~/utils/gatewayStream';
import { GET_CHARGES_KEY } from '~/resources/charge/services/getCharges';
import { GET_CHARGE_KEY } from '~/resources/charge/services/getCharge';
import { GET_CHARGE_STATS_KEY } from '~/resources/charge/services/getChargeStats';
import { GET_MERCHANTS_KEY } from '~/resources/merchant/services/getMerchants';
import type { AppApiResponse } from '#shared/types/api';
import type { ICentralCharge } from '#shared/resources/charge/models/Charge';
import { ERealtimeEvent } from '#shared/resources/realtime/enums/RealtimeEvent';
import type { IRealtimeMessage } from '#shared/resources/realtime/models/RealtimeMessage';

const ACTIVITY_LIMIT = 40;
const ARRIVAL_MS = 1_800;

const status = ref<GatewayStreamStatus>('idle');
const activity = ref<IRealtimeMessage[]>([]);
/** txids criados há instantes, para a linha nova ganhar o destaque de chegada. */
const arrivals = ref<Record<string, string>>({});
let close: (() => void) | null = null;

/**
 * Canal ao vivo da central (`/api/central/events`, todos os clientes). Cada evento atualiza o cache do
 * TanStack Query: a lista e os totais são recarregados e o detalhe recebe o estado novo na hora.
 */
export function useGatewayStream() {
  const queryClient = useQueryClient();

  const handleMessage = (message: IRealtimeMessage) => {
    activity.value = [message, ...activity.value].slice(0, ACTIVITY_LIMIT);

    const { txid, charge } = message.data;
    if (!txid) {
      queryClient.invalidateQueries({ queryKey: GET_MERCHANTS_KEY });
      return;
    }

    if (message.event === ERealtimeEvent.CHARGE_CREATED) {
      arrivals.value = { ...arrivals.value, [txid]: message.id };
      setTimeout(() => {
        const { [txid]: _, ...rest } = arrivals.value;
        arrivals.value = rest;
      }, ARRIVAL_MS);
    }

    queryClient.invalidateQueries({ queryKey: GET_CHARGES_KEY });
    queryClient.invalidateQueries({ queryKey: GET_CHARGE_STATS_KEY });
    queryClient.invalidateQueries({ queryKey: GET_MERCHANTS_KEY });

    if (charge) {
      queryClient.setQueryData<AppApiResponse<ICentralCharge>>(GET_CHARGE_KEY(txid), old => old
        ? { ...old, data: { ...charge, merchant: message.merchant } }
        : old);
    } else {
      queryClient.invalidateQueries({ queryKey: GET_CHARGE_KEY(txid) });
    }
  };

  const connect = () => {
    if (close) return;
    close = openGatewayStream({ url: '/api/central/events', onMessage: handleMessage, onStatus: next => (status.value = next) });
  };

  const disconnect = () => {
    close?.();
    close = null;
    status.value = 'idle';
  };

  return {
    status: readonly(status),
    activity: readonly(activity),
    arrivals: readonly(arrivals),
    connect,
    disconnect,
  };
}
