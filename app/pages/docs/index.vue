<script setup lang="ts">
import { overviewDocs } from '~/content/docs/overview';

definePageMeta({ section: 'docs', title: 'overview' });
</script>

<template>
  <DocsRenderer :definition="overviewDocs" />
</template>
