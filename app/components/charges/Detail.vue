<script setup lang="ts">
import { X } from '@lucide/vue';
import { useQuery } from '@tanstack/vue-query';
import { getChargeService, GET_CHARGE_KEY } from '~/resources/charge/services/getCharge';
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';

const props = withDefaults(defineProps<{ txid: string; closable?: boolean }>(), { closable: true });
defineEmits<{ close: [] }>();

const { m } = useI18n();
const errorText = useApiErrorText();

const query = useQuery({
  queryKey: computed(() => GET_CHARGE_KEY(props.txid)),
  queryFn: ({ signal }) => getChargeService({ signal, txid: props.txid }),
});

const charge = computed(() => query.data.value?.data ?? null);

const { expire, cancel } = useChargeActions();
const now = useNowTick();

const secondsLeft = computed(() => charge.value ? (new Date(charge.value.expires_at).getTime() - now.value) / 1000 : 0);
const remaining = computed(() => charge.value ? Math.max(0, secondsLeft.value) / charge.value.expires_in : 1);
const isPending = computed(() => charge.value?.status === EChargeStatus.PENDING);

const fields = computed(() => {
  const c = charge.value;
  if (!c) return [];
  const labels = m.value.detail.fields;

  return [
    { label: labels.txid, value: c.txid, mono: true, copy: true },
    { label: labels.created, value: formatDateTime(c.created_at) },
    { label: labels.expires, value: formatDateTime(c.expires_at) },
    { label: labels.paidAt, value: c.paid_at ? formatDateTime(c.paid_at) : null },
    { label: labels.e2e, value: c.e2e_id, mono: true, copy: true },
    { label: labels.confirmedBy, value: c.confirmed_by ? m.value.detail.sources[c.confirmed_by] : null },
    { label: labels.payer, value: c.payer.name },
    { label: labels.reference, value: c.external_reference, mono: true },
    { label: labels.autoPay, value: c.auto_pay_at && isPending.value ? formatDateTime(c.auto_pay_at) : null },
  ];
});
</script>

<template>
  <section class="flex flex-col gap-6" :aria-label="m.detail.aria">
    <div v-if="query.isPending.value" class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <div class="size-12 rounded-full bg-muted" />
        <div class="h-7 w-32 rounded bg-muted" />
      </div>
      <div class="h-40 rounded-lg bg-muted" />
    </div>

    <div v-else-if="query.isError.value" class="flex flex-col gap-2 rounded-lg border p-4">
      <p class="text-sm">
        {{ m.detail.loadError }} {{ errorText(query.error.value) }}
      </p>
      <Button variant="link" size="sm" class="h-auto justify-start px-0" @click="query.refetch()">
        {{ m.common.retry }}
      </Button>
    </div>

    <template v-else-if="charge">
      <header class="flex items-start gap-3" :class="closable ? '' : 'pr-8'">
        <AppCoinMark :status="charge.status" :remaining="remaining" :size="48" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="num text-[26px] leading-8 font-medium">
              {{ formatMoney(charge.amount) }}
            </h2>
            <ChargesStatusPill :status="charge.status" />
          </div>
          <p class="mt-0.5 truncate text-sm text-muted-foreground">
            <template v-if="isPending">
              {{ m.detail.expiresIn }} <span class="num text-foreground">{{ formatCountdown(secondsLeft) }}</span> ·
            </template>
            {{ charge.description ?? m.charges.noDescription }}
          </p>
        </div>
        <Button v-if="closable" variant="ghost" size="icon-sm" :aria-label="m.detail.closeDetail" @click="$emit('close')">
          <X class="size-4" />
        </Button>
      </header>

      <NuxtLink
        :to="{ path: '/clientes', query: { id: charge.merchant.id } }"
        class="-mt-2 flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5 transition-colors hover:bg-[var(--nav-active)] focus-visible:outline-2 focus-visible:outline-ring"
      >
        <AppClientMark :id="charge.merchant.id" :name="charge.merchant.name" :size="28" />
        <span class="min-w-0">
          <span class="block text-xs text-muted-foreground">{{ m.detail.fields.client }}</span>
          <span class="block truncate text-sm font-medium">{{ charge.merchant.name }}</span>
        </span>
      </NuxtLink>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[13px] font-medium">{{ m.detail.copyPaste }}</span>
          <AppCopyButton :value="charge.qr_code" show-text />
        </div>
        <p class="rounded-md border px-3 py-2 font-mono text-xs leading-[18px] break-all text-muted-foreground" :class="isPending ? '' : 'opacity-60'">
          {{ charge.qr_code }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ m.detail.qrHint }}
        </p>
      </div>

      <div v-if="isPending" class="flex flex-col gap-4 rounded-lg bg-muted p-4">
        <h3 class="text-base font-semibold">
          {{ m.detail.simulate }}
        </h3>
        <ChargesPayForm :charge="charge" />
      </div>

      <dl class="flex flex-col">
        <div v-for="field in fields" :key="field.label" class="grid min-h-8 grid-cols-[120px_minmax(0,1fr)] items-center gap-3 border-b border-rule py-1 last:border-0">
          <dt class="text-[13px] text-muted-foreground">
            {{ field.label }}
          </dt>
          <dd class="flex min-w-0 items-center justify-end gap-1 text-right text-[13px]">
            <span v-if="field.value === null" class="text-nickel-400">—</span>
            <template v-else>
              <span class="truncate" :class="field.mono ? 'font-mono' : 'num'" :title="field.value">{{ field.value }}</span>
              <AppCopyButton v-if="field.copy" :value="field.value" :label="field.label" />
            </template>
          </dd>
        </div>
      </dl>

      <div v-if="isPending" class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" :disabled="expire.isPending.value" @click="expire.mutate(charge.txid)">
          {{ m.detail.expireNow }}
        </Button>
        <Button variant="ghost" size="sm" class="text-negative hover:bg-[var(--pill-negative-bg)] hover:text-negative" :disabled="cancel.isPending.value" @click="cancel.mutate(charge.txid)">
          {{ m.detail.cancel }}
        </Button>
      </div>
    </template>
  </section>
</template>
