<script setup lang="ts">
import { ChevronDown } from '@lucide/vue';
import type { DocsBodyLabels, DocsEndpoint } from '~/content/docs/types';

defineProps<{ head: [string, string, string]; rows: DocsEndpoint[]; bodyLabels: DocsBodyLabels }>();
</script>

<template>
  <div class="overflow-x-auto rounded-lg border">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="text-xs text-muted-foreground">
          <th scope="col" class="h-9 w-20 px-4 font-normal">
            {{ head[0] }}
          </th>
          <th scope="col" class="h-9 px-4 font-normal">
            {{ head[1] }}
          </th>
          <th scope="col" class="h-9 px-4 font-normal">
            {{ head[2] }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="row in rows" :key="row.method + row.path">
          <tr class="border-t border-rule align-top">
            <td class="px-4 py-2.5 font-mono text-xs font-medium" :class="HTTP_METHOD_TONE[row.method]">
              {{ row.method }}
            </td>
            <td class="px-4 py-2.5 font-mono text-[13px] whitespace-nowrap">
              {{ row.path }}
            </td>
            <td class="min-w-[240px] px-4 py-2.5 text-body">
              <DocsInline :text="row.description" />
            </td>
          </tr>
          <!-- O corpo fica colado à rota: o exemplo sempre à vista, a especificação dos campos sob demanda. -->
          <tr v-if="row.body">
            <td colspan="3" class="px-4 pb-3">
              <DocsCodeBlock :code="row.body.example" lang="json" :title="bodyLabels.body" compact />
              <details class="group/body mt-2 rounded-lg border">
                <summary class="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground select-none hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <ChevronDown class="size-3.5 transition-transform group-open/body:rotate-180" />
                  <span class="group-open/body:hidden">{{ bodyLabels.more }}</span>
                  <span class="hidden group-open/body:inline">{{ bodyLabels.less }}</span>
                </summary>
                <div class="overflow-x-auto border-t">
                  <table class="w-full text-left text-sm">
                    <thead>
                      <tr class="text-xs text-muted-foreground">
                        <th v-for="cell in bodyLabels.head" :key="cell" scope="col" class="h-9 px-3 font-normal">
                          {{ cell }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="field in row.body.fields" :key="field.name" class="border-t border-rule align-top">
                        <td class="px-3 py-2 whitespace-nowrap">
                          <span class="font-mono text-[13px]">{{ field.name }}</span>
                          <span v-if="field.required" class="ml-2 text-xs text-gold-700">{{ bodyLabels.required }}</span>
                        </td>
                        <td class="px-3 py-2 font-mono text-[13px] whitespace-nowrap text-muted-foreground">
                          {{ field.type }}
                        </td>
                        <td class="min-w-[220px] px-3 py-2 text-body">
                          <DocsInline :text="field.text" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
