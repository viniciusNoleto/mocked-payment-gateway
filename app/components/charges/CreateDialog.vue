<script setup lang="ts">
import { Loader2 } from '@lucide/vue';
import type { ICentralMerchant } from '#shared/resources/merchant/models/Merchant';

const props = defineProps<{ merchants: ICentralMerchant[]; defaultMerchantId?: string }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ created: [txid: string] }>();

const { create } = useChargeActions();
const { m } = useI18n();

const merchantId = ref<string>('');
const amount = ref('49,90');
const description = ref('');
const expiresIn = ref('1800');
const autoPay = ref(false);
const autoPaySeconds = ref(15);

watch(open, (isOpen) => {
  if (isOpen && !merchantId.value) merchantId.value = props.defaultMerchantId ?? props.merchants[0]?.id ?? '';
});

const amountCents = computed(() => parseMoneyInput(amount.value));

function submit() {
  if (amountCents.value === null || !merchantId.value) return;

  create.mutate({
    merchant_id: merchantId.value,
    amount: amountCents.value,
    description: description.value.trim() || undefined,
    expires_in: Number(expiresIn.value),
    auto_pay_after_seconds: autoPay.value ? autoPaySeconds.value : undefined,
  }, {
    onSuccess: ({ data }) => {
      open.value = false;
      description.value = '';
      emit('created', data.txid);
    },
  });
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle>{{ m.create.title }}</DialogTitle>
        <DialogDescription>{{ m.create.description }}</DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <div class="flex flex-col gap-2">
          <Label for="new-client">{{ m.create.client }}</Label>
          <Select v-model="merchantId">
            <SelectTrigger id="new-client" class="!h-10 w-full">
              <SelectValue :placeholder="m.create.clientPlaceholder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="merchant in merchants" :key="merchant.id" :value="merchant.id">
                {{ merchant.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-2">
            <Label for="new-amount">{{ m.create.amount }}</Label>
            <div class="relative">
              <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input id="new-amount" v-model="amount" inputmode="decimal" class="num h-10 pl-9" :aria-invalid="amountCents === null" />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="new-expires">{{ m.create.expiresIn }}</Label>
            <Select v-model="expiresIn">
              <SelectTrigger id="new-expires" class="!h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(label, seconds) in m.create.durations" :key="seconds" :value="seconds">
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="new-description">{{ m.create.descriptionLabel }}</Label>
          <Input id="new-description" v-model="description" :placeholder="m.create.descriptionPlaceholder" class="h-10" />
        </div>

        <div class="flex items-center justify-between gap-4 rounded-lg bg-muted px-3 py-2.5">
          <Label for="new-autopay" class="flex flex-col items-start gap-0.5 font-normal">
            <span class="text-sm font-medium">{{ m.create.autoPay }}</span>
            <span class="text-[13px] text-muted-foreground">{{ m.create.autoPayHint }}</span>
          </Label>
          <div class="flex items-center gap-2">
            <div v-if="autoPay" class="relative w-20">
              <Input v-model.number="autoPaySeconds" type="number" min="0" class="num pr-6" :aria-label="m.create.autoPaySeconds" />
              <span class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">s</span>
            </div>
            <Switch id="new-autopay" v-model="autoPay" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">
            {{ m.common.back }}
          </Button>
          <Button type="submit" :disabled="create.isPending.value || amountCents === null || !merchantId">
            <Loader2 v-if="create.isPending.value" class="size-4 animate-spin" />
            {{ m.create.submit }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
