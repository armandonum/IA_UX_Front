<!-- views/roles/coordinador/heuristic/HeuristicEvaluationDetailView.vue -->
<template>
  <div class="q-pa-md">
    <!-- ========================================================== -->
    <!-- HEADER                                                     -->
    <!-- ========================================================== -->
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn
        flat
        round
        icon="arrow_back"
        color="primary"
        @click="goBack"
      />
      <div class="col">
        <div class="text-h5 text-weight-bold">
          {{ evaluation?.name || 'Cargando...' }}
        </div>
        <div class="text-caption text-grey-6">
          Framework: <strong>{{ frameworkName }}</strong> ·
          Estado: <strong>{{ getStatusLabel(evaluation?.status) }}</strong>
        </div>
      </div>

      <q-btn
        color="primary"
        icon="refresh"
        flat
        @click="reload"
        :loading="loading"
      />
      <q-btn
        v-if="canGenerateResults"
        color="deep-purple"
        icon="analytics"
        label="Generar Resultados Finales"
        unelevated
        @click="handleGenerateResults"
        :loading="generatingResults"
      />
    </div>

    <!-- ==========coordinator/heuristic/detail/HeuristicTimeline.vue================================================ -->
    <!-- INFO CARD                                                  -->
    <!-- ========================================================== -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-6">Descripción</div>
            <div class="text-body2 ellipsis-2-lines">
              {{ evaluation?.description || '—' }}
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-6">Sistema</div>
            <div class="text-body2 ellipsis-2-lines">
              {{ evaluation?.systemDescription || '—' }}
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <div class="text-caption text-grey-6">Duración máx.</div>
            <div class="text-body2">
              {{ evaluation?.maxDurationMinutes }} min
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <div class="text-caption text-grey-6">Progreso</div>
            <div class="row items-center q-gutter-xs">
              <q-circular-progress
                :value="evaluationProgress"
                size="32px"
                :color="getProgressColor(evaluationProgress)"
                track-color="grey-3"
                show-value
                font-size="9px"
              />
              <span class="text-weight-medium">{{ evaluationProgress }}%</span>
            </div>
          </div>

          <div class="col-12 col-md-2 text-right">
            <q-btn
              v-if="canStart"
              color="positive"
              icon="play_arrow"
              label="Iniciar"
              unelevated
              size="sm"
              @click="handleStart"
              :loading="loading"
            />
            <q-btn
              v-if="canComplete"
              color="primary"
              icon="check_circle"
              label="Completar"
              unelevated
              size="sm"
              @click="handleComplete"
              :loading="loading"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ========================================================== -->
    <!-- KPIs                                                       -->
    <!-- ========================================================== -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-blue-1">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Evaluadores</div>
                <div class="text-h5 text-weight-bold text-primary">
                  {{ completedEvaluators }}/{{ totalEvaluators }}
                </div>
              </div>
              <q-icon name="groups" size="42px" color="primary" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-orange-1">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Observaciones</div>
                <div class="text-h5 text-weight-bold text-orange">
                  {{ totalObservations }}
                </div>
              </div>
              <q-icon name="report_problem" size="42px" color="orange" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-green-1">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Positivos</div>
                <div class="text-h5 text-weight-bold text-positive">
                  {{ totalPositiveAspects }}
                </div>
              </div>
              <q-icon name="thumb_up" size="42px" color="positive" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-purple-1">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Sesiones</div>
                <div class="text-h5 text-weight-bold text-purple">
                  {{ sessions.length }}
                </div>
              </div>
              <q-icon name="video_library" size="42px" color="purple" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- LISTA DE SESIONES                                          -->
    <!-- ========================================================== -->
    <q-card flat bordered>
      <q-card-section>
        <div class="row items-center q-mb-md">
          <q-icon name="video_library" color="primary" size="24px" class="q-mr-sm" />
          <div class="text-h6">Sesiones de Evaluación</div>
          <q-space />
          <div class="text-caption text-grey-6">
            Haz click en una sesión para ver el detalle
          </div>
        </div>

        <SessionList
          :sessions="sessions"
          :evaluators="evaluators"
          :tasks="tasks"
          :observations="observations"
          :positive-aspects="positiveAspects"
          :task-progress="taskProgress"
          :loading="loading"
          :active-session-id="activeSessionId"
          :user-names="userNames"
          @select-session="handleSelectSession"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import api from '@/api/axios'
