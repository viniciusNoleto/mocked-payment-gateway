<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{ apiKey: string; webhookSecret: string; clientName: string }>();

const { m } = useI18n();
const origin = useGatewayOrigin();

const env = computed(() => `PIX_GATEWAY_URL=${origin}
PIX_API_KEY=${props.apiKey}
PIX_WEBHOOK_SECRET=${props.webhookSecret}`);
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ m.clients.newKeyTitle }}</DialogTitle>
        <DialogDescription>{{ clientName }} · {{ m.clients.newKeyDescription }}</DialogDescription>
      </DialogHeader>
      <DocsCodeBlock :code="env" lang="bash" title=".env" />
      <DialogFooter>
        <Button @click="open = false">
          {{ m.clients.done }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
