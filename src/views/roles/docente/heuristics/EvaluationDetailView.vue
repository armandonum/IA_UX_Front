<!-- views/roles/docente/heuristics/EvaluationDetailView.vue -->
<template>
  <div>
    <!-- ============================================================ -->
    <!-- BREADCRUMB                                                    -->
    <!-- ============================================================ -->
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        dense
        icon="arrow_back"
        label="Volver"
        color="primary"
        :to="'/docente/gestion'"
        class="q-mr-md"
      />
      <q-breadcrumbs class="text-grey-7" active-color="primary">
        <q-breadcrumbs-el label="Eval. Heurísticas" icon="fact_check" />
        <q-breadcrumbs-el :label="evaluation?.name || 'Cargando...'" />
      </q-breadcrumbs>
    </div>

    <!-- ============================================================ -->
    <!-- LOADING                                                       -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando evaluación...</div>
    </div>

    <!-- ============================================================ -->
    <!-- NOT FOUND                                                     -->
    <!-- ============================================================ -->
    <div v-else-if="!evaluation" class="text-center q-py-xl text-grey-6">
      <q-icon name="error_outline" size="64px" />
      <div class="text-h6 q-mt-md">Evaluación no encontrada</div>
      <q-btn
        flat
        color="primary"
        icon="arrow_back"
        label="Volver a evaluaciones"
        :to="'/docente/gestion'"
        class="q-mt-md"
      />
    </div>

    <!-- ============================================================ -->
    <!-- CONTENIDO                                                     -->
    <!-- ============================================================ -->
    <template v-else>
      <!-- Header -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-start justify-between no-wrap">
            <div class="col">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <q-icon name="menu_book" size="28px" color="primary" />
                <div class="text-h5 text-weight-bold">
                  {{ evaluation.name }}
                </div>
                <q-badge
                  :color="getStatusColor(evaluation.status)"
                  text-color="white"
                >
                  <q-icon
                    :name="getStatusIcon(evaluation.status)"
                    size="12px"
                    class="q-mr-xs"
                  />
                  {{ getStatusLabel(evaluation.status) }}
                </q-badge>
              </div>

              <div class="row q-gutter-md text-caption text-grey-6">
                <div v-if="framework" class="row items-center">
                  <q-icon name="category" size="14px" class="q-mr-xs" />
                  Framework: {{ framework.name }}
                </div>
                <div class="row items-center">
                  <q-icon name="folder" size="14px" class="q-mr-xs" />
                  {{ projectName || 'Proyecto' }}
                </div>
                <div class="row items-center">
                  <q-icon name="timer" size="14px" class="q-mr-xs" />
                  {{ evaluation.maxDurationMinutes }} min
                </div>
                <div class="row items-center">
                  <q-icon name="calendar_today" size="14px" class="q-mr-xs" />
                  {{ formatDate(evaluation.createdAt) }}
                </div>
              </div>
            </div>

            <q-btn
              flat
              icon="edit"
              label="Editar"
              color="primary"
              @click="openEditDialog"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Tabs -->
      <q-card flat bordered>
        <q-tabs
          v-model="activeTab"
          dense
          align="left"
          active-color="primary"
          indicator-color="primary"
          class="text-grey-7"
          narrow-indicator
          no-caps
        >
          <q-tab name="summary" icon="dashboard" label="Resumen">
            <q-badge v-if="stats.totalEvaluators" color="primary" rounded class="q-ml-sm">
              {{ stats.totalEvaluators }}
            </q-badge>
          </q-tab>
          <q-tab name="evaluators" icon="badge" label="Evaluadores">
            <q-badge v-if="evaluators.length" color="info" rounded class="q-ml-sm">
              {{ evaluators.length }}
            </q-badge>
          </q-tab>
          <q-tab name="tasks" icon="assignment" label="Tareas">
            <q-badge v-if="tasks.length" color="warning" rounded class="q-ml-sm">
              {{ tasks.length }}
            </q-badge>
          </q-tab>
          <q-tab name="progress" icon="timeline" label="Progreso" />
          <q-tab name="observations" icon="rate_review" label="Observaciones">
            <q-badge v-if="observations.length" color="negative" rounded class="q-ml-sm">
              {{ observations.length }}
            </q-badge>
          </q-tab>
          <q-tab name="positive" icon="thumb_up" label="Aspectos +">
            <q-badge v-if="positiveAspects.length" color="positive" rounded class="q-ml-sm">
              {{ positiveAspects.length }}
            </q-badge>
          </q-tab>
          <q-tab name="results" icon="insights" label="Resultados" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <!-- ========== RESUMEN ========== -->
          <q-tab-panel name="summary" class="q-pa-md">
            <EvaluationSummaryTab
              :evaluation="evaluation"
              :framework="framework"
              :stats="stats"
              :evaluators="evaluators"
            />
          </q-tab-panel>

          <!-- ========== EVALUADORES ========== -->
          <q-tab-panel name="evaluators" class="q-pa-md">
            <EvaluatorsManager
              :evaluation-id="evaluation.evaluationId"
              :evaluators="evaluators"
              :loading="loadingEvaluators"
              @added="loadEvaluators"
              @removed="loadEvaluators"
              @updated="loadEvaluators"
            />
          </q-tab-panel>

          <!-- ========== TAREAS ========== -->
          <q-tab-panel name="tasks" class="q-pa-md">
            <EvaluationTasksManager
              :evaluation-id="evaluation.evaluationId"
              :tasks="tasks"
              :loading="loadingTasks"
              @created="loadTasks"
              @updated="loadTasks"
              @removed="loadTasks"
            />
          </q-tab-panel>

          <!-- ========== PROGRESO ========== -->
          <q-tab-panel name="progress" class="q-pa-md">
            <TaskProgressViewer
              :evaluators="evaluators"
              :tasks="tasks"
              :progress="progress"
              :loading="loadingProgress"
              @reload="loadProgress"
            />
          </q-tab-panel>

          <!-- ========== OBSERVACIONES ========== -->
          <q-tab-panel name="observations" class="q-pa-md">
            <ObservationsViewer
              :observations="observations"
              :principles="principles"
              :evaluators="evaluators"
              :tasks="tasks"
              :loading="loadingObservations"
              @reload="loadObservations"
            />
          </q-tab-panel>

          <!-- ========== ASPECTOS POSITIVOS ========== -->
          <q-tab-panel name="positive" class="q-pa-md">
            <PositiveAspectsViewer
              :aspects="positiveAspects"
              :evaluators="evaluators"
              :tasks="tasks"
              :loading="loadingPositiveAspects"
              @reload="loadPositiveAspects"
            />
          </q-tab-panel>

          <!-- ========== RESULTADOS ========== -->
          <q-tab-panel name="results" class="q-pa-md">
            <FinalResultsViewer
              :evaluation-id="evaluation.evaluationId"
              :results="finalResults"
              :observations="observations"
              :positive-aspects="positiveAspects"
              :principles="principles"
              :loading="loadingResults"
              @generated="loadFinalResults"
              @recalculated="loadFinalResults"
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </template>

    <!-- Edit Dialog -->
    <EvaluationFormDialog
      v-model="editDialogOpen"
      :evaluation="evaluation"
      @save="onUpdateEvaluation"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDocenteStore } from '@/stores/docente.stores'
