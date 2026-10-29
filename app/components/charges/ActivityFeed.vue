<script setup lang="ts">
import { ERealtimeEvent } from '#shared/resources/realtime/enums/RealtimeEvent';
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';
import type { IRealtimeMessage } from '#shared/resources/realtime/models/RealtimeMessage';

defineEmits<{ select: [txid: string] }>();

const { activity, status } = useGatewayStream();
const { m } = useI18n();
const now = useNowTick();
const origin = useGatewayOrigin();

const COIN: Record<ERealtimeEvent, `${EChargeStatus}`> = {
  [ERealtimeEvent.CHARGE_CREATED]: EChargeStatus.PENDING,
  [ERealtimeEvent.CHARGE_PAID]: EChargeStatus.PAID,
  [ERealtimeEvent.CHARGE_EXPIRED]: EChargeStatus.EXPIRED,
  [ERealtimeEvent.CHARGE_CANCELLED]: EChargeStatus.CANCELLED,
  [ERealtimeEvent.PIX_RECEIVED]: EChargeStatus.PAID,
};

function amountOf(message: IRealtimeMessage): number | null {
  return message.data.pix?.amount ?? message.data.charge?.amount ?? null;
}

const curl = computed(() => `curl -X POST ${origin}/api/charges \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 4990, "description": "Pedido 1042"}'`);
</script>

<template>
  <section class="flex flex-col gap-3" aria-labelledby="activity-title">
    <div class="flex items-baseline justify-between gap-3">
      <h2 id="activity-title" class="text-base font-semibold">
        {{ m.activity.title }}
      </h2>
      <span class="text-xs text-muted-foreground">{{ m.activity.count(activity.length) }}</span>
    </div>
    <p class="text-[13px] text-muted-foreground">
      {{ m.activity.description }}
    </p>

    <ul v-if="activity.length" class="flex flex-col">
      <li v-for="message in activity" :key="message.id">
        <button
          type="button"
          class="grid w-full grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default disabled:hover:bg-transparent"
          :disabled="!message.data.txid"
          @click="message.data.txid && $emit('select', message.data.txid)"
        >
          <AppCoinMark :status="COIN[message.event]" :size="20" glyph="" />
          <span class="min-w-0">
            <span class="block text-[13px] leading-5">
              {{ m.activity.events[message.event] }}
              <span v-if="amountOf(message) !== null" class="num font-medium">· {{ formatMoney(amountOf(message)!) }}</span>
            </span>
            <span class="flex min-w-0 items-center gap-1.5 text-xs leading-4 text-muted-foreground">
              <AppClientMark :id="message.merchant.id" :name="message.merchant.name" :size="14" />
              <span class="truncate">{{ message.merchant.name }} · <span class="font-mono">{{ message.event }}</span></span>
            </span>
          </span>
          <span class="num text-xs text-muted-foreground">{{ formatAgo(message.created_at, now) }}</span>
        </button>
      </li>
    </ul>

    <div v-else class="flex flex-col gap-3 rounded-lg border border-dashed p-4">
      <p class="text-sm">
        {{ status === 'live' ? m.activity.emptyLive : m.activity.emptyWaiting }}
      </p>
      <p class="text-[13px] text-muted-foreground">
        {{ m.activity.emptyHint }}
      </p>
      <DocsCodeBlock :code="curl" lang="bash" compact />
    </div>
  </section>
</template>
