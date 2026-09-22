<!-- components/coordinador/heuristic/detail/HeuristicSessionHeader.vue -->
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
      <div class="row items-center q-gutter-sm">
        <div class="text-h6 text-weight-medium text-dark ellipsis">
          {{ task?.title || session.taskDescription || 'Sesión heurística' }}
        </div>
        <q-badge :color="getStatusColor(session.status)">
          {{ getStatusLabel(session.status) }}
        </q-badge>
        <q-badge v-if="evaluation" color="primary" outline>
          {{ evaluation.name }}
        </q-badge>
      </div>

      <div class="row items-center q-gutter-md text-caption text-grey-6 q-mt-xs">
        <span>
          <q-icon name="person" size="14px" />
          {{ userName || 'Evaluador' }}
        </span>
        <span>
          <q-icon name="devices" size="14px" />
          {{ session.deviceType || '—' }}
        </span>
        <span>
          <q-icon name="calendar_today" size="14px" />
          {{ formatDate(session.startedAt) }}
        </span>
        <span>
          <q-icon name="timer" size="14px" />
          {{ formatDuration(session.durationSeconds) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UsabilitySession } from '@/composables/coordinator/heuristic/useHeuristicSessionDetail'
import type {
  HeuristicEvaluation,
  HeuristicTask,
  HeuristicEvaluator,
} from '@/api/heuristic.api'

defineProps<{
  session: UsabilitySession | null
  evaluation: HeuristicEvaluation | null
  task: HeuristicTask | null
  evaluator: HeuristicEvaluator | null
  userName: string
}>()

defineEmits<{
  (e: 'back'): void
}>()

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    in_progress: 'warning',
    completed: 'positive',
    abandoned: 'negative',
  }
  return colors[status] || 'grey'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    in_progress: 'En progreso',
    completed: 'Completada',
    abandoned: 'Abandonada',
  }
  return labels[status] || status
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00'
  const min = Math.floor(seconds / 60).toString().padStart(2, '0')
  const sec = (seconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}
</script>