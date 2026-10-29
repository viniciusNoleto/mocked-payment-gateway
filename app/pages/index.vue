<script setup lang="ts">
import { Plus } from '@lucide/vue';
import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { useMediaQuery } from '@vueuse/core';
import { getChargesService, GET_CHARGES_KEY, type GetChargesServiceQuery } from '~/resources/charge/services/getCharges';
import { getChargeStatsService, GET_CHARGE_STATS_KEY } from '~/resources/charge/services/getChargeStats';
import { getMerchantsService, GET_MERCHANTS_KEY } from '~/resources/merchant/services/getMerchants';
import { EChargeStatus } from '#shared/resources/charge/enums/ChargeStatus';

definePageMeta({ section: 'panel', title: 'live' });

const LIST_SIZE = 50;
const ALL = 'all';

const route = useRoute();
const router = useRouter();
const { m } = useI18n();
const errorText = useApiErrorText();
const { status: streamStatus, arrivals } = useGatewayStream();
const { pay } = useChargeActions();
const now = useNowTick();

/** Sem o stream, a tela não fica parada: consulta a cada 5 s até reconectar. */
const fallbackInterval = computed(() => (streamStatus.value === 'live' ? false : 5000));

const filter = ref<EChargeStatus>(EChargeStatus.PENDING);

/** O cliente filtrado fica na URL (`?cliente=`), para a tela de Clientes poder linkar direto. */
const merchantFilter = computed({
  get: () => (route.query.cliente as string | undefined) ?? ALL,
  set: value => router.replace({ query: value === ALL ? {} : { cliente: value } }),
});
const merchantId = computed(() => (merchantFilter.value === ALL ? undefined : merchantFilter.value));

const merchants = useQuery({
  queryKey: [...GET_MERCHANTS_KEY, { per_page: 100 }],
  queryFn: ({ signal }) => getMerchantsService({ signal, query: { per_page: 100 } }),
});
const merchantList = computed(() => merchants.data.value?.data.items ?? []);

const listQuery = computed<GetChargesServiceQuery>(() => ({ status: filter.value, merchant_id: merchantId.value, per_page: LIST_SIZE }));

const list = useQuery({
  queryKey: computed(() => [...GET_CHARGES_KEY, listQuery.value]),
  queryFn: ({ signal }) => getChargesService({ signal, query: listQuery.value }),
  placeholderData: keepPreviousData,
  refetchInterval: fallbackInterval,
});

const stats = useQuery({
  queryKey: computed(() => [...GET_CHARGE_STATS_KEY, { merchant_id: merchantId.value }]),
  queryFn: ({ signal }) => getChargeStatsService({ signal, query: { merchant_id: merchantId.value } }),
  placeholderData: keepPreviousData,
  refetchInterval: fallbackInterval,
});

const pendingQuery = computed<GetChargesServiceQuery>(() => ({ status: EChargeStatus.PENDING, merchant_id: merchantId.value, per_page: LIST_SIZE }));
const pending = useQuery({
  queryKey: computed(() => [...GET_CHARGES_KEY, pendingQuery.value]),
  queryFn: ({ signal }) => getChargesService({ signal, query: pendingQuery.value }),
  refetchInterval: fallbackInterval,
});

/** A frase sob o título: o que precisa de atenção agora. */
const finding = computed(() => {
  const items = pending.data.value?.data.items;
  if (!items) return m.value.charges.findingLoading;
  if (items.length === 0) return m.value.charges.findingNone;

  const next = items.reduce((soonest, charge) => (charge.expires_at < soonest.expires_at ? charge : soonest));
  const seconds = (new Date(next.expires_at).getTime() - now.value) / 1000;
  return m.value.charges.finding(formatMoney(next.amount), next.merchant.name, formatCountdown(seconds));
});

const items = computed(() => list.data.value?.data.items ?? []);
const listTotal = computed(() => list.data.value?.data.meta.total ?? 0);

const selected = ref<string | null>(null);
const wide = useMediaQuery('(min-width: 1280px)');
const sheetOpen = computed({
  get: () => !wide.value && selected.value !== null,
  set: (open) => {
    if (!open) selected.value = null;
  },
});

const createOpen = ref(false);
const payingTxid = computed(() => (pay.isPending.value ? pay.variables.value?.txid ?? null : null));
const noClients = computed(() => merchants.isSuccess.value && merchantList.value.length === 0);
</script>

