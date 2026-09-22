<template>
  <div class="q-pa-lg">
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <h1 class="text-h5 text-weight-bold q-my-none">Panel de Coordinación - Método Heurístico</h1>
        <p class="text-caption text-grey-6 q-mt-xs">
          Gestiona evaluaciones heurísticas basadas en frameworks como Nielsen, Shneiderman, etc.
        </p>
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          v-if="!selectedProjectId"
          color="primary"
          icon="refresh"
          flat
          @click="loadProjects"
          :loading="loadingProjects"
        />
        <q-btn
          v-if="currentEvaluation && isCompleted"
          color="primary"
          icon="download"
          label="Exportar Reporte"
          @click="handleExportReport"
          :loading="loading"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- PASO 1: SELECCIONAR PROYECTO                                  -->
    <!-- ============================================================ -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row items-center q-gutter-md">
          <q-icon name="folder" color="primary" size="28px" />
          <div>
            <div class="text-caption text-grey-6">Paso 1</div>
            <div class="text-h6 text-weight-medium">Seleccionar Proyecto</div>
          </div>
          <q-space />
          <q-btn
            v-if="projects.length === 0"
            color="primary"
            icon="refresh"
            label="Cargar Proyectos"
            @click="loadProjects"
            :loading="loadingProjects"
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Loading -->
      <q-card-section v-if="loadingProjects" class="flex justify-center q-py-xl">
        <q-spinner color="primary" size="48px" />
      </q-card-section>

      <!-- Sin proyectos -->
      <q-card-section v-else-if="projects.length === 0" class="text-center q-py-xl">
        <q-icon name="folder_open" size="64px" color="grey-5" />
        <p class="text-grey-6 q-mt-md">No tienes proyectos asignados</p>
        <p class="text-caption text-grey-5">
          Contacta al administrador para que te asigne proyectos
        </p>
      </q-card-section>

      <!-- Grid de proyectos -->
      <q-card-section v-else>
        <div class="row q-col-gutter-md">
          <div
            v-for="project in projects"
            :key="project.projectId"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card
              clickable
              :class="[
                'cursor-pointer transition-all',
                selectedProjectId === project.projectId
                  ? 'border-primary border-2'
                  : 'border-transparent border-2 hover:border-primary',
              ]"
              @click="selectProject(project.projectId)"
            >
              <q-card-section>
                <div class="row items-center q-gutter-md">
                  <q-img
                    v-if="project.thumbnailUrl"
                    :src="project.thumbnailUrl"
                    style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover"
                  />
                  <q-icon v-else name="palette" size="48px" color="grey-5" />
                  <div class="col">
                    <div class="text-subtitle1 text-weight-medium">
                      {{ project.projectName }}
                    </div>
                    <div class="text-caption text-grey-6">
                      v{{ project.version }}
                    </div>
                    <div class="text-caption text-grey-6">
                      {{ formatDate(project.lastModified) }}
                    </div>
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="q-py-sm">
                <div class="row q-gutter-xs">
                  <q-badge color="info" outline>
                    {{ getTaskCount(project.projectId) }} tareas
                  </q-badge>
                  <q-badge color="secondary" outline>
                    {{ getEvaluationCount(project.projectId) }} evaluaciones
                  </q-badge>
                  <q-badge :color="getRoleColor(project.userRole)">
                    {{ project.userRole || 'Revisor' }}
                  </q-badge>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- PASO 2: GESTIONAR EVALUACIONES                                -->
    <!-- ============================================================ -->
    <template v-if="selectedProjectId">
      <q-card flat bordered class="border-primary">
        <q-card-section>
          <div class="row items-center q-gutter-md">
            <q-icon name="fact_check" color="primary" size="28px" />
            <div>
              <div class="text-caption text-grey-6">Paso 2</div>
              <div class="text-h6 text-weight-medium">Evaluaciones Heurísticas</div>
            </div>
            <q-space />

            <q-btn
              v-if="!currentEvaluation"
              color="primary"
              icon="add"
              label="Nueva Evaluación"
              unelevated
              @click="openCreateDialog"
            />

            <q-btn
              v-if="currentEvaluation"
              color="warning"
              icon="edit"
              flat
              label="Editar"
              :disable="!canEdit"
              @click="openEditDialog"
            />

            <q-btn
              v-if="currentEvaluation"
              color="negative"
              icon="delete"
              flat
              label="Eliminar"
              :disable="!canEdit"
              @click="confirmDeleteEvaluation"
            />

            <q-btn
              v-if="currentEvaluation"
              flat
              icon="close"
              label="Volver a la lista"
              @click="reset()"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <!-- ==================================================== -->
          <!-- LISTA DE EVALUACIONES                                 -->
          <!-- ==================================================== -->
          <div v-if="!currentEvaluation">
            <div v-if="loading" class="flex justify-center q-py-xl">
              <q-spinner color="primary" size="48px" />
            </div>

            <div v-else-if="evaluations.length === 0" class="text-center q-py-xl">
              <q-icon name="assignment" size="64px" color="grey-5" />
              <p class="text-grey-6 q-mt-md">
                Este proyecto no tiene evaluaciones heurísticas
              </p>
              <q-btn
                color="primary"
                icon="add"
                label="Crear la primera evaluación"
                unelevated
                class="q-mt-md"
                @click="openCreateDialog"
              />
            </div>
