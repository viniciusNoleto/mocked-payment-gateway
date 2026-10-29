import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { toast } from 'vue-sonner';
import { payChargeService, type PayChargeServicePayload } from '~/resources/charge/services/payCharge';
import { expireChargeService } from '~/resources/charge/services/expireCharge';
import { cancelChargeService } from '~/resources/charge/services/cancelCharge';
import { createChargeService, type CreateChargeServicePayload } from '~/resources/charge/services/createCharge';
import { GET_CHARGES_KEY } from '~/resources/charge/services/getCharges';
import { GET_CHARGE_KEY } from '~/resources/charge/services/getCharge';
import { GET_CHARGE_STATS_KEY } from '~/resources/charge/services/getChargeStats';

/** Ações do painel sobre uma cobrança. O stream também atualiza a tela; invalidar aqui cobre o caso sem stream. */
export function useChargeActions() {
  const queryClient = useQueryClient();
  const { m, locale } = useI18n();
  const errorText = useApiErrorText();

  const refresh = (txid?: string) => {
    queryClient.invalidateQueries({ queryKey: GET_CHARGES_KEY });
    queryClient.invalidateQueries({ queryKey: GET_CHARGE_STATS_KEY });
    if (txid) queryClient.invalidateQueries({ queryKey: GET_CHARGE_KEY(txid) });
  };

  const pay = useMutation({
    mutationFn: (input: { txid: string; body?: PayChargeServicePayload }) => payChargeService({ txid: input.txid, body: input.body ?? {} }),
    onSuccess: ({ data }) => {
      toast.success(m.value.toasts.paid(formatMoney(data.pix.amount)), {
        description: `${data.charge.merchant.name} · ${data.pix.payer.name} · ${data.pix.payer.bank_name}`,
      });
      refresh(data.charge.txid);
    },
    onError: failure => toast.error(errorText(failure)),
  });

  const expire = useMutation({
    mutationFn: (txid: string) => expireChargeService({ txid }),
    onSuccess: ({ data, message }) => {
      toast(`${message[locale.value]} ${formatMoney(data.amount)} · ${data.merchant.name}`);
      refresh(data.txid);
    },
    onError: failure => toast.error(errorText(failure)),
  });

  const cancel = useMutation({
    mutationFn: (txid: string) => cancelChargeService({ txid }),
    onSuccess: ({ data, message }) => {
      toast(`${message[locale.value]} ${formatMoney(data.amount)} · ${data.merchant.name}`);
      refresh(data.txid);
    },
    onError: failure => toast.error(errorText(failure)),
  });

  const create = useMutation({
    mutationFn: (body: CreateChargeServicePayload) => createChargeService({ body }),
    onSuccess: ({ data, message }) => {
      toast.success(`${message[locale.value]} ${formatMoney(data.amount)} · ${data.merchant.name}`, { description: `txid ${data.txid}` });
      refresh();
    },
    onError: failure => toast.error(errorText(failure)),
  });

  return { pay, expire, cancel, create };
}
