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

    <!-- ========================================================== -->
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
    <!-- TABS                                                       -->
    <!-- ========================================================== -->
    <q-card flat bordered>
      <q-tabs
        v-model="tab"
        class="text-grey-7"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
        no-caps
      >
        <q-tab name="dashboard" icon="dashboard" label="Dashboard" />
        <q-tab name="sessions" icon="video_library">
          <q-badge v-if="sessions.length" color="purple" floating>
            {{ sessions.length }}
          </q-badge>
          Sesiones
        </q-tab>
        <q-tab name="tasks" icon="task">
          <q-badge v-if="tasks.length" color="primary" floating>
            {{ tasks.length }}
          </q-badge>
          Tareas
        </q-tab>
        <q-tab name="evaluators" icon="groups">
          <q-badge v-if="evaluators.length" color="info" floating>
            {{ evaluators.length }}
          </q-badge>
          Evaluadores
        </q-tab>
        <q-tab name="principles" icon="library_books" label="Principios" />
        <q-tab name="observations" icon="report_problem">
          <q-badge v-if="observations.length" color="orange" floating>
            {{ observations.length }}
          </q-badge>
          Observaciones
        </q-tab>
        <q-tab name="positives" icon="thumb_up">
          <q-badge v-if="positiveAspects.length" color="positive" floating>
            {{ positiveAspects.length }}
          </q-badge>
          Positivos
        </q-tab>
        <q-tab name="ratings" icon="star">
          <q-badge v-if="ratings.length" color="purple" floating>
            {{ ratings.length }}
          </q-badge>
          Calificaciones
        </q-tab>
        <q-tab name="results" icon="analytics" label="Resultados" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <!-- ==================================================== -->
        <!-- TAB: DASHBOARD                                        -->
        <!-- ==================================================== -->
        <q-tab-panel name="dashboard">
          <HeuristicDashboard
            :evaluation="evaluation"
            :framework="framework"
            :evaluators="evaluators"
            :tasks="tasks"
            :observations="observations"
            :positive-aspects="positiveAspects"
            :ratings="ratings"
            :final-results="finalResults"
            :principles="principles"
          />
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: SESIONES                                         -->
        <!-- ==================================================== -->
        <q-tab-panel name="sessions">
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
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: TAREAS                                           -->
        <!-- ==================================================== -->
        <q-tab-panel name="tasks">
          <HeuristicTaskManager
            :tasks="tasks"
            :project-tasks="projectTasks"
            :evaluation-id="evaluation?.evaluationId"
            :can-edit="canEdit"
            @add-tasks="handleAddTasksFromProject"
            @delete="handleDeleteTask"
            @reorder="handleReorderTasks"
          />
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: EVALUADORES                                      -->
        <!-- ==================================================== -->
        <q-tab-panel name="evaluators">
          <HeuristicEvaluatorManager
            :evaluators="evaluators"
            :available-users="availableUsers"
            :auth-user-id="authUserId"
            :can-edit="canEdit"
            @assign="handleAssignEvaluators"
            @remove="handleRemoveEvaluator"
          />
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: PRINCIPIOS                                       -->
        <!-- ==================================================== -->
        <q-tab-panel name="principles">
          <HeuristicPrincipleList
            :framework="framework"
            :principles="principles"
            :can-edit="false"
          />
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: OBSERVACIONES                                    -->
        <!-- ==================================================== -->
        <q-tab-panel name="observations">
          <HeuristicObservationViewer
            :observations="observations"
            :principles="principles"
            :evaluators="evaluators"
            :tasks="tasks"
          />
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: ASPECTOS POSITIVOS                               -->
        <!-- ==================================================== -->
        <q-tab-panel name="positives">
          <HeuristicPositiveAspectViewer
            :positive-aspects="positiveAspects"
            :evaluators="evaluators"
            :tasks="tasks"
          />
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: CALIFICACIONES                                   -->
        <!-- ==================================================== -->
        <q-tab-panel name="ratings">
          <HeuristicRatingViewer
            :ratings="ratings"
            :observations="observations"
            :principles="principles"
            :evaluators="evaluators"
          />
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: RESULTADOS FINALES                               -->
        <!-- ==================================================== -->
        <q-tab-panel name="results">
          <HeuristicFinalResultsViewer
            :final-results="finalResults"
            :evaluation="evaluation"
            :can-generate="isInProgress || isCompleted"
            :loading="loading"
            @generate="handleGenerateResults"
            @recalculate="handleRecalculateResults"
          />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import api from '@/api/axios'
import { heuristicApi } from '@/api/heuristic.api'
import { useAuthStore } from '@/stores/auth.store'

