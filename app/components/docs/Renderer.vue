<script setup lang="ts">
import type { DocsPageDefinition } from '~/content/docs/types';

const props = defineProps<{ definition: DocsPageDefinition }>();

const { locale } = useI18n();
const origin = useGatewayOrigin();

const page = computed(() => props.definition({ origin })[locale.value]);
</script>

<template>
  <DocsPage :title="page.title" :lead="page.lead" :sections="page.sections" :next="page.next">
    <DocsSection v-for="section in page.sections" :id="section.id" :key="section.id" :title="section.title">
      <template v-for="(block, index) in section.blocks" :key="index">
        <p v-if="block.type === 'p'">
          <DocsInline :text="block.text" />
        </p>
        <ul v-else-if="block.type === 'ul'">
          <li v-for="item in block.items" :key="item">
            <DocsInline :text="item" />
          </li>
        </ul>
        <DocsCodeBlock v-else-if="block.type === 'code'" :code="block.code" :lang="block.lang" :title="block.title" />
        <DocsCodeTabs v-else-if="block.type === 'tabs'" :samples="block.samples" />
        <DocsTable v-else-if="block.type === 'table'" :head="block.head" :rows="block.rows" :code-columns="block.code" :numeric-columns="block.numeric" />
        <DocsEndpoints v-else-if="block.type === 'endpoints'" :head="block.head" :rows="block.rows" :body-labels="block.bodyLabels" />
        <DocsLifecycle v-else-if="block.type === 'lifecycle'" />
      </template>
    </DocsSection>
  </DocsPage>
</template>
