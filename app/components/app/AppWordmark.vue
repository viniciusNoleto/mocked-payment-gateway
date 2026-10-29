<template>
  <NuxtLink to="/" class="flex items-center gap-2.5 rounded-md px-2 py-1 focus-visible:outline-2 focus-visible:outline-ring">
    <AppCoinMark status="mark" glyph="M" :size="28" />
    <span class="flex flex-col leading-tight">
      <span class="text-sm font-semibold">Mocked Payment</span>
      <span class="text-xs text-muted-foreground">Gateway Pix</span>
    </span>
  </NuxtLink>
</template>
