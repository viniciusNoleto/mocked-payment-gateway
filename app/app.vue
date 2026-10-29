<template>
  <TooltipProvider :delay-duration="300">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster position="bottom-right" :rich-colors="false" />
  </TooltipProvider>
</template>
