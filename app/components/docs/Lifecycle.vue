<script setup lang="ts">
const { m } = useI18n();

const outcomes = computed(() => [
  { status: 'paid' as const, event: 'charge.paid', who: m.value.lifecycle.paid },
  { status: 'expired' as const, event: 'charge.expired', who: m.value.lifecycle.expired },
  { status: 'cancelled' as const, event: 'charge.cancelled', who: m.value.lifecycle.cancelled },
]);
</script>

<template>
  <figure class="@container rounded-lg border p-5 sm:p-6">
    <div class="grid items-center gap-6 @2xl:grid-cols-[200px_56px_minmax(0,1fr)] @2xl:gap-0">
      <div class="flex flex-col items-start gap-3">
        <AppCoinMark status="pending" :remaining="0.62" :size="56" />
        <div>
          <p class="font-mono text-sm font-medium">
            pending
          </p>
          <p class="mt-1 text-[13px] leading-5 text-muted-foreground">
            <DocsInline :text="m.lifecycle.pending('`POST /api/charges`')" />
          </p>
        </div>
      </div>

      <svg class="hidden h-full w-14 @2xl:block" viewBox="0 0 56 240" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120 C 28 120, 28 40, 56 40" fill="none" stroke="var(--nickel-400)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        <path d="M0 120 L 56 120" fill="none" stroke="var(--nickel-400)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        <path d="M0 120 C 28 120, 28 200, 56 200" fill="none" stroke="var(--nickel-400)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      </svg>

      <ul class="flex flex-col gap-3">
        <li v-for="outcome in outcomes" :key="outcome.status" class="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-4 rounded-md bg-muted px-4 py-3">
          <AppCoinMark :status="outcome.status" :size="40" />
          <div class="min-w-0">
            <p class="flex flex-wrap items-baseline gap-x-3">
              <span class="font-mono text-sm font-medium">{{ outcome.status }}</span>
              <span class="font-mono text-xs text-muted-foreground">{{ m.lifecycle.webhook }} {{ outcome.event }}</span>
            </p>
            <p class="mt-0.5 text-[13px] leading-5 text-body">
              {{ outcome.who }}
            </p>
          </div>
        </li>
      </ul>
    </div>
    <figcaption class="mt-5 border-t pt-4 text-[13px] text-muted-foreground">
      {{ m.lifecycle.caption }}
    </figcaption>
  </figure>
</template>
