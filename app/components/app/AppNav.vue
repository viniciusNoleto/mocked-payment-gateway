<script setup lang="ts">
import { BookOpen, Coins, FileCode2, Radio, PlugZap, FlaskConical, Users } from '@lucide/vue';

defineEmits<{ navigate: [] }>();

const { m } = useI18n();

const groups = computed(() => [
  {
    label: m.value.nav.panel,
    items: [
      { to: '/', label: m.value.nav.live, icon: Coins },
      { to: '/clientes', label: m.value.nav.clients, icon: Users },
    ],
  },
  {
    label: m.value.nav.docs,
    items: [
      { to: '/docs', label: m.value.nav.overview, icon: BookOpen },
      { to: '/docs/integracao', label: m.value.nav.integration, icon: PlugZap },
      { to: '/docs/webhooks', label: m.value.nav.webhooks, icon: Radio },
      { to: '/docs/simulacao', label: m.value.nav.simulation, icon: FlaskConical },
      { to: '/docs/api', label: m.value.nav.api, icon: FileCode2 },
    ],
  },
]);
</script>

<template>
  <nav :aria-label="m.nav.main" class="flex flex-col gap-6">
    <div v-for="group in groups" :key="group.label">
      <p class="mb-2 px-2 text-xs text-muted-foreground">
        {{ group.label }}
      </p>
      <ul class="flex flex-col gap-0.5">
        <li v-for="item in group.items" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-[var(--nav-ink)] transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            exact-active-class="!bg-[var(--nav-active)] !text-foreground font-medium"
            @click="$emit('navigate')"
          >
            <component :is="item.icon" class="size-4 shrink-0 text-[var(--nav-icon)]" :stroke-width="1.5" />
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>
