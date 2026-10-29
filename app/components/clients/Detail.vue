<script setup lang="ts">
import { ArrowRight, Eye, EyeOff, RefreshCw } from '@lucide/vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { toast } from 'vue-sonner';
import { getMerchantService, GET_MERCHANT_KEY } from '~/resources/merchant/services/getMerchant';
import { GET_MERCHANTS_KEY } from '~/resources/merchant/services/getMerchants';
import { updateMerchantService } from '~/resources/merchant/services/updateMerchant';
import { deleteMerchantService } from '~/resources/merchant/services/deleteMerchant';
import { rotateMerchantApiKeyService } from '~/resources/merchant/services/rotateMerchantApiKey';
import { rotateMerchantWebhookSecretService } from '~/resources/merchant/services/rotateMerchantWebhookSecret';
import { EWebhookAuthMode } from '#shared/resources/webhook/enums/WebhookAuthMode';
import { EWebhookPayloadMode } from '#shared/resources/webhook/enums/WebhookPayloadMode';

const props = defineProps<{ merchantId: string }>();
const emit = defineEmits<{ deleted: [] }>();

const { m, locale } = useI18n();
const errorText = useApiErrorText();
const queryClient = useQueryClient();

const query = useQuery({
  queryKey: computed(() => GET_MERCHANT_KEY(props.merchantId)),
  queryFn: ({ signal }) => getMerchantService({ signal, merchantId: props.merchantId }),
});
const merchant = computed(() => query.data.value?.data ?? null);

const form = reactive({
  name: '',
  webhook_url: '',
  webhook_auth_mode: EWebhookAuthMode.HMAC as `${EWebhookAuthMode}`,
  webhook_payload_mode: EWebhookPayloadMode.FULL as `${EWebhookPayloadMode}`,
  pix_key: '',
  city: '',
});

watch(merchant, (value) => {
  if (!value) return;
  Object.assign(form, {
    name: value.name,
    webhook_url: value.webhook_url ?? '',
    webhook_auth_mode: value.webhook_auth_mode,
    webhook_payload_mode: value.webhook_payload_mode,
    pix_key: value.pix_key,
    city: value.city,
  });
}, { immediate: true });

const refresh = () => {
  queryClient.invalidateQueries({ queryKey: GET_MERCHANT_KEY(props.merchantId) });
  queryClient.invalidateQueries({ queryKey: GET_MERCHANTS_KEY });
};

const save = useMutation({
  mutationFn: () => updateMerchantService({
    merchantId: props.merchantId,
    body: { ...form, name: form.name.trim(), webhook_url: form.webhook_url.trim() || null },
  }),
  onSuccess: ({ message }) => {
    toast.success(message[locale.value]);
    refresh();
  },
  onError: failure => toast.error(errorText(failure)),
});

const showSecret = ref(false);
const newKey = ref<string | null>(null);
const keyDialogOpen = ref(false);
const confirmRotateKey = ref(false);
const confirmRotateSecret = ref(false);
const confirmDelete = ref(false);

const rotateKey = useMutation({
  mutationFn: () => rotateMerchantApiKeyService({ merchantId: props.merchantId }),
  onSuccess: ({ data }) => {
    confirmRotateKey.value = false;
    newKey.value = data.api_key;
    keyDialogOpen.value = true;
    refresh();
  },
  onError: failure => toast.error(errorText(failure)),
});

const rotateSecret = useMutation({
  mutationFn: () => rotateMerchantWebhookSecretService({ merchantId: props.merchantId }),
  onSuccess: ({ message }) => {
    confirmRotateSecret.value = false;
    showSecret.value = true;
    toast.success(message[locale.value]);
    refresh();
  },
  onError: failure => toast.error(errorText(failure)),
});

const remove = useMutation({
  mutationFn: () => deleteMerchantService({ merchantId: props.merchantId }),
  onSuccess: ({ message }) => {
    confirmDelete.value = false;
    toast(message[locale.value]);
    queryClient.invalidateQueries({ queryKey: GET_MERCHANTS_KEY });
    emit('deleted');
  },
  onError: failure => toast.error(errorText(failure)),
});

const maskedSecret = computed(() => (merchant.value ? `${merchant.value.webhook_secret.slice(0, 8)}${'•'.repeat(20)}` : ''));
</script>

