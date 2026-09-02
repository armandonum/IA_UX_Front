<template>
  <div class="card flex items-center gap-4">
    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" :class="bgClass">
      {{ icon }}
    </div>
    <div class="min-w-0">
      <p class="text-xs text-slate-500 uppercase tracking-wide">{{ label }}</p>
      <p class="text-lg font-bold text-slate-100 truncate capitalize">{{ value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  icon: string
  color?: string
}>()

const bgClass = computed(() => {
  const map: Record<string, string> = {
    primary: 'bg-primary-500/20',
    emerald: 'bg-emerald-500/20',
    blue: 'bg-blue-500/20',
    cyan: 'bg-cyan-500/20',
    violet: 'bg-violet-500/20',
    amber: 'bg-amber-500/20',
    red: 'bg-red-500/20',
  }
  return map[props.color ?? 'primary'] ?? 'bg-primary-500/20'
})
</script>
