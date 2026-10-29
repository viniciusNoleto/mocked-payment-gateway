<script setup lang="ts">
defineProps<{
  title: string;
  lead: string;
  sections: { id: string; title: string }[];
  next?: { to: string; label: string };
}>();

const { m } = useI18n();
</script>

<template>
  <div class="px-4 pt-8 pb-16 sm:px-6 lg:px-10">
    <div class="mx-auto grid max-w-[1100px] gap-12 xl:grid-cols-[minmax(0,760px)_220px] xl:justify-between">
      <article class="min-w-0">
        <header class="mb-10 flex flex-col gap-3 border-b pb-8">
          <h1 class="text-[28px] leading-9 font-semibold tracking-[-0.01em]">
            {{ title }}
          </h1>
          <p class="max-w-[640px] text-[17px] leading-7 text-body">
            {{ lead }}
          </p>
        </header>

        <div class="flex flex-col gap-14">
          <slot />
        </div>

        <footer v-if="next" class="mt-16 flex justify-end border-t pt-6">
          <NuxtLink :to="next.to" class="group flex flex-col items-end gap-0.5 rounded-md px-2 py-1 focus-visible:outline-2 focus-visible:outline-ring">
            <span class="text-xs text-muted-foreground">{{ m.common.next }}</span>
            <span class="text-base font-medium text-link group-hover:underline">{{ next.label }} →</span>
          </NuxtLink>
        </footer>
      </article>

      <nav :aria-label="m.common.onThisPage" class="hidden xl:block">
        <div class="sticky top-6 flex flex-col gap-2">
          <p class="text-xs text-muted-foreground">
            {{ m.common.onThisPage }}
          </p>
          <ul class="flex flex-col gap-1 border-l">
            <li v-for="section in sections" :key="section.id">
              <a :href="`#${section.id}`" class="-ml-px block border-l border-transparent py-1 pl-3 text-[13px] text-[var(--nav-ink)] transition-colors hover:border-gold-500 hover:text-foreground">
                {{ section.title }}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </div>
</template>