import { heuristicApi } from '@/api/heuristic.api'
import SessionList from '@/components/coordinator/heuristic/detail/SessionList.vue'
import type {
  HeuristicEvaluation,
  HeuristicFramework,
  HeuristicEvaluator,
  HeuristicTask,
  HeuristicObservation,
  HeuristicPositiveAspect,
  HeuristicTaskProgress,
} from '@/api/heuristic.api'
import type { UsabilitySession } from '@/composables/coordinator/heuristic/useHeuristicSessionDetail'

// ============================================================
// ROUTER
// ============================================================
const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const evaluationId = computed(() => route.params.evaluationId as string)

// ============================================================
// ESTADO
// ============================================================
const loading = ref(false)
const generatingResults = ref(false)
const error = ref<string | null>(null)

const evaluation = ref<HeuristicEvaluation | null>(null)
const framework = ref<HeuristicFramework | null>(null)
const evaluators = ref<HeuristicEvaluator[]>([])
const tasks = ref<HeuristicTask[]>([])
const observations = ref<HeuristicObservation[]>([])
const positiveAspects = ref<HeuristicPositiveAspect[]>([])
const taskProgress = ref<HeuristicTaskProgress[]>([])
const sessions = ref<UsabilitySession[]>([])
const userNames = ref<Record<string, { name: string; email: string }>>({})

const activeSessionId = ref<string | null>(null)

// ============================================================
// COMPUTED
// ============================================================
const frameworkName = computed(() => framework.value?.name || '—')

const completedEvaluators = computed(
  () => evaluators.value.filter(e => e.completedAt).length,
)
const totalEvaluators = computed(() => evaluators.value.length)

const totalObservations = computed(() => observations.value.length)
const totalPositiveAspects = computed(() => positiveAspects.value.length)

const evaluationProgress = computed(() => {
  if (totalEvaluators.value === 0) return 0
  return Math.round((completedEvaluators.value / totalEvaluators.value) * 100)
})

const canStart = computed(() => evaluation.value?.status === 'draft' || evaluation.value?.status === 'planning')
const canComplete = computed(() => evaluation.value?.status === 'in_progress')
const canGenerateResults = computed(
  () => evaluation.value?.status === 'in_progress' || evaluation.value?.status === 'completed',
)

// ============================================================
// CARGA DE DATOS
// ============================================================
async function loadAll() {
  loading.value = true
  error.value = null

  try {
    // 1. Cargar evaluación
    const evalRes = await heuristicApi.getEvaluation(evaluationId.value)
    evaluation.value = evalRes.data

    // 2. Cargar framework
    const fwRes = await heuristicApi.getFramework(evalRes.data.frameworkId)
    framework.value = fwRes.data

    // 3. Cargar datos en paralelo
// 3. Cargar datos en paralelo
const [evaluatorsRes, tasksRes, obsRes, posRes, progressRes] = await Promise.all([
  heuristicApi.getEvaluatorsByEvaluation(evaluationId.value),
  heuristicApi.getTasksByEvaluation(evaluationId.value),
  heuristicApi.getObservationsByEvaluation(evaluationId.value),
  heuristicApi.getPositiveAspectsByEvaluation(evaluationId.value),
  heuristicApi.findProgressByEvaluation(evaluationId.value).catch(() => ({ data: [] })),
])

    evaluators.value = evaluatorsRes.data
    tasks.value = tasksRes.data
    observations.value = obsRes.data
    positiveAspects.value = posRes.data
    taskProgress.value = progressRes.data || []

    // 4. Cargar nombres de usuarios
    await loadUserNames()

    // 5. Cargar sesiones de usabilidad (filtradas)
    await loadSessions()
  } catch (e: any) {
    error.value = e.message || 'Error al cargar la evaluación'
    console.error(e)
    $q.notify({ type: 'negative', message: error.value })
  } finally {
    loading.value = false
  }
}

async function loadUserNames() {
  try {
    const { data } = await api.get('/users')
    const map: Record<string, { name: string; email: string }> = {}
    data.forEach((u: any) => {
      map[u.user_id] = {
        name: u.display_name || 'Usuario',
        email: u.email || '',
      }
    })
    userNames.value = map
  } catch (e) {
    console.warn('No se pudieron cargar los nombres de usuarios:', e)
  }
}

