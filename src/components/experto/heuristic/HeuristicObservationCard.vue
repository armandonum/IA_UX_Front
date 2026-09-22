<template>
  <q-card class="q-mb-sm" :class="severityClass">
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-gutter-sm">
        <q-badge :color="severityColor" class="q-px-sm q-py-xs">
          {{ severityLabel }}
        </q-badge>
        <q-badge color="grey-6" class="q-px-sm q-py-xs">
          {{ frequency }}
        </q-badge>
        <q-chip size="sm" dense color="primary" text-color="white">
          {{ principleCode }}
        </q-chip>
        <q-space />
        <q-btn dense flat round size="sm" icon="delete" color="negative" @click="$emit('delete')" />
      </div>
      <div class="text-caption q-mt-xs">{{ description }}</div>
      <div class="text-caption text-grey-6 q-mt-xs">
        <q-icon name="schedule" size="12px" />
        {{ formatTime(createdAt) }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

// ============================================================
// OPCIONES DE SEVERIDAD (LOCALES, sin importar datos hardcodeados)
// ============================================================
const SEVERITY_OPTIONS = [
  { value: 1, label: '1 - Leve', color: 'green' },
  { value: 2, label: '2 - Menor', color: 'blue' },
  { value: 3, label: '3 - Moderado', color: 'yellow' },
  { value: 4, label: '4 - Grave', color: 'orange' },
  { value: 5, label: '5 - Crítico', color: 'red' },
] as const

const severityLabel = computed(() => {
  const opt = SEVERITY_OPTIONS.find(s => s.value === props.severity)
  return opt?.label || `Nivel ${props.severity}`
})

const severityColor = computed(() => {
  const opt = SEVERITY_OPTIONS.find(s => s.value === props.severity)
  return opt?.color || 'grey'
})

const severityClass = computed(() => {
  const classes: Record<number, string> = {
    1: 'border-left-green',
    2: 'border-left-blue',
    3: 'border-left-yellow',
    4: 'border-left-orange',
    5: 'border-left-red',
  }
  return classes[props.severity] || ''
})

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.border-left-green {
  border-left: 4px solid #4caf50 !important;
}
.border-left-blue {
  border-left: 4px solid #2196f3 !important;
}
.border-left-yellow {
  border-left: 4px solid #ffc107 !important;
}
.border-left-orange {
  border-left: 4px solid #ff9800 !important;
}
.border-left-red {
  border-left: 4px solid #f44336 !important;
}
</style>