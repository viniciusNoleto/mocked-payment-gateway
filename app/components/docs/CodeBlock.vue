<script setup lang="ts">
withDefaults(defineProps<{ code: string; lang?: string; title?: string; compact?: boolean }>(), { lang: 'text', compact: false });
</script>

<template>
  <figure class="group relative min-w-0 overflow-hidden rounded-lg bg-[var(--code-bg)] text-[var(--code-ink)]">
    <figcaption v-if="title" class="flex h-9 items-center justify-between border-b border-white/10 pr-1.5 pl-4 text-xs text-[var(--code-muted)]">
      <span>{{ title }}</span>
      <AppCopyButton :value="code" show-text class="text-[var(--code-muted)] hover:bg-white/10 hover:text-white" />
    </figcaption>
    <AppCopyButton
      v-else
      :value="code"
            class="absolute top-1.5 right-1.5 text-[var(--code-muted)] hover:bg-white/10 hover:text-white"
    />
    <pre class="overflow-x-auto font-mono leading-[20px]" :class="compact ? 'p-3 pr-10 text-xs' : 'p-4 pr-12 text-[13px]'" :data-lang="lang"><code>{{ code }}</code></pre>
  </figure>
</template>
