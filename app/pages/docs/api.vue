<script setup lang="ts">
import { apiDocs } from '~/content/docs/api';

definePageMeta({ section: 'docs', title: 'api' });
</script>

<template>
  <DocsRenderer :definition="apiDocs" />
</template>
