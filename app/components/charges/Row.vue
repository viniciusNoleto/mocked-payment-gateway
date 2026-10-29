<script setup lang="ts">
import { Loader2 } from '@lucide/vue';
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';
import type { ICentralCharge } from '#shared/resources/charge/models/Charge';

const props = defineProps<{
  charge: ICentralCharge;
  selected: boolean;
  arriving: boolean;
  paying: boolean;
}>();

const emit = defineEmits<{ select: []; pay: [] }>();

const { m } = useI18n();
const now = useNowTick();

const secondsLeft = computed(() => (new Date(props.charge.expires_at).getTime() - now.value) / 1000);
const remaining = computed(() => Math.max(0, secondsLeft.value) / props.charge.expires_in);
const isPending = computed(() => props.charge.status === EChargeStatus.PENDING);

const when = computed(() => {
  const c = props.charge;
  const labels = m.value.charges.when;
  if (c.status === EChargeStatus.PENDING) return { value: formatCountdown(secondsLeft.value), label: secondsLeft.value > 0 ? labels.toExpire : labels.expiring };
  if (c.status === EChargeStatus.PAID && c.paid_at) return { value: formatClock(c.paid_at), label: labels.paidAt };
  if (c.status === EChargeStatus.EXPIRED && c.expired_at) return { value: formatClock(c.expired_at), label: labels.expiredAt };
  if (c.status === EChargeStatus.CANCELLED && c.cancelled_at) return { value: formatClock(c.cancelled_at), label: labels.cancelledAt };
  return { value: '—', label: '' };
});

const caption = computed(() => props.charge.description ?? props.charge.external_reference ?? m.value.charges.noDescription);
</script>

<template>
  <li
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    :aria-label="m.charges.rowLabel(formatMoney(charge.amount), charge.merchant.name)"
    class="group grid cursor-pointer grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-md px-3 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:h-[60px] sm:grid-cols-[32px_minmax(0,1fr)_132px_96px_156px] sm:gap-x-4 sm:py-0"
    :class="[selected ? '!bg-[var(--row-selected)]' : '', arriving ? 'row-arrive' : '']"
    @click="emit('select')"
    @keydown.enter.prevent="emit('select')"
    @keydown.space.prevent="emit('select')"
  >
    <AppCoinMark :status="charge.status" :remaining="remaining" :size="32" />

    <div class="min-w-0">
      <p class="num text-[15px] leading-5 font-medium">
        {{ formatMoney(charge.amount) }}
      </p>
      <p class="truncate text-[13px] leading-5 text-muted-foreground" :title="charge.txid">
        <span class="text-foreground sm:hidden">{{ charge.merchant.name }} · </span>{{ caption }}
        <span class="sm:hidden"> · {{ when.label }} {{ when.value }}</span>
      </p>
    </div>

    <p class="hidden min-w-0 items-center gap-2 text-[13px] sm:flex">
      <AppClientMark :id="charge.merchant.id" :name="charge.merchant.name" />
      <span class="truncate">{{ charge.merchant.name }}</span>
    </p>

    <p class="hidden text-right sm:block">
      <span class="num block text-sm leading-5" :class="isPending && secondsLeft < 60 ? 'text-negative' : ''">{{ when.value }}</span>
      <span class="block text-xs leading-4 text-muted-foreground">{{ when.label }}</span>
    </p>

    <div class="flex justify-end">
      <Button
        v-if="isPending"
        variant="coin"
        size="sm"
        class="sm:w-full sm:max-w-[148px]"
        :disabled="paying"
        @click.stop="emit('pay')"
        @keydown.enter.stop
        @keydown.space.stop
      >
        <Loader2 v-if="paying" class="size-3.5 animate-spin" />
        <span class="sm:hidden">{{ paying ? m.charges.paying : m.charges.pay }}</span>
        <span class="hidden sm:inline">{{ paying ? m.charges.paying : m.charges.markPaid }}</span>
      </Button>
      <ChargesStatusPill v-else :status="charge.status" />
    </div>
  </li>
</template>