// Componentes
import SessionList from '@/components/coordinator/heuristic/detail/SessionList.vue'
import HeuristicDashboard from '@/components/coordinator/heuristic/HeuristicDashboard.vue'
import HeuristicTaskManager from '@/components/coordinator/heuristic/HeuristicTaskManager.vue'
import HeuristicEvaluatorManager from '@/components/coordinator/heuristic/HeuristicEvaluatorManager.vue'
import HeuristicPrincipleList from '@/components/coordinator/heuristic/HeuristicPrincipleList.vue'
import HeuristicObservationViewer from '@/components/coordinator/heuristic/HeuristicObservationViewer.vue'
import HeuristicPositiveAspectViewer from '@/components/coordinator/heuristic/HeuristicPositiveAspectViewer.vue'
import HeuristicRatingViewer from '@/components/coordinator/heuristic/HeuristicRatingViewer.vue'
import HeuristicFinalResultsViewer from '@/components/coordinator/heuristic/HeuristicFinalResultsViewer.vue'

import type {
  HeuristicEvaluation,
  HeuristicFramework,
  HeuristicEvaluator,
  HeuristicTask,
  HeuristicObservation,
  HeuristicPositiveAspect,
  HeuristicRating,
  HeuristicTaskProgress,
  HeuristicFinalResult,
  HeuristicPrinciple,
} from '@/api/heuristic.api'
import type { UsabilitySession } from '@/composables/coordinator/heuristic/useHeuristicSessionDetail'

// ============================================================
// ROUTER / STORE
// ============================================================
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()

const evaluationId = computed(() => route.params.evaluationId as string)
const authUserId = computed(() => auth.user?.user_id || '')

// ============================================================
// ESTADO
// ============================================================
const tab = ref('dashboard')
const loading = ref(false)
const generatingResults = ref(false)
const error = ref<string | null>(null)

// Datos de la evaluación
const evaluation = ref<HeuristicEvaluation | null>(null)
const framework = ref<HeuristicFramework | null>(null)
const evaluators = ref<HeuristicEvaluator[]>([])
const tasks = ref<HeuristicTask[]>([])
const principles = ref<HeuristicPrinciple[]>([])
const observations = ref<HeuristicObservation[]>([])
const positiveAspects = ref<HeuristicPositiveAspect[]>([])
const ratings = ref<HeuristicRating[]>([])
const taskProgress = ref<HeuristicTaskProgress[]>([])
const finalResults = ref<HeuristicFinalResult | null>(null)

// Sesiones
const sessions = ref<UsabilitySession[]>([])
const activeSessionId = ref<string | null>(null)
const userNames = ref<Record<string, { name: string; email: string }>>({})

// Datos auxiliares
const projectTasks = ref<any[]>([])
const availableUsers = ref<any[]>([])

// ============================================================
// COMPUTED
// ============================================================
const frameworkName = computed(() => framework.value?.name || '—')

const completedEvaluators = computed(
  () => evaluators.value.filter(e => e.completedAt).length,
)
const totalEvaluators = computed(() => evaluators.value.length)

const evaluationProgress = computed(() => {
  if (totalEvaluators.value === 0) return 0
  return Math.round((completedEvaluators.value / totalEvaluators.value) * 100)
})

const canStart = computed(
  () => evaluation.value?.status === 'draft' || evaluation.value?.status === 'planning',
)
const canComplete = computed(() => evaluation.value?.status === 'in_progress')
const canGenerateResults = computed(
  () => evaluation.value?.status === 'in_progress' || evaluation.value?.status === 'completed',
)
const canEdit = computed(
  () => evaluation.value?.status === 'draft' || evaluation.value?.status === 'planning',
)
const isInProgress = computed(() => evaluation.value?.status === 'in_progress')
const isCompleted = computed(() => evaluation.value?.status === 'completed')

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
    const [
      evaluatorsRes,
      tasksRes,
      principlesRes,
      obsRes,
      posRes,
      ratingsRes,
      progressRes,
      finalResultsRes,
    ] = await Promise.all([
      heuristicApi.getEvaluatorsByEvaluation(evaluationId.value),
      heuristicApi.getTasksByEvaluation(evaluationId.value),
      heuristicApi.getPrinciplesByFramework(evalRes.data.frameworkId),
      heuristicApi.getObservationsByEvaluation(evaluationId.value),
      heuristicApi.getPositiveAspectsByEvaluation(evaluationId.value),
      heuristicApi.getRatingsByEvaluation(evaluationId.value),
      heuristicApi.findProgressByEvaluation(evaluationId.value).catch(() => ({ data: [] })),
      heuristicApi.getFinalResultsByEvaluation(evaluationId.value).catch(() => ({ data: null })),
    ])

    evaluators.value = evaluatorsRes.data
    tasks.value = tasksRes.data
    principles.value = principlesRes.data
    observations.value = obsRes.data
    positiveAspects.value = posRes.data
    ratings.value = ratingsRes.data
    taskProgress.value = progressRes.data || []
    finalResults.value = finalResultsRes.data || null

    // 4. Cargar nombres de usuarios
    await loadUserNames()

    // 5. Cargar sesiones
    await loadSessions()

    // 6. Cargar tareas del proyecto (para agregar a la evaluación)
    if (evaluation.value?.projectId) {
      await loadProjectTasks(evaluation.value.projectId)
    }

    // 7. Cargar usuarios disponibles (para asignar evaluadores)
    await loadAvailableUsers()
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

