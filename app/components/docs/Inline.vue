<script setup lang="ts">
import { NuxtLink } from '#components';

/** Marcação mínima do conteúdo da documentação: `código`, **negrito** e [rótulo](/caminho). */
const props = defineProps<{ text: string }>();

const TOKEN = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

function render() {
  const nodes: (string | ReturnType<typeof h>)[] = [];
  let last = 0;

  for (const match of props.text.matchAll(TOKEN)) {
    if (match.index > last) nodes.push(props.text.slice(last, match.index));
    const [, code, bold, label, href] = match;
    if (code) nodes.push(h('code', code));
    else if (bold) nodes.push(h('strong', bold));
    else if (label && href) nodes.push(h(NuxtLink, { to: href }, () => label));
    last = match.index + match[0].length;
  }

  if (last < props.text.length) nodes.push(props.text.slice(last));
  return nodes;
}
</script>

<template>
  <component :is="() => render()" />
</template>
