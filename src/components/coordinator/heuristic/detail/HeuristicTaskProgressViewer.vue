<!-- components/coordinador/heuristic/detail/HeuristicTaskProgressViewer.vue -->
<template>
  <div>
    <!-- Sin tarea -->
    <div
      v-if="!task"
      class="text-center q-py-lg text-grey-6"
    >
      <q-icon name="task_alt" size="48px" />
      <div class="q-mt-sm">No hay información de tarea para esta sesión</div>
    </div>

    <template v-else>
      <!-- ========================================================== -->
      <!-- CARD: INFO DE LA TAREA                                    -->
      <!-- ========================================================== -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-icon name="task" color="primary" size="24px" />
            <div class="text-subtitle1 text-weight-medium">
              {{ task.title }}
            </div>
            <q-space />
            <q-badge :color="getProgressColor(taskProgress?.status)">
              {{ getProgressLabel(taskProgress?.status) }}
            </q-badge>
          </div>

          <div v-if="task.description" class="text-body2 text-grey-7 q-mb-sm">
            {{ task.description }}
          </div>

          <div v-if="task.userGoal" class="text-caption text-grey-6">
            <q-icon name="flag" size="12px" class="q-mr-xs" />
            <strong>Objetivo:</strong> {{ task.userGoal }}
          </div>
        </q-card-section>
      </q-card>

      <!-- ========================================================== -->
      <!-- CARD: PROGRESO                                            -->
      <!-- ========================================================== -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-md">
            📊 Progreso del Evaluador
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <div class="progress-box">
                <q-icon name="flag" size="20px" color="primary" />
                <div class="text-caption text-grey-6">Estado</div>
                <div class="text-body2 text-weight-medium">
                  {{ getProgressLabel(taskProgress?.status) }}
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <div class="progress-box">
                <q-icon name="play_arrow" size="20px" color="warning" />
                <div class="text-caption text-grey-6">Iniciado</div>
                <div class="text-body2 text-weight-medium">
                  {{ formatDate(taskProgress?.startedAt) }}
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <div class="progress-box">
                <q-icon name="check_circle" size="20px" color="positive" />
                <div class="text-caption text-grey-6">Completado</div>
                <div class="text-body2 text-weight-medium">
                  {{ formatDate(taskProgress?.completedAt) }}
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <div class="progress-box">
                <q-icon name="timer" size="20px" color="info" />
                <div class="text-caption text-grey-6">Duración</div>
                <div class="text-body2 text-weight-medium">
                  {{ getDuration() }}
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ========================================================== -->
      <!-- CARD: CONTEXTO DE LA EVALUACIÓN                           -->
      <!-- ========================================================== -->
      <q-card v-if="evaluation" flat bordered>
        <q-card-section>
          <div class="text-subtitle2 q-mb-md">
            📋 Contexto de la Evaluación
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-6">Evaluación</div>
              <div class="text-body2">{{ evaluation.name }}</div>
            </div>

            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-6">Sistema evaluado</div>
              <div class="text-body2">
                {{ evaluation.systemDescription || '—' }}
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-6">Duración máxima</div>
              <div class="text-body2">
                {{ evaluation.maxDurationMinutes }} min
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-6">Usuario objetivo</div>
              <div class="text-body2">
                {{ evaluation.targetUserDescription || '—' }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  HeuristicTask,
  HeuristicEvaluator,
  HeuristicTaskProgress,
  HeuristicEvaluation,
} from '@/api/heuristic.api'

defineProps<{
  task: HeuristicTask | null
  evaluator: HeuristicEvaluator | null
  taskProgress: HeuristicTaskProgress | null
  evaluation: HeuristicEvaluation | null
}>()

function getProgressColor(status?: string): string {
  const colors: Record<string, string> = {
    pending: 'grey',
    in_progress: 'warning',
    completed: 'positive',
    failed: 'negative',
  }
  return colors[status || 'pending'] || 'grey'
}

function getProgressLabel(status?: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completada',
    failed: 'Fallida',
  }
  return labels[status || 'pending'] || '—'
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function getDuration(): string {
  return '—'
}
</script>

<style scoped>
.progress-box {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-height: 80px;
}
</style>