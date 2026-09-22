<!-- components/coordinador/heuristic/detail/SessionList.vue -->
<template>
  <div>
    <!-- ========================================================== -->
    <!-- HEADER CON FILTROS                                        -->
    <!-- ========================================================== -->
    <div class="row items-center q-mb-md q-col-gutter-sm">
      <div class="col">
        <div class="text-subtitle1 text-weight-medium">
          {{ filteredSessions.length }} sesión(es)
        </div>
        <div class="text-caption text-grey-6">
          {{ sessions.length }} en total
        </div>
      </div>

      <!-- Filtro por evaluador -->
      <div class="col-auto">
        <q-select
          v-model="filterEvaluator"
          :options="evaluatorOptions"
          option-label="label"
          option-value="value"
          label="Evaluador"
          dense
          outlined
          clearable
          emit-value
          map-options
          style="min-width: 200px"
        >
          <template v-slot:prepend>
            <q-icon name="person" />
          </template>
        </q-select>
      </div>

      <!-- Filtro por tarea -->
      <div class="col-auto">
        <q-select
          v-model="filterTask"
          :options="taskOptions"
          option-label="label"
          option-value="value"
          label="Tarea"
          dense
          outlined
          clearable
          emit-value
          map-options
          style="min-width: 200px"
        >
          <template v-slot:prepend>
            <q-icon name="task" />
          </template>
        </q-select>
      </div>

      <!-- Filtro por estado -->
      <div class="col-auto">
        <q-select
          v-model="filterStatus"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          label="Estado"
          dense
          outlined
          clearable
          emit-value
          map-options
          style="min-width: 160px"
        >
          <template v-slot:prepend>
            <q-icon name="flag" />
          </template>
        </q-select>
      </div>

      <!-- Buscador -->
      <div class="col-auto">
        <q-input
          v-model="searchQuery"
          placeholder="Buscar..."
          dense
          outlined
          clearable
          style="min-width: 200px"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- ESTADO: CARGANDO                                          -->
    <!-- ========================================================== -->
    <div v-if="loading" class="row justify-center q-py-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <!-- ========================================================== -->
    <!-- ESTADO: SIN SESIONES                                      -->
    <!-- ========================================================== -->
    <div v-else-if="sessions.length === 0" class="text-center q-py-xl">
      <q-icon name="assignment" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">
        No hay sesiones en esta evaluación
      </div>
      <div class="text-caption text-grey-5">
        Las sesiones aparecerán cuando los evaluadores comiencen las tareas
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- ESTADO: SIN RESULTADOS FILTRADOS                          -->
    <!-- ========================================================== -->
    <div v-else-if="filteredSessions.length === 0" class="text-center q-py-xl">
      <q-icon name="search_off" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">
        No hay sesiones que coincidan con los filtros
      </div>
      <q-btn
        flat
        color="primary"
        label="Limpiar filtros"
        class="q-mt-md"
        @click="clearFilters"
      />
    </div>

    <!-- ========================================================== -->
    <!-- GRID DE SESIONES                                          -->
    <!-- ========================================================== -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="session in filteredSessions"
        :key="session.sessionId"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <SessionCard
          :session="session"
          :evaluator-name="getEvaluatorName(session.userId)"
          :evaluator-email="getEvaluatorEmail(session.userId)"
          :task-title="getTaskTitle(session.taskId)"
          :observations-count="getObservationsCount(session.sessionId)"
          :positive-aspects-count="getPositiveAspectsCount(session.sessionId)"
          :task-progress-status="getTaskProgressStatus(session)"
          :is-active="session.sessionId === activeSessionId"
          @click="$emit('select-session', session)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SessionCard from './SessionCard.vue'
import type { UsabilitySession } from '@/composables/coordinator/heuristic/useHeuristicSessionDetail'
import type {
  HeuristicEvaluator,
  HeuristicTask,
  HeuristicObservation,
  HeuristicPositiveAspect,
  HeuristicTaskProgress,
} from '@/api/heuristic.api'

const props = defineProps<{
  sessions: UsabilitySession[]
  evaluators: HeuristicEvaluator[]
  tasks: HeuristicTask[]
  observations: HeuristicObservation[]
  positiveAspects: HeuristicPositiveAspect[]
  taskProgress: HeuristicTaskProgress[]
  loading?: boolean
  activeSessionId?: string | null
  userNames?: Record<string, { name: string; email: string }>
}>()

defineEmits<{
  (e: 'select-session', session: UsabilitySession): void
}>()

// ============================================================
// FILTROS
// ============================================================
const filterEvaluator = ref<string | null>(null)
const filterTask = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const searchQuery = ref('')

// ============================================================
// OPCIONES DE FILTRO
// ============================================================
const evaluatorOptions = computed(() =>
  props.evaluators.map(e => ({
    label:
      props.userNames?.[e.userId]?.name || `Evaluador ${e.userId.slice(0, 8)}`,
    value: e.userId,
  })),
)

const taskOptions = computed(() =>
  props.tasks.map(t => ({
    label: t.title,
    value: t.id,
  })),
)

const statusOptions = [
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completada', value: 'completed' },
  { label: 'Abandonada', value: 'abandoned' },
]

// ============================================================
// SESIONES FILTRADAS
// ============================================================
const filteredSessions = computed(() => {
  let result = props.sessions

  if (filterEvaluator.value) {
    result = result.filter(s => s.userId === filterEvaluator.value)
  }

  if (filterTask.value) {
    result = result.filter(s => s.taskId === filterTask.value)
  }

  if (filterStatus.value) {
    result = result.filter(s => s.status === filterStatus.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(s => {
      const taskTitle = getTaskTitle(s.taskId)?.toLowerCase() || ''
      const taskDesc = s.taskDescription?.toLowerCase() || ''
      const evaluatorName = getEvaluatorName(s.userId)?.toLowerCase() || ''
      return (
        taskTitle.includes(query) ||
        taskDesc.includes(query) ||
        evaluatorName.includes(query)
      )
    })
  }

  // Ordenar por fecha descendente
  return [...result].sort(
    (a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
})

// ============================================================
// HELPERS
// ============================================================
function getEvaluatorName(userId: string): string {
  return props.userNames?.[userId]?.name || `Evaluador ${userId.slice(0, 8)}`
}

function getEvaluatorEmail(userId: string): string {
  return props.userNames?.[userId]?.email || ''
}

function getTaskTitle(taskId: string | null): string {
  if (!taskId) return '—'
  return props.tasks.find(t => t.id === taskId)?.title || '—'
}

function getObservationsCount(sessionId: string): number {
  return props.observations.filter(o => o.sessionId === sessionId).length
}

function getPositiveAspectsCount(sessionId: string): number {
  return props.positiveAspects.filter(a => a.sessionId === sessionId).length
}

function getTaskProgressStatus(session: UsabilitySession): string | null {
  if (!session.taskId) return null
  const progress = props.taskProgress.find(
    p =>
      p.taskId === session.taskId &&
      p.evaluatorId ===
        props.evaluators.find(e => e.userId === session.userId)?.id,
  )
  return progress?.status || null
}

function clearFilters() {
  filterEvaluator.value = null
  filterTask.value = null
  filterStatus.value = null
  searchQuery.value = ''
}
</script>