<template>
  <div class="q-pa-lg">
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" color="primary" @click="goBack" />
      <div class="q-ml-md">
        <div class="text-h6 text-weight-bold">
          {{ currentEvaluation?.name || 'Cargando...' }}
        </div>
        <div class="text-caption text-grey-6">
          Framework: <strong>{{ currentFramework?.name || '—' }}</strong> ·
          Estado: <strong>{{ getStatusLabel(currentEvaluation?.status) }}</strong>
        </div>
      </div>
      <q-space />
      <q-badge v-if="currentEvaluation" :color="getStatusColor(currentEvaluation.status)" class="q-pa-sm">
        {{ getStatusLabel(currentEvaluation.status) }}
      </q-badge>
    </div>

    <!-- ============================================================ -->
    <!-- INFO CARD                                                     -->
    <!-- ============================================================ -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-6">Descripción</div>
            <div class="text-body2 ellipsis-2-lines">
              {{ currentEvaluation?.description || '—' }}
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-6">Sistema</div>
            <div class="text-body2 ellipsis-2-lines">
              {{ currentEvaluation?.systemDescription || '—' }}
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <div class="text-caption text-grey-6">Duración</div>
            <div class="text-body2">
              {{ currentEvaluation?.maxDurationMinutes }} min
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
              @click="handleStartEvaluation"
              :loading="loading"
            />
            <q-btn
              v-if="canComplete"
              color="primary"
              icon="check_circle"
              label="Completar"
              unelevated
              size="sm"
              @click="handleCompleteEvaluation"
              :loading="loading"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- TABS                                                          -->
    <!-- ============================================================ -->
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
        <q-tab name="principles" icon="library_books" label="Principios" />
        <q-tab name="tasks" icon="task" label="Tareas" />
        <q-tab name="evaluators" icon="groups" label="Evaluadores" />
        <q-tab name="observations" icon="report_problem" label="Observaciones" />
        <q-tab name="positives" icon="thumb_up" label="Aspectos positivos" />
        <q-tab name="ratings" icon="star" label="Calificaciones" />
        <q-tab name="results" icon="analytics" label="Resultados finales" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <!-- ==================================================== -->
        <!-- TAB: DASHBOARD                                        -->
        <!-- ==================================================== -->
        <q-tab-panel name="dashboard">
          <HeuristicDashboard
            :evaluation="currentEvaluation"
            :framework="currentFramework"
            :evaluators="evaluators"
            :tasks="tasks"
            :observations="observations"
            :positive-aspects="positiveAspects"
            :ratings="ratings"
            :final-results="finalResults"
          />
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: PRINCIPIOS                                       -->
        <!-- ==================================================== -->
        <q-tab-panel name="principles">
          <HeuristicPrincipleList
            :framework="currentFramework"
            :principles="principles"
            :can-edit="false"
          />
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: TAREAS                                           -->
        <!-- ==================================================== -->
        <q-tab-panel name="tasks">
          <HeuristicTaskManager
            :tasks="tasks"
            :project-tasks="projectTasks"
            :evaluation-id="currentEvaluation?.evaluationId"
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
        <!-- TAB: OBSERVACIONES (SOLO LECTURA)                     -->
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
        <!-- TAB: ASPECTOS POSITIVOS (SOLO LECTURA)                -->
        <!-- ==================================================== -->
        <q-tab-panel name="positives">
          <HeuristicPositiveAspectViewer
            :positive-aspects="positiveAspects"
            :evaluators="evaluators"
            :tasks="tasks"
          />
        </q-tab-panel>

        <!-- ==================================================== -->
        <!-- TAB: CALIFICACIONES (SOLO LECTURA)                    -->
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
            :evaluation="currentEvaluation"
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth.store'
import { useHeuristicCoordinator } from '@/composables/coordinator/useHeuristicCoordinator'
import api from '@/api/axios'

// Componentes
import HeuristicDashboard from '@/components/coordinator/heuristic/HeuristicDashboard.vue'
import HeuristicPrincipleList from '@/components/coordinator/heuristic/HeuristicPrincipleList.vue'
import HeuristicTaskManager from '@/components/coordinator/heuristic/HeuristicTaskManager.vue'
import HeuristicEvaluatorManager from '@/components/coordinator/heuristic/HeuristicEvaluatorManager.vue'
import HeuristicObservationViewer from '@/components/coordinator/heuristic/HeuristicObservationViewer.vue'
import HeuristicPositiveAspectViewer from '@/components/coordinator/heuristic/HeuristicPositiveAspectViewer.vue'
import HeuristicRatingViewer from '@/components/coordinator/heuristic/HeuristicRatingViewer.vue'
import HeuristicFinalResultsViewer from '@/components/coordinator/heuristic/HeuristicFinalResultsViewer.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()

