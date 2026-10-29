<script setup lang="ts">
/**
 * Identidade de um cliente: a inicial num disco de tom pálido e estável (derivado do id),
 * para reconhecer de quem é cada cobrança sem ler o nome.
 */
const props = withDefaults(defineProps<{ id: string; name: string; size?: number }>(), { size: 20 });

// Matizes afastados entre si, sem violeta nem índigo; claros o bastante para a inicial em tinta.
const TINTS = [
  { bg: '#d9efe8', ink: '#0f4a3a' },
  { bg: '#f7dfd3', ink: '#6a2a12' },
  { bg: '#dbe8f6', ink: '#173f66' },
  { bg: '#e6efcf', ink: '#3b4a10' },
  { bg: '#f6dbe3', ink: '#6b1f36' },
  { bg: '#d6eef2', ink: '#0f4650' },
];

const tint = computed(() => {
  let hash = 0;
  for (const char of props.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length]!;
});

const initial = computed(() => props.name.trim().charAt(0).toUpperCase() || '?');
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
    :style="{ width: `${size}px`, height: `${size}px`, background: tint.bg, color: tint.ink, fontSize: `${Math.round(size * 0.5)}px` }"
    aria-hidden="true"
  >{{ initial }}</span>
</template>
