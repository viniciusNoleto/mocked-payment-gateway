<script setup lang="ts">
import { Monitor, Moon, Sun } from '@lucide/vue';
import { useColorMode } from '@vueuse/core';

const { m, locale, options } = useI18n();

/** Tema guardado neste navegador; "auto" segue o sistema operacional. */
const mode = useColorMode({ storageKey: 'mpg:theme', emitAuto: true });

const themes = computed(() => [
  { value: 'light' as const, label: m.value.prefs.light, icon: Sun },
  { value: 'dark' as const, label: m.value.prefs.dark, icon: Moon },
  { value: 'auto' as const, label: m.value.prefs.auto, icon: Monitor },
]);
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col gap-1.5">
      <Label for="pref-language" class="text-xs font-normal text-muted-foreground">{{ m.prefs.language }}</Label>
      <Select v-model="locale">
        <SelectTrigger id="pref-language" size="sm" class="w-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex flex-col gap-1.5">
      <span id="pref-theme" class="text-xs text-muted-foreground">{{ m.prefs.theme }}</span>
      <div role="radiogroup" aria-labelledby="pref-theme" class="grid grid-cols-3 gap-1 rounded-md bg-[var(--nav-active)] p-0.5">
        <button
          v-for="theme in themes"
          :key="theme.value"
          type="button"
          role="radio"
          :aria-checked="mode === theme.value"
          :aria-label="theme.label"
          :title="theme.label"
          class="flex h-7 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          :class="mode === theme.value ? 'bg-background text-foreground' : ''"
          @click="mode = theme.value"
        >
          <component :is="theme.icon" class="size-3.5" :stroke-width="1.75" />
        </button>
      </div>
    </div>
  </div>
</template>
