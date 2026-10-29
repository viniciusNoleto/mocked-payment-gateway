<script setup lang="ts">
import { Menu } from '@lucide/vue';

const route = useRoute();
const { m } = useI18n();
const stream = useGatewayStream();

onMounted(() => stream.connect());

const menuOpen = ref(false);

type NavKey = keyof typeof m.value.nav;

/** As páginas declaram `section` e `title` como chaves de `m.nav`, então o breadcrumb segue o idioma. */
const crumb = computed(() => ({
  section: m.value.nav[(route.meta.section as NavKey | undefined) ?? 'panel'],
  title: route.meta.title ? m.value.nav[route.meta.title as NavKey] : '',
}));

useHead({ title: computed(() => (crumb.value.title ? `${crumb.value.title} · Mocked Payment Gateway` : 'Mocked Payment Gateway')) });
</script>

<template>
  <div class="min-h-dvh bg-frame lg:grid lg:grid-cols-[228px_minmax(0,1fr)] lg:grid-rows-[48px_minmax(0,1fr)]">
    <aside class="sticky top-0 hidden h-dvh flex-col gap-8 px-3 pt-2.5 pb-4 lg:row-span-2 lg:flex">
      <AppWordmark />
      <AppNav />
      <AppPreferences class="mt-auto px-2" />
    </aside>

    <header class="sticky top-0 z-30 flex h-12 items-center gap-3 bg-frame px-4 lg:static lg:pr-6 lg:pl-0">
      <Button variant="ghost" size="icon-sm" class="lg:hidden" :aria-label="m.nav.openMenu" @click="menuOpen = true">
        <Menu class="size-5" :stroke-width="1.5" />
      </Button>

      <p class="flex min-w-0 items-center gap-2 text-sm">
        <span class="hidden text-muted-foreground sm:inline">{{ crumb.section }}</span>
        <span class="hidden text-nickel-400 sm:inline" aria-hidden="true">/</span>
        <span class="truncate font-medium">{{ crumb.title }}</span>
      </p>

      <div class="ml-auto flex items-center gap-4">
        <AppStreamStatus />
      </div>
    </header>

    <main class="min-h-[calc(100dvh-48px)] bg-background lg:mr-2 lg:mb-2 lg:rounded-sheet lg:border">
      <slot />
    </main>

    <Sheet v-model:open="menuOpen">
      <SheetContent side="left" class="w-[280px] gap-8 bg-frame px-3 pt-3 pb-5">
        <SheetTitle class="sr-only">
          {{ m.nav.menu }}
        </SheetTitle>
        <AppWordmark />
        <AppNav @navigate="menuOpen = false" />
        <AppPreferences class="mt-auto px-2" />
      </SheetContent>
    </Sheet>
  </div>
</template>
