<script setup lang="ts">
import { Loader2 } from '@lucide/vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { toast } from 'vue-sonner';
import { GET_MERCHANT_KEY } from '~/resources/merchant/services/getMerchant';
import { GET_MERCHANTS_KEY } from '~/resources/merchant/services/getMerchants';
import { updateMerchantSimulationService } from '~/resources/merchant/services/updateMerchantSimulation';
import { createPixService } from '~/resources/pix/services/createPix';
import type { ICentralMerchant } from '#shared/resources/merchant/models/Merchant';
import type { ISimulationSettings } from '#shared/resources/simulation/models/SimulationSettings';

const props = defineProps<{ merchant: ICentralMerchant }>();

const { m, locale } = useI18n();
const errorText = useApiErrorText();
const queryClient = useQueryClient();

const form = reactive({
  outage: false,
  latency_ms: 0,
  failure_rate: 0,
  webhook_drop: false,
  webhook_delay_seconds: 0,
  webhook_duplicates: 0,
  auto_pay: false,
  auto_pay_seconds: 15,
});

watch(() => props.merchant.simulation_settings, (settings) => {
  Object.assign(form, {
    outage: settings.outage,
    latency_ms: settings.latency_ms,
    failure_rate: settings.failure_rate,
    webhook_drop: settings.webhook_drop,
    webhook_delay_seconds: settings.webhook_delay_seconds,
    webhook_duplicates: settings.webhook_duplicates,
    auto_pay: settings.auto_pay_after_seconds !== null,
    auto_pay_seconds: settings.auto_pay_after_seconds ?? 15,
  });
}, { immediate: true });

const activeCount = computed(() => {
  const s = props.merchant.simulation_settings;
  return [s.outage, s.latency_ms > 0, s.failure_rate > 0, s.webhook_drop, s.webhook_delay_seconds > 0, s.webhook_duplicates > 0, s.auto_pay_after_seconds !== null]
    .filter(Boolean).length;
});

const save = useMutation({
  mutationFn: () => {
    const body: ISimulationSettings = {
      outage: form.outage,
      latency_ms: form.latency_ms || 0,
      failure_rate: form.failure_rate || 0,
      webhook_drop: form.webhook_drop,
      webhook_delay_seconds: form.webhook_delay_seconds || 0,
      webhook_duplicates: form.webhook_duplicates || 0,
      auto_pay_after_seconds: form.auto_pay ? form.auto_pay_seconds || 0 : null,
    };

    return updateMerchantSimulationService({ merchantId: props.merchant.id, body });
  },
  onSuccess: ({ data, message }) => {
    toast.success(message[locale.value]);
    queryClient.setQueryData(GET_MERCHANT_KEY(props.merchant.id), (old: { data: ICentralMerchant } | undefined) => (old ? { ...old, data } : old));
    queryClient.invalidateQueries({ queryKey: GET_MERCHANTS_KEY });
  },
  onError: failure => toast.error(errorText(failure)),
});

const pixAmount = ref('25,00');
const pixCents = computed(() => parseMoneyInput(pixAmount.value));

const sendPix = useMutation({
  mutationFn: () => createPixService({ body: { merchant_id: props.merchant.id, amount: pixCents.value! } }),
  onSuccess: ({ message }) => toast.success(message[locale.value]),
  onError: failure => toast.error(errorText(failure)),
});

type NumberField = 'latency_ms' | 'failure_rate' | 'webhook_delay_seconds' | 'webhook_duplicates';
type Row = { key: string; label: string; hint: string } & (
  | { kind: 'switch'; field: 'outage' | 'webhook_drop' }
  | { kind: 'number'; field: NumberField; unit: string; max: number }
);

const groups = computed<{ id: string; title: string; rows: Row[] }[]>(() => {
  const s = m.value.scenarios;
  return [
    {
      id: 'api',
      title: s.groups.api,
      rows: [
        { key: 'outage', kind: 'switch', field: 'outage', label: s.outage, hint: s.outageHint },
        { key: 'latency', kind: 'number', field: 'latency_ms', unit: 'ms', max: 60_000, label: s.latency, hint: s.latencyHint },
        { key: 'failure', kind: 'number', field: 'failure_rate', unit: '%', max: 100, label: s.failureRate, hint: s.failureRateHint },
      ],
    },
    {
      id: 'webhooks',
      title: s.groups.webhooks,
      rows: [
        { key: 'drop', kind: 'switch', field: 'webhook_drop', label: s.webhookDrop, hint: s.webhookDropHint },
        { key: 'delay', kind: 'number', field: 'webhook_delay_seconds', unit: 's', max: 86_400, label: s.webhookDelay, hint: s.webhookDelayHint },
        { key: 'duplicates', kind: 'number', field: 'webhook_duplicates', unit: s.copiesUnit, max: 10, label: s.webhookDuplicates, hint: s.webhookDuplicatesHint },
      ],
    },
  ];
});
</script>

