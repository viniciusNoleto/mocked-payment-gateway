<script setup lang="ts">
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';

/**
 * A moeda de uma cobrança. Pendente, o aro é a contagem regressiva até expirar;
 * paga, a moeda está cunhada em ouro; expirada ou cancelada, vira níquel.
 */
const props = withDefaults(defineProps<{
  status: `${EChargeStatus}` | 'mark';
  /** Fração do prazo que ainda resta (1 = acabou de nascer, 0 = expira agora). Só para pendentes. */
  remaining?: number;
  size?: number;
  glyph?: string;
}>(), { remaining: 1, size: 32, glyph: 'R$' });

const RADIUS = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const arc = computed(() => CIRCUMFERENCE * Math.min(1, Math.max(0, props.remaining)));

const minting = ref(false);
watch(() => props.status, (next, prev) => {
  if (next === EChargeStatus.PAID && prev === EChargeStatus.PENDING) {
    minting.value = true;
    setTimeout(() => (minting.value = false), 650);
  }
});

const isGold = computed(() => props.status === EChargeStatus.PAID || props.status === 'mark');
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 36 36"
    aria-hidden="true"
    class="shrink-0"
    :class="{ 'coin-mint': minting }"
  >
    <template v-if="isGold">
      <circle cx="18" cy="18" r="17" fill="var(--gold-500)" />
      <circle cx="18" cy="18" r="17" fill="none" stroke="var(--gold-600)" stroke-width="1.5" />
      <circle cx="18" cy="18" r="12.5" fill="none" stroke="var(--gold-700)" stroke-width="1" stroke-opacity="0.55" />
      <path d="M9 13.2 A10 10 0 0 1 14 8.6" fill="none" stroke="var(--gold-100)" stroke-width="1.6" stroke-linecap="round" />
    </template>

    <template v-else-if="status === EChargeStatus.PENDING">
      <circle cx="18" cy="18" r="17" fill="var(--gold-50)" />
      <circle cx="18" cy="18" :r="RADIUS" fill="none" stroke="var(--nickel-200)" stroke-width="3" />
      <circle
        cx="18"
        cy="18"
        :r="RADIUS"
        fill="none"
        stroke="var(--gold-500)"
        stroke-width="3"
        stroke-linecap="butt"
        :stroke-dasharray="`${arc} ${CIRCUMFERENCE}`"
        transform="rotate(-90 18 18)"
        style="transition: stroke-dasharray 1s linear"
      />
    </template>

    <template v-else>
      <circle cx="18" cy="18" r="17" :fill="status === EChargeStatus.EXPIRED ? 'var(--nickel-200)' : 'var(--background)'" />
      <circle cx="18" cy="18" r="16.25" fill="none" stroke="var(--nickel-400)" stroke-width="1.5" />
      <path v-if="status === EChargeStatus.CANCELLED" d="M8.5 27.5 L27.5 8.5" stroke="var(--nickel-400)" stroke-width="1.5" />
    </template>

    <text
      x="18"
      y="18"
      text-anchor="middle"
      dominant-baseline="central"
      font-family="IBM Plex Sans, system-ui, sans-serif"
      font-weight="600"
      :font-size="glyph.length > 1 ? 10 : 15"
      :fill="isGold ? 'var(--gold-900)' : status === EChargeStatus.PENDING ? 'var(--gold-800)' : 'var(--nickel-600)'"
    >{{ glyph }}</text>
  </svg>
</template>
