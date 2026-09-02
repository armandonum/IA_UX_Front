<template>
  <div class="row items-center q-gutter-sm q-mb-md">
    <q-btn
      flat
      round
      dense
      icon="arrow_back"
      color="primary"
      @click="$emit('back')"
    />
    <div v-if="session" class="col">
      <div class="text-h6 text-weight-medium text-dark ellipsis">
        {{ session.taskDescription || 'Evaluación de usabilidad' }}
      </div>
      <div class="text-caption text-grey-6">
        {{ session.deviceType }} · {{ formatFecha(session.startedAt) }} · {{ formatDuracion(session.durationSeconds) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UsabilitySession } from '@/types/evaluation'

defineProps<{
  session: UsabilitySession | null
}>()

defineEmits<{
  (e: 'back'): void
}>()

function formatDuracion(seconds: number) {
  if (!seconds) return '00:00'
  const totalSeconds = Math.floor(seconds)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>