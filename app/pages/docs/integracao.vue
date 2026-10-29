<script setup lang="ts">
import { integrationDocs } from '~/content/docs/integration';

definePageMeta({ section: 'docs', title: 'integration' });
</script>

<template>
  <DocsRenderer :definition="integrationDocs" />
</template>
