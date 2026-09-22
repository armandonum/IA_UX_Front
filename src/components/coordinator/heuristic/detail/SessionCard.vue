<!-- components/coordinador/heuristic/detail/SessionCard.vue -->
<template>
  <q-card
    flat
    bordered
    class="session-card cursor-pointer"
    :class="{ 'session-card--active': isActive }"
    @click="$emit('click')"
  >
    <q-card-section>
      <!-- Header: evaluador + estado -->
      <div class="row items-center q-gutter-sm q-mb-sm">
        <q-avatar color="primary" text-color="white" size="36px">
          {{ getInitials(evaluatorName) }}
        </q-avatar>
        <div class="col">
          <div class="text-subtitle2 text-weight-medium ellipsis">
            {{ evaluatorName || 'Evaluador desconocido' }}
          </div>
          <div class="text-caption text-grey-6 ellipsis">
            {{ evaluatorEmail || '—' }}
          </div>
        </div>
        <q-badge :color="getStatusColor(session.status)">
          {{ getStatusLabel(session.status) }}
        </q-badge>
      </div>

      <q-separator class="q-my-sm" />

      <!-- Tarea -->
      <div class="row items-center q-gutter-sm q-mb-sm">
        <q-icon name="task" color="primary" size="18px" />
        <div class="col">
          <div class="text-caption text-grey-6">Tarea</div>
          <div class="text-body2 text-weight-medium ellipsis">
            {{ taskTitle || session.taskDescription || '—' }}
          </div>
        </div>
      </div>

      <!-- Métricas -->
      <div class="row q-col-gutter-sm q-mt-sm">
        <div class="col-6">
          <div class="metric-box">
            <q-icon name="timer" size="16px" color="primary" />
            <div class="text-caption text-grey-6">Duración</div>
            <div class="text-body2 text-weight-medium">
              {{ formatDuration(session.durationSeconds) }}
            </div>
          </div>
        </div>

        <div class="col-6">
          <div class="metric-box">
            <q-icon name="report_problem" size="16px" color="orange" />
            <div class="text-caption text-grey-6">Observaciones</div>
            <div class="text-body2 text-weight-medium">
              {{ observationsCount }}
            </div>
          </div>
        </div>

        <div class="col-6">
          <div class="metric-box">
            <q-icon name="thumb_up" size="16px" color="positive" />
            <div class="text-caption text-grey-6">Positivos</div>
            <div class="text-body2 text-weight-medium">
              {{ positiveAspectsCount }}
            </div>
          </div>
        </div>

        <div class="col-6">
          <div class="metric-box">
            <q-icon name="check_circle" size="16px" color="info" />
            <div class="text-caption text-grey-6">Progreso</div>
            <div class="text-body2 text-weight-medium">
              {{ progressLabel }}
            </div>
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right" class="q-py-sm">
      <q-btn
        flat
        dense
        color="primary"
        icon="play_arrow"
        label="Ver detalle"
        @click.stop="$emit('click')"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UsabilitySession } from '@/composables/coordinator/heuristic/useHeuristicSessionDetail'

const props = defineProps<{
  session: UsabilitySession
  evaluatorName?: string
  evaluatorEmail?: string
  taskTitle?: string
  observationsCount?: number
  positiveAspectsCount?: number
  taskProgressStatus?: string | null
  isActive?: boolean
}>()

defineEmits<{
  (e: 'click'): void
}>()

const progressLabel = computed(() => {
  const status = props.taskProgressStatus
  if (!status) return '—'
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completada',
    failed: 'Fallida',
  }
  return labels[status] || status
})

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

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

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00'
  const min = Math.floor(seconds / 60).toString().padStart(2, '0')
  const sec = (seconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}
</script>

<style scoped>
.session-card {
  transition: all 0.2s ease-in-out;
  height: 100%;
}

.session-card:hover {
  border-color: var(--q-primary);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.12);
  transform: translateY(-2px);
}

.session-card--active {
  border-color: var(--q-primary);
  border-width: 2px;
  background: rgba(30, 58, 138, 0.03);
}

.metric-box {
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 62px;
}
</style>