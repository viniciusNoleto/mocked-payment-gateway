<script setup lang="ts">
defineProps<{ head: string[]; rows: string[][]; codeColumns?: number[]; numericColumns?: number[] }>();
</script>

<template>
  <div class="overflow-x-auto rounded-lg border">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="text-xs text-muted-foreground">
          <th v-for="(cell, c) in head" :key="cell" scope="col" class="h-9 px-4 font-normal" :class="numericColumns?.includes(c) ? 'text-right' : ''">
            {{ cell }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, r) in rows" :key="r" class="border-t border-rule align-top">
          <td
            v-for="(cell, c) in row"
            :key="c"
            class="px-4 py-2.5"
            :class="numericColumns?.includes(c) ? 'num w-28 text-right whitespace-nowrap' : codeColumns?.includes(c) ? 'font-mono text-[13px] whitespace-nowrap' : 'min-w-[200px] text-body'"
          >
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
