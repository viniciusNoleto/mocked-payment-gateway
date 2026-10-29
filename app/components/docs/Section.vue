<script setup lang="ts">
defineProps<{ id: string; title: string }>();
</script>

<template>
  <section :id="id" :aria-labelledby="`${id}-title`" class="scroll-mt-6">
    <h2 :id="`${id}-title`" class="mb-4 text-xl leading-7 font-semibold">
      <a :href="`#${id}`" class="hover:text-link">{{ title }}</a>
    </h2>
    <div class="docs-prose">
      <slot />
    </div>
  </section>
</template>
