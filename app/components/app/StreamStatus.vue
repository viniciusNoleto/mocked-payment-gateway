<script setup lang="ts">
const { status } = useGatewayStream();
const { m } = useI18n();

const view = computed(() => {
  const label = m.value.stream[status.value];
  return status.value === 'live'
    ? { label, dot: 'bg-gold-500 live-pulse', ink: 'text-foreground' }
    : { label, dot: 'bg-nickel-400', ink: 'text-muted-foreground' };
});
</script>

<template>
  <span class="inline-flex items-center gap-2 text-sm" :class="view.ink" role="status" aria-live="polite">
    <span class="size-2 rounded-full" :class="view.dot" />
    {{ view.label }}
  </span>
</template>
