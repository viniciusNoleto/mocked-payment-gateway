<script setup lang="ts">
import { simulationDocs } from '~/content/docs/simulation';

definePageMeta({ section: 'docs', title: 'simulation' });
</script>

<template>
  <DocsRenderer :definition="simulationDocs" />
</template>
