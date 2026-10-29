<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

defineProps<{ title: string; description: string; confirmLabel: string; destructive?: boolean; pending?: boolean }>();
defineEmits<{ confirm: [] }>();

const { m } = useI18n();
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="open = false">
          {{ m.common.back }}
        </Button>
        <Button :variant="destructive ? 'destructive' : 'default'" :disabled="pending" @click="$emit('confirm')">
          {{ confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
