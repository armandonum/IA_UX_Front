<!-- components/docente/heuristics/detail/TaskProgressViewer.vue -->
<template>
  <div>
    <!-- ============================================================ -->
    <!-- HEADER + STATS                                                -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle2 text-weight-bold">
          📈 Matriz de progreso
        </div>
        <div class="text-caption text-grey-6">
          Estado de cada evaluador en cada tarea
        </div>
      </div>

      <q-btn
        flat
        color="primary"
        icon="refresh"
        label="Actualizar"
        :loading="loading"
        @click="$emit('reload')"
      />
    </div>

    <!-- Stats rápidas -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm">
          <div class="text-h5 text-primary text-weight-bold">
            {{ stats.completed }}
          </div>
          <div class="text-caption text-grey-7">Completadas</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm">
          <div class="text-h5 text-warning text-weight-bold">
            {{ stats.inProgress }}
          </div>
          <div class="text-caption text-grey-7">En progreso</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm">
          <div class="text-h5 text-grey-6 text-weight-bold">
            {{ stats.pending }}
          </div>
          <div class="text-caption text-grey-7">Pendientes</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm">
          <div class="text-h5 text-negative text-weight-bold">
            {{ stats.failed }}
          </div>
          <div class="text-caption text-grey-7">Fallidas</div>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- ESTADOS                                                       -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="32px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando progreso...</div>
    </div>

    <div
      v-else-if="!evaluators.length || !tasks.length"
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="info" size="48px" />
      <div class="text-h6 q-mt-sm">Falta información</div>
      <div class="text-caption">
        Necesitas asignar evaluadores y crear tareas primero
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- MATRIZ                                                        -->
    <!-- ============================================================ -->
    <q-card v-else flat bordered>
      <q-card-section class="q-pa-none">
        <div style="overflow-x: auto;">
          <q-markup-table flat dense separator="cell">
            <thead class="bg-grey-2">
              <tr>
                <th class="text-left" style="min-width: 220px; position: sticky; left: 0; background: #f5f5f5; z-index: 2;">
                  <div class="row items-center">
                    <q-icon name="person" size="16px" class="q-mr-xs" />
                    Evaluador
                  </div>
                </th>
                <th
                  v-for="task in sortedTasks"
                  :key="task.id"
                  class="text-center"
                  style="min-width: 130px;"
                >
                  <div class="column items-center q-pa-xs">
                    <q-badge color="primary" text-color="white">
                      #{{ task.orderIndex }}
                    </q-badge>
                    <div class="text-caption text-weight-medium q-mt-xs" style="max-width: 120px; white-space: normal;">
                      {{ task.title }}
                    </div>
                  </div>
                </th>
                <th class="text-center" style="min-width: 100px;">
                  Progreso
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="ev in evaluators" :key="ev.id">
                <!-- Columna evaluador (sticky) -->
                <td style="position: sticky; left: 0; background: white; z-index: 1;">
                  <div class="row items-center no-wrap q-gutter-xs">
                    <q-avatar
                      :color="ev.completedAt ? 'positive' : 'primary'"
                      text-color="white"
                      size="28px"
                    >
                      <q-icon
                        :name="ev.completedAt ? 'check' : 'person'"
                        size="14px"
                      />
                    </q-avatar>
                    <div>
                      <div class="text-caption text-weight-medium">
                        {{ getUserName(ev.userId) }}
                      </div>
                      <div class="text-caption text-grey-6" style="font-size: 10px;">
                        {{ getRoleLabel(ev.role) }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Celda por tarea -->
                <td
                  v-for="task in sortedTasks"
                  :key="task.id"
                  class="text-center"
                  :class="getCellClass(matrix[ev.id]?.[task.id])"
                >
                  <q-icon
                    :name="getStatusIcon(matrix[ev.id]?.[task.id])"
                    :color="getStatusColor(matrix[ev.id]?.[task.id])"
                    size="22px"
                  >
                    <q-tooltip>
                      {{ getStatusLabel(matrix[ev.id]?.[task.id]) }}
                    </q-tooltip>
                  </q-icon>
                </td>

                <!-- Progreso del evaluador -->
                <td class="text-center">
                  <q-circular-progress
                    :value="getEvaluatorProgress(ev)"
                    size="40px"
                    :thickness="0.2"
                    :color="getEvaluatorProgress(ev) === 100 ? 'positive' : 'primary'"
                    track-color="grey-3"
                    show-value
                    font-size="10px"
                  >
                    {{ getEvaluatorProgress(ev) }}%
                  </q-circular-progress>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- LEYENDA                                                       -->
    <!-- ============================================================ -->
    <q-card v-if="evaluators.length && tasks.length" flat bordered class="q-mt-md">
      <q-card-section class="q-py-sm">
        <div class="row items-center q-gutter-lg">
          <div class="text-caption text-grey-6">Leyenda:</div>
          <div class="row items-center">
            <q-icon name="radio_button_unchecked" color="grey-5" size="18px" class="q-mr-xs" />
            <span class="text-caption">Pendiente</span>
          </div>
          <div class="row items-center">
            <q-icon name="timelapse" color="warning" size="18px" class="q-mr-xs" />
            <span class="text-caption">En progreso</span>
          </div>
          <div class="row items-center">
            <q-icon name="check_circle" color="positive" size="18px" class="q-mr-xs" />
            <span class="text-caption">Completada</span>
          </div>
          <div class="row items-center">
            <q-icon name="cancel" color="negative" size="18px" class="q-mr-xs" />
            <span class="text-caption">Fallida</span>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- DETALLE EXPANDIBLE                                            -->
    <!-- ============================================================ -->
    <q-expansion-item
      v-if="evaluators.length && tasks.length"
      class="q-mt-md"
      icon="analytics"
      label="Ver estadísticas por tarea"
      caption="Resumen agregado de cada tarea"
      header-class="bg-grey-2 text-dark"
    >
      <q-card flat bordered>
        <q-card-section>
          <q-list separator>
            <q-item v-for="task in sortedTasks" :key="task.id">
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  #{{ task.orderIndex }} — {{ task.title }}
                </q-item-label>
                <q-item-label caption>{{ task.description }}</q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row items-center q-gutter-sm">
                  <q-chip
                    v-if="getTaskStats(task.id).completed > 0"
                    color="positive"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    <q-icon name="check" size="12px" class="q-mr-xs" />
                    {{ getTaskStats(task.id).completed }}
                  </q-chip>
                  <q-chip
                    v-if="getTaskStats(task.id).inProgress > 0"
                    color="warning"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    <q-icon name="timelapse" size="12px" class="q-mr-xs" />
                    {{ getTaskStats(task.id).inProgress }}
                  </q-chip>
                  <q-chip
                    v-if="getTaskStats(task.id).pending > 0"
                    color="grey-5"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    <q-icon name="schedule" size="12px" class="q-mr-xs" />
                    {{ getTaskStats(task.id).pending }}
                  </q-chip>
                  <q-chip
                    v-if="getTaskStats(task.id).failed > 0"
                    color="negative"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    <q-icon name="cancel" size="12px" class="q-mr-xs" />
                    {{ getTaskStats(task.id).failed }}
                  </q-chip>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDocenteStore } from '@/stores/docente.stores'
