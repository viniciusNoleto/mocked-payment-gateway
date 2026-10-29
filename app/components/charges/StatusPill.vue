<script setup lang="ts">
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';

const props = defineProps<{ status: `${EChargeStatus}` }>();

const TONES: Record<EChargeStatus, string> = {
  [EChargeStatus.PENDING]: 'bg-[var(--pill-pending-bg)] text-[var(--pill-pending-ink)]',
  [EChargeStatus.PAID]: 'bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)]',
  [EChargeStatus.EXPIRED]: 'bg-[var(--pill-neutral-bg)] text-[var(--pill-neutral-ink)]',
  [EChargeStatus.CANCELLED]: 'bg-[var(--pill-negative-bg)] text-[var(--pill-negative-ink)]',
};

const { m } = useI18n();
const label = computed(() => m.value.status[props.status]);
const tone = computed(() => TONES[props.status as EChargeStatus]);
</script>

<template>
  <span class="inline-flex h-5 flex-none items-center whitespace-nowrap rounded-full px-2 text-xs font-medium" :class="tone">
    {{ label }}
  </span>
</template>