async function loadProjectTasks(projectId: string) {
  try {
    const { data } = await api.get(`/tasks/projectId/${projectId}`)
    projectTasks.value = data
  } catch (e) {
    console.error('Error al cargar tareas del proyecto:', e)
  }
}

async function loadAvailableUsers() {
  try {
    const { data } = await api.get('/users')
    // Filtrar solo los usuarios creados por el auth user
    availableUsers.value = data.filter((u: any) => u.created_by === authUserId.value)
  } catch (e) {
    console.error('Error al cargar usuarios:', e)
  }
}

async function loadSessions() {
  try {
    const projectId = evaluation.value?.projectId
    if (!projectId) return

    const { data: allSessions } = await api.get('/usability-sessions')
    const evaluationTaskIds = new Set(tasks.value.map(t => t.id))

    const filtered = (allSessions as UsabilitySession[]).filter(s => {
      if (s.proyectId !== projectId) return false
      if (s.evaluationType !== 'heuristic') return false
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
// ACCIONES DE ESTADO
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
    tab.value = 'results'
  } catch (e: any) {
    $q.notify({ type: 'negative', message: 'Error al generar resultados' })
  } finally {
    generatingResults.value = false
  }
}

async function handleRecalculateResults() {
  try {
    await heuristicApi.recalculateFinalResults(evaluationId.value)
    await loadAll()
    $q.notify({ type: 'positive', message: 'Resultados recalculados' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al recalcular' })
  }
}

// ============================================================
// HANDLERS DE TAREAS
// ============================================================
async function handleAddTasksFromProject(selectedTasks: any[]) {
  try {
    let orderIndex = tasks.value.length + 1
    for (const projectTask of selectedTasks) {
      await heuristicApi.createTask({
        evaluationId: evaluationId.value,
        projectTaskId: projectTask.taskId,
        title: projectTask.title,
        description: projectTask.description || '',
        userGoal: projectTask.userGoal || `El usuario debe ${projectTask.title}`,
        orderIndex: orderIndex++,
      })
    }
    await loadAll()
    $q.notify({ type: 'positive', message: `${selectedTasks.length} tarea(s) agregada(s)` })
  } catch (e: any) {
    $q.notify({ type: 'negative', message: 'Error al agregar tareas' })
  }
}

async function handleDeleteTask(taskId: string) {
  try {
    await heuristicApi.deleteTask(taskId)
    await loadAll()
    $q.notify({ type: 'info', message: 'Tarea eliminada' })
  } catch (e: any) {
    $q.notify({ type: 'negative', message: 'Error al eliminar tarea' })
  }
}

async function handleReorderTasks(taskIds: string[]) {
  try {
    await heuristicApi.reorderTasks(evaluationId.value, taskIds)
    await loadAll()
    $q.notify({ type: 'positive', message: 'Tareas reordenadas' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al reordenar' })
  }
}

// ============================================================
// HANDLERS DE EVALUADORES
// ============================================================
async function handleAssignEvaluators(userIds: string[]) {
  try {
    for (const userId of userIds) {
      await heuristicApi.assignEvaluator({
        evaluationId: evaluationId.value,
        userId,
        role: 'evaluator',
      })
    }
    await loadAll()
    $q.notify({ type: 'positive', message: `${userIds.length} evaluador(es) asignado(s)` })
  } catch (e: any) {
    $q.notify({ type: 'negative', message: 'Error al asignar evaluadores' })
  }
}

async function handleRemoveEvaluator(evaluatorId: string) {
  try {
    await heuristicApi.deleteEvaluator(evaluatorId)
    await loadAll()
    $q.notify({ type: 'info', message: 'Evaluador removido' })
  } catch (e: any) {
    $q.notify({ type: 'negative', message: 'Error al remover' })
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