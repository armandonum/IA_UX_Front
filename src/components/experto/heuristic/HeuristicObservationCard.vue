<!-- components/experto/heuristic/HeuristicObservationCard.vue -->

<template>
  <q-card class="q-mb-sm" :class="severityClass">
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-gutter-sm">
        <q-badge :color="severityColor" class="q-px-sm q-py-xs">
          {{ severityLabel }}
        </q-badge>
        <q-badge color="grey-5" class="q-px-sm q-py-xs">
          {{ frequency }}
        </q-badge>
        <q-chip size="sm" dense>
          {{ principleCode }}
        </q-chip>
        <q-space />
        <q-btn dense flat size="sm" icon="delete" color="negative" @click="$emit('delete')" />
      </div>
      <div class="text-caption q-mt-xs">{{ description }}</div>
      <div class="text-[10px] text-grey-6 q-mt-xs">
        {{ formatTime(createdAt) }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SEVERITY_OPTIONS } from '@/data/heuristicPrinciples'

const props = defineProps<{
  description: string
  severity: 1 | 2 | 3 | 4 | 5
  frequency: string
  principleCode: string
  createdAt: string
}>()

defineEmits<{
  (e: 'delete'): void
}>()

const severityLabel = computed(() => {
  const opt = SEVERITY_OPTIONS.find(s => s.value === props.severity)
  return opt?.label || `Nivel ${props.severity}`
})

const severityColor = computed(() => {
  const opt = SEVERITY_OPTIONS.find(s => s.value === props.severity)
  return opt?.color || 'grey'
})

const severityClass = computed(() => {
  const colors: Record<number, string> = {
    1: 'border-l-4 border-l-green-500',
    2: 'border-l-4 border-l-blue-500',
    3: 'border-l-4 border-l-yellow-500',
    4: 'border-l-4 border-l-orange-500',
    5: 'border-l-4 border-l-red-500'
  }
  return colors[props.severity] || ''
})

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}
</script>