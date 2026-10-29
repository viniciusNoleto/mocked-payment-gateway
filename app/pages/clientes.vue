<script setup lang="ts">
import { Plus } from '@lucide/vue';
import { useQuery } from '@tanstack/vue-query';
import { getMerchantsService, GET_MERCHANTS_KEY } from '~/resources/merchant/services/getMerchants';
import type { IMerchantWithCredentials } from '#shared/resources/merchant/models/Merchant';

definePageMeta({ section: 'panel', title: 'clients' });

const route = useRoute();
const router = useRouter();
const { m } = useI18n();
const errorText = useApiErrorText();

const merchants = useQuery({
  queryKey: [...GET_MERCHANTS_KEY, { per_page: 100 }],
  queryFn: ({ signal }) => getMerchantsService({ signal, query: { per_page: 100 } }),
});
const list = computed(() => merchants.data.value?.data.items ?? []);

/** O cliente aberto fica na URL (`?id=`), para o detalhe da cobrança linkar direto para ele. */
const selected = computed({
  get: () => (route.query.id as string | undefined) ?? list.value[0]?.id ?? null,
  set: id => router.replace({ query: id ? { id } : {} }),
});

const createOpen = ref(false);
const created = ref<IMerchantWithCredentials | null>(null);
const keyOpen = ref(false);

function onCreated(merchant: IMerchantWithCredentials) {
  created.value = merchant;
  keyOpen.value = true;
  selected.value = merchant.id;
}
</script>

<template>
  <div class="flex flex-col gap-6 px-4 py-6 sm:px-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-[22px] leading-7 font-semibold">
          {{ m.clients.title }}
        </h1>
        <p class="mt-1 max-w-[640px] text-sm text-muted-foreground">
          {{ m.clients.subtitle(list.length) }}
        </p>
      </div>
      <Button @click="createOpen = true">
        <Plus class="size-4" />
        {{ m.clients.new }}
      </Button>
    </div>

    <div class="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <nav :aria-label="m.clients.listAria" class="flex flex-col rounded-lg border p-1.5">
        <template v-if="merchants.isPending.value">
          <div v-for="n in 3" :key="n" class="flex h-14 items-center gap-3 px-3">
            <span class="size-7 rounded-full bg-muted" />
            <span class="h-4 w-32 rounded bg-muted" />
          </div>
        </template>
        <p v-else-if="merchants.isError.value" class="p-3 text-sm">
          {{ errorText(merchants.error.value) }}
        </p>
        <p v-else-if="list.length === 0" class="p-3 text-sm text-muted-foreground">
          {{ m.clients.empty }}
        </p>
        <button
          v-for="merchant in list"
          :key="merchant.id"
          type="button"
          class="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          :class="selected === merchant.id ? '!bg-[var(--row-selected)]' : ''"
          :aria-current="selected === merchant.id ? 'true' : undefined"
          @click="selected = merchant.id"
        >
          <AppClientMark :id="merchant.id" :name="merchant.name" :size="28" />
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium">{{ merchant.name }}</span>
            <span class="block truncate font-mono text-xs text-muted-foreground">{{ merchant.webhook_url ?? m.clients.noWebhook }}</span>
          </span>
          <span class="num text-xs whitespace-nowrap" :class="merchant.pending_charges ? 'text-foreground' : 'text-muted-foreground'">
            {{ m.clients.pending(merchant.pending_charges) }}
          </span>
        </button>
      </nav>

      <section class="min-w-0 rounded-lg border p-5 sm:p-6">
        <ClientsDetail v-if="selected" :key="selected" :merchant-id="selected" @deleted="selected = null" />
        <p v-else class="text-sm text-muted-foreground">
          {{ m.clients.select }}
        </p>
      </section>
    </div>

    <ClientsCreateDialog v-model:open="createOpen" @created="onCreated" />
    <ClientsKeyDialog v-if="created" v-model:open="keyOpen" :api-key="created.api_key" :webhook-secret="created.webhook_secret" :client-name="created.name" />
  </div>
</template>