<template>
  <div class="flex flex-col gap-6 px-4 py-6 sm:px-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-[22px] leading-7 font-semibold">
          {{ m.charges.title }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ finding }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Select v-model="merchantFilter">
          <SelectTrigger class="w-[200px]" :aria-label="m.charges.client">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL">
              {{ m.charges.allClients }}
            </SelectItem>
            <SelectItem v-for="merchant in merchantList" :key="merchant.id" :value="merchant.id">
              {{ merchant.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button :disabled="noClients" @click="createOpen = true">
          <Plus class="size-4" />
          {{ m.charges.newCharge }}
        </Button>
      </div>
    </div>

    <div v-if="noClients" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3">
      <p class="text-sm">
        {{ m.charges.noClients }}
      </p>
      <Button as-child variant="outline" size="sm">
        <NuxtLink to="/clientes">
          {{ m.charges.goToClients }}
        </NuxtLink>
      </Button>
    </div>

    <ChargesStatusTabs v-model="filter" :stats="stats.data.value?.data ?? null" />

    <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section aria-labelledby="queue-title" class="min-w-0">
        <div class="mb-1 flex items-baseline justify-between px-3">
          <h2 id="queue-title" class="text-base font-semibold">
            {{ m.charges.sections[filter] }}
          </h2>
          <span class="num text-xs text-muted-foreground">
            {{ listTotal > LIST_SIZE ? m.charges.latest(LIST_SIZE, listTotal) : m.charges.count(listTotal) }}
          </span>
        </div>

        <div class="hidden h-8 grid-cols-[32px_minmax(0,1fr)_132px_96px_156px] items-center gap-x-4 border-b border-rule px-3 text-xs text-muted-foreground sm:grid">
          <span />
          <span>{{ m.charges.columns.charge }}</span>
          <span>{{ m.charges.columns.client }}</span>
          <span class="text-right">{{ filter === 'pending' ? m.charges.columns.deadline : m.charges.columns.when }}</span>
          <span class="text-right">{{ filter === 'pending' ? m.charges.columns.action : m.charges.columns.status }}</span>
        </div>

        <ul v-if="list.isPending.value" class="flex flex-col" aria-busy="true">
          <li v-for="n in 5" :key="n" class="grid h-[60px] grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-4 px-3">
            <span class="size-8 rounded-full bg-muted" />
            <span class="flex flex-col gap-1.5"><span class="h-4 w-20 rounded bg-muted" /><span class="h-3 w-40 rounded bg-muted" /></span>
            <span class="h-8 w-32 rounded-md bg-muted" />
          </li>
        </ul>

        <div v-else-if="list.isError.value" class="mt-3 flex flex-col items-start gap-1 rounded-lg border px-4 py-3">
          <p class="text-sm">
            {{ m.charges.loadError }} {{ errorText(list.error.value) }}
          </p>
          <Button variant="link" size="sm" class="h-auto px-0" @click="list.refetch()">
            {{ m.common.retry }}
          </Button>
        </div>

        <ul v-else-if="items.length" class="flex flex-col pt-1">
          <ChargesRow
            v-for="charge in items"
            :key="charge.txid"
            :charge="charge"
            :selected="selected === charge.txid"
            :arriving="!!arrivals[charge.txid]"
            :paying="payingTxid === charge.txid"
            @select="selected = selected === charge.txid && wide ? null : charge.txid"
            @pay="pay.mutate({ txid: charge.txid })"
          />
        </ul>

        <div v-else class="mt-3 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {{ m.charges.empty[filter] }}
          <button v-if="filter === 'pending' && !noClients" type="button" class="text-link hover:underline" @click="createOpen = true">
            {{ m.charges.createOne }}
          </button>
        </div>
      </section>

      <aside class="hidden xl:sticky xl:top-6 xl:block">
        <div class="rounded-lg border p-5">
          <ChargesDetail v-if="selected" :txid="selected" @close="selected = null" />
          <ChargesActivityFeed v-else @select="txid => (selected = txid)" />
        </div>
      </aside>
    </div>

    <section class="xl:hidden" :aria-label="m.activity.title">
      <div class="rounded-lg border p-5">
        <ChargesActivityFeed @select="txid => (selected = txid)" />
      </div>
    </section>

    <Sheet v-model:open="sheetOpen">
      <SheetContent side="right" class="w-full overflow-y-auto p-5 sm:max-w-[440px]">
        <SheetTitle class="sr-only">
          {{ m.detail.aria }}
        </SheetTitle>
        <ChargesDetail v-if="selected" :txid="selected" :closable="false" />
      </SheetContent>
    </Sheet>

    <ChargesCreateDialog v-model:open="createOpen" :merchants="merchantList" :default-merchant-id="merchantId" @created="txid => (selected = txid)" />
  </div>
</template>