import { useHeuristicEvaluationDetail } from '@/composables/docente/useHeuristicEvaluationDetail'

// Componentes
import EvaluationSummaryTab from '@/components/docente/heuristics/detail/EvaluationSummaryTab.vue'
import EvaluatorsManager from '@/components/docente/heuristics/detail/EvaluatorsManager.vue'
import EvaluationTasksManager from '@/components/docente/heuristics/detail/EvaluationTasksManager.vue'
import TaskProgressViewer from '@/components/docente/heuristics/detail/TaskProgressViewer.vue'
import ObservationsViewer from '@/components/docente/heuristics/detail/ObservationsViewer.vue'
import PositiveAspectsViewer from '@/components/docente/heuristics/detail/PositiveAspectsViewer.vue'
import FinalResultsViewer from '@/components/docente/heuristics/detail/FinalResultsViewer.vue'
import EvaluationFormDialog from '@/components/docente/heuristics/EvaluationFormDialog.vue'

const route = useRoute()
const docenteStore = useDocenteStore()

const evaluationId = computed(() => route.params.evaluationId as string)

const {
  evaluation,
  framework,
  principles,
  evaluators,
  tasks,
  progress,
  observations,
  positiveAspects,
  finalResults,
  loading,
  loadingEvaluators,
  loadingTasks,
  loadingProgress,
  loadingObservations,
  loadingPositiveAspects,
  loadingResults,
  stats,
  fetchEvaluationDetail,
  fetchEvaluators,
  fetchTasks,
  fetchProgress,
  fetchObservations,
  fetchPositiveAspects,
  fetchFinalResults,
  updateEvaluation,
} = useHeuristicEvaluationDetail()

// ============================================================
// STATE
// ============================================================
const activeTab = ref('summary')
const editDialogOpen = ref(false)

// ============================================================
// COMPUTED
// ============================================================
const projectName = computed(() => {
  const p = docenteStore.projects.find(
    (pr) => pr.projectId === evaluation.value?.projectId,
  )
  return p?.projectName || ''
})

// ============================================================
// LOAD HELPERS
// ============================================================
async function loadEvaluators() {
  await fetchEvaluators(evaluationId.value)
}

async function loadTasks() {
  await fetchTasks(evaluationId.value)
}

async function loadProgress() {
  await fetchProgress(evaluationId.value)
}

async function loadObservations() {
  await fetchObservations(evaluationId.value)
}

async function loadPositiveAspects() {
  await fetchPositiveAspects(evaluationId.value)
}

async function loadFinalResults() {
  await fetchFinalResults(evaluationId.value)
}

// ============================================================
// ACTIONS
// ============================================================
function openEditDialog() {
  editDialogOpen.value = true
}

async function onUpdateEvaluation(data: any) {
  try {
    await updateEvaluation(evaluationId.value, data)
    editDialogOpen.value = false
  } catch (e) {
    // Error manejado
  }
}

// ============================================================
// HELPERS
// ============================================================
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    planning: 'Planificación',
    in_progress: 'En progreso',
    completed: 'Completada',
    archived: 'Archivada',
  }
  return labels[status] || status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'grey-6',
    planning: 'info',
    in_progress: 'warning',
    completed: 'positive',
    archived: 'grey-7',
  }
  return colors[status] || 'grey'
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    draft: 'edit_note',
    planning: 'event_note',
    in_progress: 'play_circle',
    completed: 'check_circle',
    archived: 'archive',
  }
  return icons[status] || 'help'
}

function formatDate(date: string): string {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return date
  }
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  await docenteStore.fetchProjects()
  await fetchEvaluationDetail(evaluationId.value)
  // Carga diferida: solo cargamos resumen, el resto al cambiar de tab
  await Promise.all([
    loadEvaluators(),
    loadTasks(),
    loadObservations(),
    loadPositiveAspects(),
    loadProgress(),
    loadFinalResults(),
  ])
})
</script>