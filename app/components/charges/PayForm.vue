<script setup lang="ts">
import { Loader2 } from '@lucide/vue';
import type { ICharge } from '#shared/resources/charge/models/Charge';
import type { PayChargeServicePayload } from '~/resources/charge/services/payCharge';

const props = defineProps<{ charge: ICharge }>();

const { pay } = useChargeActions();
const { m } = useI18n();

type WebhookChoice = 'send' | 'delay' | 'skip' | 'duplicate';

const payerName = ref('');
const webhook = ref<WebhookChoice>('send');
const delaySeconds = ref(120);
const duplicates = ref(2);

watch(() => props.charge.txid, () => {
  payerName.value = '';
  webhook.value = 'send';
});

function submit() {
  const body: PayChargeServicePayload = {};
  if (payerName.value.trim()) body.payer = { name: payerName.value.trim() };
  if (webhook.value === 'skip') body.webhook = { mode: 'skip' };
  if (webhook.value === 'delay') body.webhook = { mode: 'send', delay_seconds: delaySeconds.value };
  if (webhook.value === 'duplicate') body.webhook = { mode: 'send', duplicates: duplicates.value };

  pay.mutate({ txid: props.charge.txid, body });
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <div class="flex flex-col gap-2">
      <Label for="pay-payer">{{ m.pay.payer }}</Label>
      <Input id="pay-payer" v-model="payerName" :placeholder="m.pay.payerPlaceholder" autocomplete="off" aria-describedby="pay-amount-help" />
      <p id="pay-amount-help" class="text-[13px] text-muted-foreground">
        {{ m.pay.exact(formatMoney(charge.amount)) }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <Label for="pay-webhook">{{ m.pay.webhook }}</Label>
      <div class="flex gap-2">
        <Select v-model="webhook">
          <SelectTrigger id="pay-webhook" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="(label, value) in m.pay.modes" :key="value" :value="value">
              {{ label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <div v-if="webhook === 'delay'" class="relative w-28 shrink-0">
          <Input v-model.number="delaySeconds" type="number" min="1" max="86400" class="num pr-6" :aria-label="m.pay.seconds" />
          <span class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">s</span>
        </div>
        <div v-if="webhook === 'duplicate'" class="relative w-28 shrink-0">
          <Input v-model.number="duplicates" type="number" min="1" max="10" class="num pr-12" :aria-label="m.pay.copies" />
          <span class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">{{ m.pay.copiesUnit }}</span>
        </div>
      </div>
      <p class="text-[13px] text-muted-foreground">
        {{ m.pay.help[webhook] }}
      </p>
    </div>

    <Button type="submit" class="h-10 w-full" :disabled="pay.isPending.value">
      <Loader2 v-if="pay.isPending.value" class="size-4 animate-spin" />
      {{ m.pay.submit }}
    </Button>
  </form>
</template>