/**
 * Carga las sesiones heurísticas de esta evaluación.
 *
 * Estrategia: filtrar por project_id + evaluation_type='heuristic' + task_id en las tareas de la evaluación.
 */
async function loadSessions() {
  try {
    // 1. Obtener todas las sesiones del proyecto
    const projectId = evaluation.value?.projectId
    if (!projectId) return

    const { data: allSessions } = await api.get('/usability-sessions')

    // 2. Obtener los task IDs de la evaluación
    const evaluationTaskIds = new Set(tasks.value.map(t => t.id))

    // 3. Filtrar sesiones
    const filtered = (allSessions as UsabilitySession[]).filter(s => {
      // Debe ser del mismo proyecto
      if (s.proyectId !== projectId) return false
      // Debe ser heurística
      if (s.evaluationType !== 'heuristic') return false
      // La tarea debe pertenecer a esta evaluación
      if (!s.taskId || !evaluationTaskIds.has(s.taskId)) return false
      return true
    })

    sessions.value = filtered
  } catch (e) {
    console.error('Error al cargar sesiones:', e)
    sessions.value = []
  }
}

// ============================================================
// ACCIONES
// ============================================================
async function handleStart() {
  const confirm = await $q.dialog({
    title: 'Iniciar Evaluación',
    message: '¿Iniciar la evaluación? Los evaluadores podrán comenzar.',
    ok: 'Iniciar',
    cancel: true,
    persistent: true,
  })
  if (confirm) {
    await heuristicApi.updateEvaluationStatus(evaluationId.value, 'in_progress')
    await loadAll()
  }
}

async function handleComplete() {
  const confirm = await $q.dialog({
    title: 'Completar Evaluación',
    message: '¿Completar la evaluación?',
    ok: 'Completar',
    cancel: true,
    persistent: true,
  })
  if (confirm) {
    await heuristicApi.updateEvaluationStatus(evaluationId.value, 'completed')
    await loadAll()
  }
}

async function handleGenerateResults() {
  const confirm = await $q.dialog({
    title: 'Generar Resultados Finales',
    message: 'Se consolidarán todas las observaciones y calificaciones.',
    ok: 'Generar',
    cancel: true,
    persistent: true,
  })

  if (!confirm) return

  generatingResults.value = true
  try {
    await heuristicApi.generateFinalResults({
      evaluationId: evaluationId.value,
      totalEvaluators: totalEvaluators.value,
      completedEvaluators: completedEvaluators.value,
    })
    $q.notify({ type: 'positive', message: 'Resultados generados correctamente' })
    await loadAll()
  } catch (e: any) {
    $q.notify({ type: 'negative', message: 'Error al generar resultados' })
  } finally {
    generatingResults.value = false
  }
}

// ============================================================
// NAVEGACIÓN
// ============================================================
function handleSelectSession(session: UsabilitySession) {
  activeSessionId.value = session.sessionId
  router.push({
    name: 'CoordinadorHeuristicoSessionDetail',
    params: {
      evaluationId: evaluationId.value,
      sessionId: session.sessionId,
    },
  })
}

function goBack() {
  router.push({ name: 'CoordinadorHeuristico' })
}

function reload() {
  loadAll()
}

// ============================================================
// HELPERS
// ============================================================
function getStatusLabel(status?: string): string {
  if (!status) return '—'
  const labels: Record<string, string> = {
    draft: 'Borrador',
    planning: 'Planificación',
    in_progress: 'En progreso',
    completed: 'Completada',
    archived: 'Archivada',
  }
  return labels[status] || status
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return 'positive'
  if (progress >= 50) return 'warning'
  return 'grey'
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(loadAll)

watch(evaluationId, () => {
  if (evaluationId.value) loadAll()
})
</script>

<style scoped>
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bg-blue-1 {
  background-color: #e3f2fd;
}
.bg-orange-1 {
  background-color: #fff3e0;
}
.bg-green-1 {
  background-color: #e8f5e9;
}
.bg-purple-1 {
  background-color: #f3e5f5;
}
</style>