<div v-else class="row q-col-gutter-md">
  <div
    v-for="evaluation in evaluations"
    :key="evaluation.evaluationId"
    class="col-12 col-md-6 col-lg-4"
  >
    <q-card class="h-full">
      <q-card-section>
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle1 text-weight-medium ellipsis">
            {{ evaluation.name }}
          </div>
          <q-badge :color="getStatusColor(evaluation.status)">
            {{ getStatusLabel(evaluation.status) }}
          </q-badge>
        </div>
        <div class="text-caption text-grey-6 ellipsis-2-lines">
          {{ evaluation.description || 'Sin descripción' }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-py-sm">
        <div class="row q-gutter-xs">
          <q-chip size="sm" icon="timer" dense>
            {{ evaluation.maxDurationMinutes }} min
          </q-chip>
          <q-chip size="sm" icon="library_books" dense>
            {{ getFrameworkName(evaluation.frameworkId) }}
          </q-chip>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          color="primary"
          label="Gestionar"
          icon="settings"
          @click.stop="openEvaluation(evaluation)"
        />
        <q-btn
          unelevated
          color="primary"
          label="Ver Detalle"
          icon="open_in_new"
          @click.stop="goToDetailDirect(evaluation)"
        />
      </q-card-actions>
    </q-card>
  </div>
</div>
          </div>

          <!-- ==================================================== -->
          <!-- DETALLE / RESUMEN DE EVALUACIÓN SELECCIONADA          -->
          <!-- ==================================================== -->
          <div v-else>
            <q-banner rounded class="bg-blue-1 text-primary q-mb-md">
              <template v-slot:avatar>
                <q-icon name="info" color="primary" />
              </template>
              <div class="text-body2">
                <strong>Evaluación seleccionada:</strong> {{ currentEvaluation.name }}
                <br />
                <span class="text-caption">
                  Framework: <strong>{{ currentFramework?.name }}</strong> ·
                  Estado: <strong>{{ getStatusLabel(currentEvaluation.status) }}</strong>
                </span>
              </div>
            </q-banner>

            <!-- Info cards -->
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-caption text-grey-6">Evaluadores</div>
                    <div class="text-h6">
                      {{ completedEvaluators }} / {{ totalEvaluators }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-caption text-grey-6">Tareas</div>
                    <div class="text-h6">{{ tasks.length }}</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-caption text-grey-6">Observaciones</div>
                    <div class="text-h6">{{ observations.length }}</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-caption text-grey-6">Progreso</div>
                    <div class="row items-center q-gutter-sm">
                      <q-circular-progress
                        :value="evaluationProgress"
                        size="42px"
                        :color="getProgressColor(evaluationProgress)"
                        track-color="grey-3"
                        show-value
                        font-size="11px"
                      />
                      <span class="text-h6">{{ evaluationProgress }}%</span>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="row q-gutter-sm q-mb-md">
              <q-btn
                v-if="canStart"
                color="positive"
                icon="play_arrow"
                label="Iniciar Evaluación"
                unelevated
                @click="handleStartEvaluation"
                :loading="loading"
              />
              <q-btn
                v-if="canComplete"
                color="primary"
                icon="check_circle"
                label="Completar Evaluación"
                unelevated
                @click="handleCompleteEvaluation"
                :loading="loading"
              />
              <q-btn
                v-if="isInProgress || isCompleted"
                color="deep-purple"
                icon="analytics"
                label="Generar Resultados Finales"
                unelevated
                @click="handleGenerateResults"
                :loading="loading"
              />
            </div>

            <q-banner rounded class="bg-grey-2">
              <template v-slot:avatar>
                <q-icon name="arrow_forward" color="primary" />
              </template>
              <div class="text-body2">
                Para gestionar los detalles (evaluadores, tareas, principios, resultados),
                haz clic en el botón <strong>"Abrir Detalle"</strong>.
              </div>
            </q-banner>

            <div class="q-mt-md">
              <q-btn
                color="primary"
                icon="open_in_new"
                label="Abrir Detalle de la Evaluación"
                unelevated
                @click="goToDetail"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </template>

    <!-- ============================================================ -->
    <!-- DIALOG: CREAR EVALUACIÓN                                      -->
    <!-- ============================================================ -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 600px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">Nueva Evaluación Heurística</div>
          <div class="text-caption text-grey-6">
            Completa los datos para crear la evaluación
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Nombre de la evaluación *"
            outlined
            dense
            :rules="[val => !!val || 'Requerido']"
            placeholder="Ej: Evaluación Heurística - App Turismo"
          />

          <q-input
            v-model="form.description"
            label="Descripción"
            outlined
            dense
            type="textarea"
            rows="2"
            placeholder="Breve descripción de la evaluación"
          />

          <q-select
            v-model="form.frameworkId"
            :options="frameworkOptions"
            option-label="label"
            option-value="value"
            label="Framework de heurísticas *"
            outlined
            dense
            emit-value
            map-options
            :rules="[val => !!val || 'Selecciona un framework']"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>
                    {{ scope.opt.description }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-input
            v-model="form.systemDescription"
            label="Descripción del sistema a evaluar"
            outlined
            dense
            type="textarea"
            rows="2"
            placeholder="Ej: Aplicación web para turismo en Sucre"
          />

          <q-input
            v-model="form.targetUserDescription"
            label="Descripción del usuario objetivo"
            outlined
            dense
            type="textarea"
            rows="2"
            placeholder="Ej: Turistas nacionales y extranjeros"
          />

          <q-input
            v-model.number="form.maxDurationMinutes"
            label="Duración máxima (minutos) *"
            outlined
            dense
            type="number"
            min="1"
            max="180"
            :rules="[val => val > 0 || 'Debe ser mayor a 0']"
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="showCreateDialog = false" />
          <q-btn
            color="primary"
            unelevated
            label="Crear Evaluación"
            :loading="loading"
            :disable="!isFormValid"
            @click="handleCreateEvaluation"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ============================================================ -->
    <!-- DIALOG: EDITAR EVALUACIÓN                                     -->
    <!-- ============================================================ -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 600px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">Editar Evaluación</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="editForm.name"
            label="Nombre *"
            outlined
            dense
          />
          <q-input
            v-model="editForm.description"
            label="Descripción"
            outlined
            dense
            type="textarea"
            rows="2"
          />
          <q-input
            v-model="editForm.systemDescription"
            label="Descripción del sistema"
            outlined
            dense
            type="textarea"
            rows="2"
          />
          <q-input
            v-model="editForm.targetUserDescription"
            label="Usuario objetivo"
            outlined
            dense
            type="textarea"
            rows="2"
          />
          <q-input
            v-model.number="editForm.maxDurationMinutes"
            label="Duración (min)"
            outlined
            dense
            type="number"
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="showEditDialog = false" />
          <q-btn
            color="primary"
            unelevated
            label="Guardar Cambios"
            :loading="loading"
            @click="handleUpdateEvaluation"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth.store'
import { useHeuristicCoordinator } from '@/composables/coordinator/useHeuristicCoordinator'
import { heuristicApi, type HeuristicEvaluation } from '@/api/heuristic.api'
import api from '@/api/axios'

const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()

const {
  loading,
  error,
  selectedProjectId,
  selectedEvaluationId,
  evaluations,
  currentEvaluation,
  frameworks,
  currentFramework,
  tasks,
  evaluators,
  observations,
  canEdit,
  canStart,
  canComplete,
  isInProgress,
  isCompleted,
  completedEvaluators,
  totalEvaluators,
  evaluationProgress,
  loadFrameworks,
  loadEvaluationsByProject,
  loadEvaluation,
  createEvaluation,
  updateEvaluation,
  updateEvaluationStatus,
  deleteEvaluation,
  loadAllData,
  reset,
} = useHeuristicCoordinator()

// ============================================================
// ESTADO LOCAL
// ============================================================
const projects = ref<any[]>([])
const projectTasks = ref<any[]>([])
const loadingProjects = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)

// Formulario de creación
const form = ref({
  name: '',
  description: '',
  frameworkId: '',
  systemDescription: '',
  targetUserDescription: '',
  maxDurationMinutes: 20,
})

// Formulario de edición
const editForm = ref({
  name: '',
  description: '',
  systemDescription: '',
  targetUserDescription: '',
  maxDurationMinutes: 20,
})

// ============================================================
// COMPUTED
// ============================================================
const frameworkOptions = computed(() =>
  frameworks.value.map(f => ({
    label: f.name,
    value: f.frameworkId,
    description: `${f.author} (${f.year}) - ${f.description || ''}`.trim(),
  })),
)

const isFormValid = computed(() =>
  form.value.name.trim() !== '' &&
  form.value.frameworkId !== '' &&
  form.value.maxDurationMinutes > 0,
)

function goToDetailDirect(evaluation: HeuristicEvaluation) {
  router.push({
    name: 'CoordinadorHeuristicoDetail',
    params: { evaluationId: evaluation.evaluationId },
  })
}

// ============================================================
// CARGA DE DATOS
// ============================================================
async function loadProjects() {
  const userId = auth.user?.user_id
  if (!userId) {
    $q.notify({ type: 'warning', message: 'No hay usuario autenticado' })
    return
  }

  loadingProjects.value = true
  try {
    // Obtener reviewers del usuario
    const { data: reviewers } = await api.get(`/project-reviewers/user/${userId}`)

    // Obtener detalles de cada proyecto
    const projectPromises = reviewers.map(async (reviewer: any) => {
      try {
        const { data: project } = await api.get(`/figma-projects/${reviewer.projectId}`)
        return {
          ...project,
          userRole: reviewer.roleName || reviewer.roleId || 'Revisor',
          reviewerId: reviewer.projectReviewerId,
          assignedAt: reviewer.assignedAt,
        }
      } catch (e) {
        console.error(`Error cargando proyecto ${reviewer.projectId}:`, e)
        return null
      }
    })

    const results = await Promise.all(projectPromises)
    projects.value = results.filter(p => p !== null)

    if (projects.value.length === 0) {
      $q.notify({ type: 'info', message: 'No tienes proyectos asignados' })
    }
  } catch (e: any) {
    console.error('Error al cargar proyectos:', e)
    $q.notify({ type: 'negative', message: 'Error al cargar proyectos' })
  } finally {
    loadingProjects.value = false
  }
}

async function loadProjectTasks(projectId: string) {
  try {
    const { data } = await api.get(`/tasks/projectId/${projectId}`)
    projectTasks.value = data
  } catch (e) {
    console.error('Error al cargar tareas:', e)
  }
}

// ============================================================
// SELECCIONES
// ============================================================
async function selectProject(projectId: string) {
  selectedProjectId.value = projectId
  reset()
  await Promise.all([
    loadProjectTasks(projectId),
    loadEvaluationsByProject(projectId),
  ])
}

async function openEvaluation(evaluation: HeuristicEvaluation) {
  await loadEvaluation(evaluation.evaluationId)
}

function goToDetail() {
  if (currentEvaluation.value) {
    router.push({
      name: 'CoordinadorHeuristicoDetail',
      params: { evaluationId: currentEvaluation.value.evaluationId },
    })
  }
}

// ============================================================
// CRUD EVALUACIONES
// ============================================================
function openCreateDialog() {
  form.value = {
    name: '',
    description: '',
    frameworkId: '',
    systemDescription: '',
    targetUserDescription: '',
    maxDurationMinutes: 20,
  }
  showCreateDialog.value = true
}

function openEditDialog() {
  if (!currentEvaluation.value) return
  editForm.value = {
    name: currentEvaluation.value.name,
    description: currentEvaluation.value.description || '',
    systemDescription: currentEvaluation.value.systemDescription || '',
    targetUserDescription: currentEvaluation.value.targetUserDescription || '',
    maxDurationMinutes: currentEvaluation.value.maxDurationMinutes,
  }
  showEditDialog.value = true
}

async function handleCreateEvaluation() {
  if (!isFormValid.value || !selectedProjectId.value) return

  try {
    const created = await createEvaluation({
      projectId: selectedProjectId.value,
      frameworkId: form.value.frameworkId,
      name: form.value.name,
      description: form.value.description || undefined,
      systemDescription: form.value.systemDescription || undefined,
      targetUserDescription: form.value.targetUserDescription || undefined,
      maxDurationMinutes: form.value.maxDurationMinutes,
    })

    showCreateDialog.value = false
    await loadEvaluationsByProject(selectedProjectId.value)

    // Abrir automáticamente la evaluación creada
    if (created) {
      await openEvaluation(created)
    }
  } catch (e) {
    console.error(e)
  }
}

async function handleUpdateEvaluation() {
  if (!currentEvaluation.value) return

  try {
    await updateEvaluation(currentEvaluation.value.evaluationId, {
      name: editForm.value.name,
      description: editForm.value.description,
      systemDescription: editForm.value.systemDescription,
      targetUserDescription: editForm.value.targetUserDescription,
      maxDurationMinutes: editForm.value.maxDurationMinutes,
    })
    showEditDialog.value = false
  } catch (e) {
    console.error(e)
  }
}

async function confirmDeleteEvaluation() {
  if (!currentEvaluation.value) return

  $q.dialog({
    title: 'Eliminar Evaluación',
    message: `¿Estás seguro de eliminar "${currentEvaluation.value.name}"? Esta acción no se puede deshacer.`,
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await deleteEvaluation(currentEvaluation.value!.evaluationId)
      if (selectedProjectId.value) {
        await loadEvaluationsByProject(selectedProjectId.value)
      }
    } catch (e) {
      console.error(e)
    }
  })
}

// ============================================================
// ACCIONES DE ESTADO
// ============================================================
async function handleStartEvaluation() {
  if (!currentEvaluation.value) return

  const confirm = await $q.dialog({
    title: 'Iniciar Evaluación',
    message: '¿Iniciar la evaluación? Los evaluadores podrán comenzar a registrar observaciones.',
    ok: 'Iniciar',
    cancel: true,
    persistent: true,
  })

  if (confirm) {
    await updateEvaluationStatus(currentEvaluation.value.evaluationId, 'in_progress')
  }
}

async function handleCompleteEvaluation() {
  if (!currentEvaluation.value) return

  const confirm = await $q.dialog({
    title: 'Completar Evaluación',
    message: '¿Completar la evaluación? Asegúrate de que todos los evaluadores hayan finalizado.',
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
    message: 'Se consolidarán todas las observaciones y calificaciones. ¿Continuar?',
    ok: 'Generar',
    cancel: true,
    persistent: true,
  })

  if (confirm) {
    const { generateFinalResults } = useHeuristicCoordinator()
    await generateFinalResults(currentEvaluation.value.evaluationId)
  }
}

async function handleExportReport() {
  if (!currentEvaluation.value) return
  // TODO: implementar exportación
  $q.notify({ type: 'info', message: 'Exportación pendiente de implementación' })
}

// ============================================================
// HELPERS DE UI
// ============================================================
function formatDate(date: string | Date): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'grey',
    planning: 'info',
    in_progress: 'warning',
    completed: 'positive',
    archived: 'grey-7',
  }
  return colors[status] || 'grey'
}

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

