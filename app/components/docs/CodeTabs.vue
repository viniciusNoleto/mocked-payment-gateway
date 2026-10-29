<script setup lang="ts">
import { useStorage } from '@vueuse/core';

const props = defineProps<{ samples: { label: string; lang: string; code: string }[]; storageKey?: string }>();

/** A linguagem escolhida vale para todos os exemplos da documentação. */
const choice = useStorage(props.storageKey ?? 'mpg:docs-lang', props.samples[0]!.label);
const active = computed(() => props.samples.find(sample => sample.label === choice.value) ?? props.samples[0]!);
</script>

<template>
  <figure class="min-w-0 overflow-hidden rounded-lg bg-[var(--code-bg)] text-[var(--code-ink)]">
    <figcaption class="flex h-10 items-center justify-between border-b border-white/10 pr-1.5 pl-2">
      <div role="tablist" aria-label="Code" class="flex h-full">
        <button
          v-for="sample in samples"
          :key="sample.label"
          role="tab"
          type="button"
          :aria-selected="active.label === sample.label"
          class="relative px-2.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-gold-400"
          :class="active.label === sample.label ? 'text-white' : 'text-[var(--code-muted)] hover:text-white'"
          @click="choice = sample.label"
        >
          {{ sample.label }}
          <span v-if="active.label === sample.label" class="absolute inset-x-2.5 bottom-0 h-0.5 bg-gold-500" />
        </button>
      </div>
      <AppCopyButton :value="active.code" show-text class="text-[var(--code-muted)] hover:bg-white/10 hover:text-white" />
    </figcaption>
    <pre class="overflow-x-auto p-4 font-mono text-[13px] leading-[20px]" :data-lang="active.lang"><code>{{ active.code }}</code></pre>
  </figure>
</template>