<template>
  <div v-if="query.isPending.value" class="flex flex-col gap-4">
    <div class="h-10 w-48 rounded bg-muted" />
    <div class="h-40 rounded-lg bg-muted" />
  </div>

  <div v-else-if="query.isError.value" class="rounded-lg border p-4 text-sm">
    {{ errorText(query.error.value) }}
  </div>

  <div v-else-if="merchant" class="flex flex-col gap-8">
    <header class="flex flex-wrap items-center gap-4">
      <AppClientMark :id="merchant.id" :name="merchant.name" :size="40" />
      <div class="min-w-0 flex-1 basis-56">
        <h2 class="truncate text-xl leading-7 font-semibold">
          {{ merchant.name }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ m.clients.created }} {{ formatDate(merchant.created_at) }} · {{ m.clients.pending(merchant.pending_charges) }} · {{ m.charges.count(merchant.charges_total) }}
        </p>
      </div>
      <Button as-child variant="outline" size="sm">
        <NuxtLink :to="{ path: '/', query: { cliente: merchant.id } }">
          {{ m.clients.charges }}
          <ArrowRight class="size-3.5" />
        </NuxtLink>
      </Button>
    </header>

    <section aria-labelledby="credentials-title" class="flex flex-col gap-4">
      <h3 id="credentials-title" class="text-base font-semibold">
        {{ m.clients.credentials }}
      </h3>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2 rounded-lg bg-muted p-4">
          <span class="text-[13px] font-medium">{{ m.clients.apiKey }}</span>
          <p class="font-mono text-sm">
            {{ merchant.api_key_prefix }}
          </p>
          <p class="text-[13px] text-muted-foreground">
            {{ m.clients.apiKeyHint }}
          </p>
          <Button variant="outline" size="sm" class="mt-auto self-start" @click="confirmRotateKey = true">
            <RefreshCw class="size-3.5" />
            {{ m.clients.rotateKey }}
          </Button>
        </div>

        <div class="flex flex-col gap-2 rounded-lg bg-muted p-4">
          <span class="text-[13px] font-medium">{{ m.clients.webhookSecret }}</span>
          <p class="flex min-w-0 items-center gap-1 font-mono text-sm">
            <span class="truncate">{{ showSecret ? merchant.webhook_secret : maskedSecret }}</span>
            <Button variant="ghost" size="icon-xs" :aria-label="showSecret ? m.clients.hide : m.clients.reveal" @click="showSecret = !showSecret">
              <EyeOff v-if="showSecret" class="size-3.5" />
              <Eye v-else class="size-3.5" />
            </Button>
            <AppCopyButton :value="merchant.webhook_secret" :label="m.clients.webhookSecret" />
          </p>
          <p class="text-[13px] text-muted-foreground">
            {{ m.clients.webhookSecretHint }}
          </p>
          <Button variant="outline" size="sm" class="mt-auto self-start" @click="confirmRotateSecret = true">
            <RefreshCw class="size-3.5" />
            {{ m.clients.rotateSecret }}
          </Button>
        </div>
      </div>
    </section>

    <form class="flex flex-col gap-6" @submit.prevent="save.mutate()">
      <section aria-labelledby="webhook-title" class="flex flex-col gap-4">
        <h3 id="webhook-title" class="text-base font-semibold">
          {{ m.clients.webhookTitle }}
        </h3>
        <div class="flex flex-col gap-2">
          <Label for="detail-webhook">{{ m.clients.webhookUrl }}</Label>
          <Input id="detail-webhook" v-model="form.webhook_url" type="url" placeholder="http://host.docker.internal:8000/webhooks/pix" class="h-10 font-mono text-[13px]" aria-describedby="detail-webhook-help" />
          <p id="detail-webhook-help" class="text-[13px] text-muted-foreground">
            {{ m.clients.webhookUrlHint }}
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <Label for="detail-auth">{{ m.clients.authMode }}</Label>
            <Select v-model="form.webhook_auth_mode">
              <SelectTrigger id="detail-auth" class="!h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(label, value) in m.clients.authModes" :key="value" :value="value">
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="detail-payload">{{ m.clients.payloadMode }}</Label>
            <Select v-model="form.webhook_payload_mode">
              <SelectTrigger id="detail-payload" class="!h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(label, value) in m.clients.payloadModes" :key="value" :value="value">
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section aria-labelledby="profile-title" class="flex flex-col gap-4">
        <h3 id="profile-title" class="text-base font-semibold">
          {{ m.clients.profile }}
        </h3>
        <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
          <div class="flex flex-col gap-2">
            <Label for="detail-name">{{ m.clients.name }}</Label>
            <Input id="detail-name" v-model="form.name" class="h-10" required maxlength="150" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="detail-pix">{{ m.clients.pixKey }}</Label>
            <Input id="detail-pix" v-model="form.pix_key" class="h-10 font-mono text-[13px]" required maxlength="77" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="detail-city">{{ m.clients.city }}</Label>
            <Input id="detail-city" v-model="form.city" class="h-10" required maxlength="15" :title="m.clients.cityHint" />
          </div>
        </div>
      </section>

      <div class="flex justify-end">
        <Button type="submit" :disabled="save.isPending.value">
          {{ save.isPending.value ? m.common.saving : m.common.save }}
        </Button>
      </div>
    </form>

    <ClientsSimulation v-if="merchant" :merchant="merchant" />

    <section aria-labelledby="danger-title" class="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
      <div>
        <h3 id="danger-title" class="text-base font-semibold">
          {{ m.clients.danger }}
        </h3>
        <p class="text-[13px] text-muted-foreground">
          {{ m.clients.dangerHint }}
        </p>
      </div>
      <Button variant="outline" class="border-negative/40 text-negative hover:bg-[var(--pill-negative-bg)] hover:text-negative" @click="confirmDelete = true">
        {{ m.clients.delete }}
      </Button>
    </section>

    <AppConfirmDialog
      v-model:open="confirmRotateKey"
      :title="m.clients.rotateKey"
      :description="m.clients.apiKeyHint"
      :confirm-label="m.clients.rotateKey"
      :pending="rotateKey.isPending.value"
      @confirm="rotateKey.mutate()"
    />
    <AppConfirmDialog
      v-model:open="confirmRotateSecret"
      :title="m.clients.rotateSecret"
      :description="m.clients.webhookSecretHint"
      :confirm-label="m.clients.rotateSecret"
      :pending="rotateSecret.isPending.value"
      @confirm="rotateSecret.mutate()"
    />
    <AppConfirmDialog
      v-model:open="confirmDelete"
      :title="m.clients.deleteConfirm(merchant?.name ?? '')"
      :description="m.clients.dangerHint"
      :confirm-label="m.clients.delete"
      destructive
      :pending="remove.isPending.value"
      @confirm="remove.mutate()"
    />
    <ClientsKeyDialog v-if="newKey" v-model:open="keyDialogOpen" :api-key="newKey" :webhook-secret="merchant?.webhook_secret ?? ''" :client-name="merchant?.name ?? ''" />
  </div>
</template>