import type {
  HeuristicEvaluator,
  HeuristicTask,
  HeuristicTaskProgress,
} from '@/api/heuristic.api'

const props = defineProps<{
  evaluators: HeuristicEvaluator[]
  tasks: HeuristicTask[]
  progress: HeuristicTaskProgress[]
  loading?: boolean
}>()

defineEmits<{ (e: 'reload'): void }>()

const docenteStore = useDocenteStore()

// ============================================================
// COMPUTED
// ============================================================
const sortedTasks = computed(() =>
  [...props.tasks].sort((a, b) => a.orderIndex - b.orderIndex),
)

/**
 * Matriz evaluador x tarea → status
 */
const matrix = computed(() => {
  const m: Record<string, Record<string, string>> = {}
  for (const ev of props.evaluators) {
    m[ev.id] = {}
    for (const task of props.tasks) {
      const p = props.progress.find(
        (pr) => pr.evaluatorId === ev.userId && pr.taskId === task.id,
      )
      m[ev.id][task.id] = p?.status || 'pending'
    }
  }
  return m
})

const stats = computed(() => {
  const flat = Object.values(matrix.value).flatMap((tasks) =>
    Object.values(tasks),
  )
  return {
    completed: flat.filter((s) => s === 'completed').length,
    inProgress: flat.filter((s) => s === 'in_progress').length,
    pending: flat.filter((s) => s === 'pending').length,
    failed: flat.filter((s) => s === 'failed').length,
  }
})

// ============================================================
// HELPERS
// ============================================================
function getUserName(userId: string): string {
  const user = docenteStore.students.find((s: any) => s.user_id === userId)
  return user?.display_name || `Usuario ${userId.substring(0, 8)}`
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    supervisor: 'Supervisor',
    evaluator: 'Evaluador',
    observer: 'Observador',
  }
  return labels[role] || role
}

function getStatusIcon(status?: string): string {
  const icons: Record<string, string> = {
    pending: 'radio_button_unchecked',
    in_progress: 'timelapse',
    completed: 'check_circle',
    failed: 'cancel',
  }
  return icons[status || 'pending'] || 'help'
}

function getStatusColor(status?: string): string {
  const colors: Record<string, string> = {
    pending: 'grey-5',
    in_progress: 'warning',
    completed: 'positive',
    failed: 'negative',
  }
  return colors[status || 'pending'] || 'grey'
}

function getStatusLabel(status?: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completada',
    failed: 'Fallida',
  }
  return labels[status || 'pending'] || 'Pendiente'
}

function getCellClass(status?: string): string {
  if (status === 'completed') return 'bg-green-1'
  if (status === 'in_progress') return 'bg-orange-1'
  if (status === 'failed') return 'bg-red-1'
  return ''
}

function getEvaluatorProgress(ev: HeuristicEvaluator): number {
  if (!props.tasks.length) return 0
  const tasksStatus = matrix.value[ev.id] || {}
  const completed = Object.values(tasksStatus).filter(
    (s) => s === 'completed',
  ).length
  return Math.round((completed / props.tasks.length) * 100)
}

function getTaskStats(taskId: string) {
  const statuses = props.evaluators.map(
    (ev) => matrix.value[ev.id]?.[taskId] || 'pending',
  )
  return {
    completed: statuses.filter((s) => s === 'completed').length,
    inProgress: statuses.filter((s) => s === 'in_progress').length,
    pending: statuses.filter((s) => s === 'pending').length,
    failed: statuses.filter((s) => s === 'failed').length,
  }
}
</script>

<style scoped>
.bg-green-1 {
  background-color: #f0fdf4;
}
.bg-orange-1 {
  background-color: #fff7ed;
}
.bg-red-1 {
  background-color: #fef2f2;
}
</style>