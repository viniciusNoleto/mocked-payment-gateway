<script setup lang="ts">
import { webhooksDocs } from '~/content/docs/webhooks';

definePageMeta({ section: 'docs', title: 'webhooks' });
</script>

<template>
  <DocsRenderer :definition="webhooksDocs" />
</template>
