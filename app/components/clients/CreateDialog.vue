<script setup lang="ts">
import { Loader2 } from '@lucide/vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { toast } from 'vue-sonner';
import { createMerchantService } from '~/resources/merchant/services/createMerchant';
import { GET_MERCHANTS_KEY } from '~/resources/merchant/services/getMerchants';
import type { IMerchantWithCredentials } from '#shared/resources/merchant/models/Merchant';

const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ created: [merchant: IMerchantWithCredentials] }>();

const { m, locale } = useI18n();
const errorText = useApiErrorText();
const queryClient = useQueryClient();

const name = ref('');
const webhookUrl = ref('');

const create = useMutation({
  mutationFn: () => createMerchantService({ body: { name: name.value.trim(), webhook_url: webhookUrl.value.trim() || null } }),
  onSuccess: ({ data, message }) => {
    toast.success(message[locale.value]);
    queryClient.invalidateQueries({ queryKey: GET_MERCHANTS_KEY });
    open.value = false;
    name.value = '';
    webhookUrl.value = '';
    emit('created', data);
  },
  onError: failure => toast.error(errorText(failure)),
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle>{{ m.clients.createTitle }}</DialogTitle>
        <DialogDescription>{{ m.clients.createDescription }}</DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit.prevent="create.mutate()">
        <div class="flex flex-col gap-2">
          <Label for="client-name">{{ m.clients.name }}</Label>
          <Input id="client-name" v-model="name" :placeholder="m.clients.namePlaceholder" class="h-10" required maxlength="150" />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="client-webhook">{{ m.clients.webhookUrl }} <span class="font-normal text-muted-foreground">({{ m.clients.optional }})</span></Label>
          <Input id="client-webhook" v-model="webhookUrl" type="url" placeholder="http://host.docker.internal:8000/webhooks/pix" class="h-10 font-mono text-[13px]" aria-describedby="client-webhook-help" />
          <p id="client-webhook-help" class="text-[13px] text-muted-foreground">
            {{ m.clients.webhookUrlHint }}
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">
            {{ m.common.back }}
          </Button>
          <Button type="submit" :disabled="create.isPending.value || !name.trim()">
            <Loader2 v-if="create.isPending.value" class="size-4 animate-spin" />
            {{ m.clients.createSubmit }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
