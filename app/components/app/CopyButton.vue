<script setup lang="ts">
import { Check, Copy } from '@lucide/vue';
import { useClipboard } from '@vueuse/core';

const props = withDefaults(defineProps<{ value: string; label?: string; showText?: boolean }>(), { showText: false });

const { m } = useI18n();
const text = computed(() => props.label ?? m.value.common.copy);

const { copy, copied } = useClipboard({ copiedDuring: 1500, legacy: true });
</script>

<template>
  <Button
    type="button"
    variant="ghost"
    :size="showText ? 'sm' : 'icon-xs'"
    class="text-muted-foreground hover:text-foreground"
    :aria-label="showText ? undefined : `${text}: ${props.value}`"
    @click.stop="copy(props.value)"
  >
    <Check v-if="copied" class="size-3.5 text-positive" />
    <Copy v-else class="size-3.5" :stroke-width="1.5" />
    <span v-if="showText">{{ copied ? m.common.copied : text }}</span>
  </Button>
</template>