function getProgressColor(progress: number): string {
  if (progress >= 80) return 'positive'
  if (progress >= 50) return 'warning'
  return 'grey'
}

function getRoleColor(role: string | number): string {
  const roleStr = String(role || '').toLowerCase()
  const colors: Record<string, string> = {
    coordinador: 'purple',
    coordinator: 'purple',
    evaluador: 'info',
    evaluator: 'info',
    supervisor: 'primary',
    observador: 'grey',
    observer: 'grey',
    admin: 'negative',
    administrador: 'negative',
  }
  return colors[roleStr] || 'grey'
}

function getTaskCount(projectId: string): number {
  // Nota: se puede cargar dinámicamente si es necesario
  return projectTasks.value.filter(t => t.projectId === projectId).length
}

function getEvaluationCount(projectId: string): number {
  return evaluations.value.filter(e => e.projectId === projectId).length
}

function getFrameworkName(frameworkId: string): string {
  const fw = frameworks.value.find(f => f.frameworkId === frameworkId)
  return fw?.name || '—'
}

// ============================================================
// WATCHERS
// ============================================================
watch(selectedProjectId, (newVal) => {
  if (newVal) {
    loadEvaluationsByProject(newVal)
  }
})

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  await loadFrameworks()
  await loadProjects()
})
</script>

<style scoped>
.h-full {
  height: 100%;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

.hover\:border-primary:hover {
  border-color: var(--q-primary) !important;
}
</style>