const {
  loading,
  currentEvaluation,
  currentFramework,
  principles,
  evaluators,
  tasks,
  observations,
  positiveAspects,
  ratings,
  finalResults,
  canEdit,
  canStart,
  canComplete,
  isInProgress,
  isCompleted,
  evaluationProgress,
  loadEvaluation,
  addTasksFromProject,
  deleteTask,
  assignEvaluators,
  removeEvaluator,
  updateEvaluationStatus,
  generateFinalResults,
} = useHeuristicCoordinator()

// ============================================================
// ESTADO LOCAL
// ============================================================
const tab = ref('dashboard')
const projectTasks = ref<any[]>([])
const availableUsers = ref<any[]>([])

const evaluationId = computed(() => route.params.evaluationId as string)
const authUserId = computed(() => auth.user?.user_id || '')

// ============================================================
// CARGA DE DATOS
// ============================================================
async function loadAll() {
  await loadEvaluation(evaluationId.value)
  if (currentEvaluation.value) {
    await loadProjectTasks(currentEvaluation.value.projectId)
  }
  await loadAvailableUsers()
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
    // 🔥 Filtrar solo los usuarios creados por el auth user
    availableUsers.value = data.filter((u: any) => u.created_by === authUserId.value)
  } catch (e) {
    console.error('Error al cargar usuarios:', e)
  }
}

// ============================================================
// HANDLERS
// ============================================================
async function handleAddTasksFromProject(selectedTasks: any[]) {
  if (!currentEvaluation.value) return
  try {
    await addTasksFromProject(currentEvaluation.value.evaluationId, selectedTasks)
  } catch (e) {
    console.error(e)
  }
}

async function handleDeleteTask(taskId: string) {
  try {
    await deleteTask(taskId)
  } catch (e) {
    console.error(e)
  }
}

async function handleReorderTasks(taskIds: string[]) {
  if (!currentEvaluation.value) return
  try {
    const { heuristicApi } = await import('@/api/heuristic.api')
    await heuristicApi.reorderTasks(currentEvaluation.value.evaluationId, taskIds)
    await loadEvaluation(currentEvaluation.value.evaluationId)
    $q.notify({ type: 'positive', message: 'Tareas reordenadas' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al reordenar' })
  }
}

async function handleAssignEvaluators(userIds: string[]) {
  if (!currentEvaluation.value) return
  try {
    await assignEvaluators(currentEvaluation.value.evaluationId, userIds)
  } catch (e) {
    console.error(e)
  }
}

async function handleRemoveEvaluator(evaluatorId: string) {
  try {
    await removeEvaluator(evaluatorId)
  } catch (e) {
    console.error(e)
  }
}

async function handleStartEvaluation() {
  if (!currentEvaluation.value) return
  const confirm = await $q.dialog({
    title: 'Iniciar Evaluación',
    message: '¿Iniciar la evaluación? Los evaluadores podrán comenzar.',
    ok: 'Iniciar',
    cancel: true,
    persistent: true,
  })
  if (confirm) {
    await updateEvaluationStatus(currentEvaluation.value.evaluationId, 'planning')
  }
}

async function handleCompleteEvaluation() {
  if (!currentEvaluation.value) return
  const confirm = await $q.dialog({
    title: 'Completar Evaluación',
    message: '¿Completar la evaluación?',
    ok: 'Completar',
    cancel: true,
    persistent: true,
  })
  if (confirm) {
    await updateEvaluationStatus(currentEvaluation.value.evaluationId, 'completed')
  }
}

async function handleGenerateResults() {
  if (!currentEvaluation.value) return
  const confirm = await $q.dialog({
    title: 'Generar Resultados Finales',
    message: 'Se consolidarán todas las observaciones y calificaciones.',
    ok: 'Generar',
    cancel: true,
    persistent: true,
  })
  if (confirm) {
    await generateFinalResults(currentEvaluation.value.evaluationId)
  }
}

async function handleRecalculateResults() {
  if (!currentEvaluation.value) return
  try {
    const { heuristicApi } = await import('@/api/heuristic.api')
    await heuristicApi.recalculateFinalResults(currentEvaluation.value.evaluationId)
    await loadEvaluation(currentEvaluation.value.evaluationId)
    $q.notify({ type: 'positive', message: 'Resultados recalculados' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al recalcular' })
  }
}

// ============================================================
// HELPERS
// ============================================================
function goBack() {
  router.push({ name: 'CoordinadorHeuristico' })
}

function getStatusColor(status?: string): string {
  if (!status) return 'grey'
  const colors: Record<string, string> = {
    draft: 'grey',
    planning: 'info',
    in_progress: 'warning',
    completed: 'positive',
    archived: 'grey-7',
  }
  return colors[status] || 'grey'
}

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
</script>

<style scoped>
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>