<script setup lang="ts">
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';
import type { IChargeStats } from '#shared/resources/charge/models/ChargeStats';

defineProps<{ stats: IChargeStats | null }>();

const model = defineModel<EChargeStatus>({ required: true });
const { m } = useI18n();

const STATUSES = [EChargeStatus.PENDING, EChargeStatus.PAID, EChargeStatus.EXPIRED, EChargeStatus.CANCELLED];
</script>

<template>
  <div role="tablist" :aria-label="m.tabs.aria" class="grid grid-cols-2 overflow-hidden rounded-lg border sm:grid-cols-4">
    <button
      v-for="(status, index) in STATUSES"
      :key="status"
      role="tab"
      type="button"
      :aria-selected="model === status"
      class="relative flex flex-col items-start gap-1 px-4 pt-3 pb-3.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      :class="[
        index > 0 ? 'sm:border-l' : '',
        index % 2 === 1 ? 'border-l' : '',
        index > 1 ? 'border-t sm:border-t-0' : '',
      ]"
      @click="model = status"
    >
      <span class="text-[13px]" :class="model === status ? 'font-semibold text-foreground' : 'text-muted-foreground'">{{ m.tabs[status] }}</span>
      <span class="num flex items-baseline gap-2 text-2xl leading-8">
        <span v-if="!stats" class="my-1.5 block h-5 w-8 rounded bg-muted" />
        <template v-else>{{ stats.counts[status] }}</template>
        <span v-if="status === EChargeStatus.PENDING && stats && stats.pending_amount > 0" class="text-sm text-muted-foreground">
          {{ formatMoney(stats.pending_amount) }}
        </span>
      </span>
      <span v-if="model === status" class="absolute inset-x-0 bottom-0 h-0.5 bg-gold-500" aria-hidden="true" />
    </button>
  </div>
</template>