<template>
  <section aria-labelledby="simulation-title" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h3 id="simulation-title" class="text-base font-semibold">
        {{ m.scenarios.title }}
      </h3>
      <span class="text-[13px]" :class="activeCount ? 'font-medium text-foreground' : 'text-muted-foreground'">
        {{ m.scenarios.active(activeCount) }}
      </span>
    </div>
    <p class="-mt-2 text-[13px] text-muted-foreground">
      {{ m.scenarios.hint }}
    </p>

    <form class="flex flex-col gap-5" @submit.prevent="save.mutate()">
      <fieldset v-for="group in groups" :key="group.id" class="flex flex-col gap-2">
        <legend class="mb-2 text-[13px] font-medium text-muted-foreground">
          {{ group.title }}
        </legend>
        <div v-for="row in group.rows" :key="row.key" class="flex items-center justify-between gap-4 rounded-lg bg-muted px-3 py-2.5">
          <Label :for="`sim-${row.key}`" class="flex min-w-0 flex-col items-start gap-0.5 font-normal">
            <span class="text-sm font-medium">{{ row.label }}</span>
            <span class="text-[13px] text-muted-foreground">{{ row.hint }}</span>
          </Label>
          <Switch v-if="row.kind === 'switch'" :id="`sim-${row.key}`" v-model="form[row.field]" />
          <div v-else class="relative w-28 shrink-0">
            <Input :id="`sim-${row.key}`" v-model.number="form[row.field]" type="number" min="0" :max="row.max" class="num bg-background pr-14" />
            <span class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">{{ row.unit }}</span>
          </div>
        </div>
      </fieldset>

      <fieldset class="flex flex-col gap-2">
        <legend class="mb-2 text-[13px] font-medium text-muted-foreground">
          {{ m.scenarios.groups.payments }}
        </legend>
        <div class="flex items-center justify-between gap-4 rounded-lg bg-muted px-3 py-2.5">
          <Label for="sim-autopay" class="flex min-w-0 flex-col items-start gap-0.5 font-normal">
            <span class="text-sm font-medium">{{ m.scenarios.autoPay }}</span>
            <span class="text-[13px] text-muted-foreground">{{ m.scenarios.autoPayHint }}</span>
          </Label>
          <div class="flex shrink-0 items-center gap-2">
            <div v-if="form.auto_pay" class="relative w-20">
              <Input v-model.number="form.auto_pay_seconds" type="number" min="0" max="86400" class="num bg-background pr-6" :aria-label="m.scenarios.autoPaySeconds" />
              <span class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">s</span>
            </div>
            <Switch id="sim-autopay" v-model="form.auto_pay" />
          </div>
        </div>
      </fieldset>

      <div class="flex justify-end">
        <Button type="submit" :disabled="save.isPending.value">
          <Loader2 v-if="save.isPending.value" class="size-4 animate-spin" />
          {{ save.isPending.value ? m.common.saving : m.scenarios.save }}
        </Button>
      </div>
    </form>

    <form class="flex flex-wrap items-end gap-4 rounded-lg border p-4" @submit.prevent="sendPix.mutate()">
      <div class="flex min-w-0 flex-1 basis-60 flex-col gap-0.5">
        <span class="text-sm font-medium">{{ m.scenarios.pix }}</span>
        <span class="text-[13px] text-muted-foreground">{{ m.scenarios.pixHint }}</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative w-32">
          <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
          <Input v-model="pixAmount" inputmode="decimal" class="num pl-9" :aria-label="m.scenarios.pixAmount" :aria-invalid="pixCents === null" />
        </div>
        <Button type="submit" variant="outline" :disabled="sendPix.isPending.value || pixCents === null">
          <Loader2 v-if="sendPix.isPending.value" class="size-4 animate-spin" />
          {{ m.scenarios.pixSubmit }}
        </Button>
      </div>
    </form>
  </section>
</template>
