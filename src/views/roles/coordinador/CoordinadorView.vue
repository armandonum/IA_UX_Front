<!-- pages/CoordinatorView.vue -->
<template>
  <div class="space-y-6 p-4 min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Panel de Coordinación</h1>
        <p class="text-sm text-slate-500 mt-0.5">
          Gestiona evaluaciones cognitivas para proyectos Figma
        </p>
      </div>
      <div class="flex gap-2">
        <q-btn
          v-if="!selectedProjectId"
          color="primary"
          icon="refresh"
          flat
          @click="loadProjects"
          :loading="loadingProjects"
        />
        <q-btn
          v-if="selectedProjectId && currentEvaluation"
          color="primary"
          icon="download"
          label="Exportar Reporte"
          @click="handleExportReport"
          :loading="loading"
        />
      </div>
    </div>

      <!-- Step 1: Seleccionar Proyecto -->
    <q-card>
      <q-card-section>
        <div class="flex items-center gap-3">
          <q-icon name="folder" color="primary" size="24px" />
          <div>
            <div class="text-sm">Paso 1</div>
            <div class="text-lg font-semibold">Seleccionar Proyecto</div>
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

      <q-card-section v-if="loadingProjects" class="flex justify-center py-8">
        <q-spinner color="primary" size="40px" />
      </q-card-section>

      <q-card-section
        v-else-if="projects.length === 0"
        class="text-center py-8"
      >
        <q-icon name="folder_open" size="48px" color="grey-6" />
        <p class="text-grey-6 mt-2">No tienes proyectos asignados</p>
        <p class="text-sm text-grey-5 mt-1">
          Contacta al administrador para que te asigne proyectos
        </p>
      </q-card-section>

      <q-card-section v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <q-card
            v-for="project in projects"
            :key="project.projectId"
            clickable
            class="bg-slate-700 hover:bg-slate-600 transition-colors cursor-pointer border-2"
            :class="
              selectedProjectId === project.projectId
                ? 'border-primary'
                : 'border-transparent'
            "
            @click="selectProject(project.projectId)"
          >
            <q-card-section>
              <div class="flex items-center gap-3">
                <q-img
                  v-if="project.thumbnailUrl"
                  :src="project.thumbnailUrl"
                  style="
                    width: 60px;
                    height: 60px;
                    border-radius: 8px;
                    object-fit: cover;
                  "
                />
                <q-icon v-else name="palette" size="40px" color="grey-6" />
                <div>
                  <div class="font-semibold">{{ project.projectName }}</div>
                  <div class="text-xs text-secondary">
                    v{{ project.version }}
                  </div>
                  <div class="text-xs text-secondary">
                    {{ new Date(project.lastModified).toLocaleDateString() }}
                  </div>
                </div>
              </div>
            </q-card-section>
            <q-card-section class="pt-0">
              <div class="flex gap-2">
                <q-badge color="info" class="text-xs">
                  {{ getTaskCount(project.projectId) }} tareas
                </q-badge>
                <q-badge color="secondary" class="text-xs">
                  {{ getEvaluationCount(project.projectId) }} evaluaciones
                </q-badge>
                <!-- Badge de rol del usuario en el proyecto -->
                <q-badge 
                  :color="getRoleColor(project.userRole)" 
                  class="text-xs"
                >
                  {{ project.userRole || 'Revisor' }}
                </q-badge>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>

    <!-- Step 2: Gestionar Evaluación -->
<template v-if="selectedProjectId">
  <q-card flat bordered class="border-primary">

    <!-- Header -->
    <q-card-section>
      <div class="row items-center q-gutter-md">

        <q-icon
          name="assignment"
          color="primary"
          size="28px"
        />

        <div>
          <div class="text-caption text-grey-6">
            Paso 2
          </div>

          <div class="text-h6 text-weight-medium">
            Gestionar Evaluación
          </div>
        </div>

        <q-space />

        <q-btn
          v-if="canCreateEvaluation"
          color="primary"
          icon="add"
          label="Nueva Evaluación"
          unelevated
          @click="showEvaluationDialog = true"
        />

        <q-btn
          v-if="currentEvaluation"
          color="warning"
          icon="edit"
          flat
          label="Editar"
          @click="showEditEvaluationDialog = true"
        />

        <q-btn
          v-if="currentEvaluation"
          color="negative"
          icon="delete"
          flat
          label="Eliminar"
          @click="confirmDelete"
        />

      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>

      <!-- Lista de Evaluaciones -->
      <div v-if="!currentEvaluation">
        <EvaluationList
          :evaluations="evaluations"
          @select="loadEvaluation"
          @create="showEvaluationDialog = true"
          :can-create="canCreateEvaluation"
        />
      </div>

      <!-- Detalle de Evaluación -->
      <div v-else>

        <!-- Información de la evaluación -->
        <q-card
          flat
          bordered
          class="border-primary"
        >
          <q-card-section>
            <div class="row items-center q-col-gutter-lg">

              <!-- Nombre -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="text-caption text-grey-6">
                  Nombre
                </div>

                <div class="text-subtitle1 text-weight-medium">
                  {{ currentEvaluation.name }}
                </div>
              </div>

              <!-- Estado -->
              <div class="col-12 col-sm-6 col-md-2">
                <div class="text-caption text-grey-6 q-mb-xs">
                  Estado
                </div>

                <q-badge
                  :color="getStatusColor(currentEvaluation.status)"
                  class="q-px-sm q-py-xs"
                >
                  {{ getStatusLabel(currentEvaluation.status) }}
                </q-badge>
              </div>

              <!-- Duración -->
              <div class="col-12 col-sm-6 col-md-2">
                <div class="text-caption text-grey-6">
                  Duración
                </div>

                <div class="text-subtitle1">
                  {{ currentEvaluation.maxDurationMinutes }} min
                </div>
              </div>

              <!-- Progreso -->
              <div class="col-12 col-sm-6 col-md-2">
                <div class="text-caption text-grey-6 q-mb-xs">
                  Progreso
                </div>

                <div class="row items-center q-gutter-sm">

                  <q-circular-progress
                    :value="evaluationProgress"
                    size="42px"
                    :color="getProgressColor(evaluationProgress)"
                    track-color="grey-3"
                    show-value
                    font-size="10px"
                  />

                  <span class="text-weight-medium">
                    {{ evaluationProgress }}%
                  </span>

                </div>
              </div>

              <q-space />

              <!-- Acciones -->
              <div class="col-12 col-md-auto">
                <div class="row q-gutter-sm">

                  <q-btn
                    v-if="canStart"
                    color="positive"
                    icon="play_arrow"
                    label="Iniciar"
                    unelevated
                    @click="startEvaluation"
                    :loading="loading"
                  />

                  <q-btn
                    v-if="canComplete"
                    color="primary"
                    icon="check_circle"
                    label="Completar"
                    unelevated
                    @click="completeEvaluation"
                    :loading="loading"
                  />

                </div>
              </div>

            </div>
          </q-card-section>
        </q-card>

        <!-- Tabs -->
        <q-tabs
          v-model="tab"
          class="bg-primary text-white q-mt-md"
          active-color="white"
          indicator-color="accent"
          align="left"
          no-caps
        >
          <q-tab
            name="dashboard"
            icon="dashboard"
            label="Dashboard"
          />

          <q-tab
            name="tasks"
            icon="task"
            label="Tareas"
          />

          <q-tab
            name="rules"
            icon="rule"
            label="Reglas"
          />

          <q-tab
            name="evaluators"
            icon="groups"
            label="Evaluadores"
          />

          <q-tab
            name="responses"
            icon="question_answer"
            label="Respuestas"
          />

          <q-tab
            name="problems"
            icon="report_problem"
            label="Problemas"
          />

          <q-tab
            name="recommendations"
            icon="lightbulb"
            label="Recomendaciones"
          />
        </q-tabs>

        <q-separator color="accent" />

        <!-- Paneles -->
        <q-tab-panels
          v-model="tab"
          animated
        >

          <!-- Dashboard -->
          <q-tab-panel name="dashboard">
            <CoordinatorDashboard
              :dashboard="dashboard"
              :responses="responses"
              :problems="problems"
              :recommendations="recommendations"
              :evaluators="evaluators"
              :response-stats="responseStats"
              :problem-summary="problemSummary"
              :loading="loading"
            />
          </q-tab-panel>

          <!-- Tareas -->
          <q-tab-panel name="tasks">
            <TaskManager
              :tasks="tasks"
              :project-tasks="projectTasks"
              :evaluation-id="currentEvaluation?.cognitiveEvaluationId"
              :project-id="selectedProjectId"
              :file-key="selectedProject?.fileKey"
              :can-edit="canEdit"
              @add-tasks="handleAddTasksFromProject"
              @delete="handleDeleteTask"
            />
          </q-tab-panel>

          <!-- Reglas -->
          <q-tab-panel name="rules">
            <RulesManager
              :rules="rules"
              :can-edit="canEdit"
              @add="handleAddRules"
              @edit="handleEditRule"
              @delete="handleDeleteRule"
              @reorder="handleReorderRules"
            />
          </q-tab-panel>

          <!-- Evaluadores -->
          <q-tab-panel name="evaluators">
            <EvaluatorManager
              :evaluators="evaluators"
              :users="availableUsers"
              :can-edit="canEdit"
              @add="handleAddEvaluators"
              @remove="handleRemoveEvaluator"
            />
          </q-tab-panel>

          <!-- Respuestas -->
          <q-tab-panel name="responses">
            <ResponsesViewer
              :responses="responses"
              :summary="responseSummary"
              :stats="responseStats"
              :loading="loading"
              @refresh="loadResponses"
            />
          </q-tab-panel>

          <!-- Problemas -->
          <q-tab-panel name="problems">
            <ProblemManager
              :problems="problems"
              :tasks="tasks"
              :can-edit="canEdit"
              @add="handleAddProblem"
              @edit="handleEditProblem"
              @unify="handleUnifyProblems"
              @status-change="handleProblemStatusChange"
            />
          </q-tab-panel>

          <!-- Recomendaciones -->
          <q-tab-panel name="recommendations">
            <RecommendationManager
              :recommendations="recommendations"
              :problems="problems"
              :can-edit="canEdit"
              @add="handleAddRecommendations"
              @implement="handleImplementRecommendation"
            />
          </q-tab-panel>

        </q-tab-panels>

      </div>
    </q-card-section>
  </q-card>
</template>
  </div>

  <!-- Dialog: Crear Evaluación -->
  <EvaluationForm
    v-model="showEvaluationDialog"
    :projects="projects"
    :current-user-id="currentUser?.userId"
    :current-user-name="currentUser?.fullName"
    @save="handleCreateEvaluation"
  />

  <!-- Dialog: Editar Evaluación -->
  <EvaluationForm
    v-model="showEditEvaluationDialog"
    :evaluation="currentEvaluation"
    :projects="projects"
    :current-user-id="currentUser?.userId"
    :current-user-name="currentUser?.fullName"
    @save="handleUpdateEvaluation"
  />
  <!-- Dialog: Agregar Tareas -->
  <TaskForm
    v-model="showTaskDialog"
    :evaluation-id="currentEvaluation?.cognitiveEvaluationId"
    :project-tasks="projectTasks"
    @save="handleAddTasksBatch"
  />

  <!-- Dialog: Agregar Reglas -->
  <RulesForm
    v-model="showRulesDialog"
    :evaluation-id="currentEvaluation?.cognitiveEvaluationId"
    @save="handleAddRulesBatch"
  />

  <!-- Dialog: Agregar Evaluadores -->
  <EvaluatorForm
    v-model="showEvaluatorDialog"
    :evaluation-id="currentEvaluation?.cognitiveEvaluationId"
    :available-users="availableUsers"
    @save="handleAddEvaluatorsBatch"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useQuasar, QDialog } from "quasar";
import { useCognitiveEvaluation } from "@/composables/useCognitiveEvaluation";
import EvaluationList from "@/components/cognitive/evaluations/EvaluationList.vue";
import EvaluationForm from "@/components/cognitive/evaluations/EvaluationForm.vue";
import TaskManager from "@/components/cognitive/tasks/TaskManager.vue";
import TaskForm from "@/components/cognitive/tasks/TaskForm.vue";
import RulesManager from "@/components/cognitive/rules/RulesManager.vue";
import RulesForm from "@/components/cognitive/rules/RulesForm.vue";
import EvaluatorManager from "@/components/cognitive/evaluators/EvaluatorManager.vue";
import EvaluatorForm from "@/components/cognitive/evaluators/EvaluatorForm.vue";
import ResponsesViewer from "@/components/cognitive/responses/ResponsesViewer.vue";
import ProblemManager from "@/components/cognitive/problems/ProblemManager.vue";
import RecommendationManager from "@/components/cognitive/recommendations/RecommendationManager.vue";
import CoordinatorDashboard from "@/components/cognitive/dashboard/CoordinatorDashboard.vue";
import { useAuthStore } from "@/stores/auth.store";

const $q = useQuasar();
const {
  evaluations,
  currentEvaluation,
  tasks,
  actions,
  rules,
  evaluators,
  responses,
  problems,
  recommendations,
  dashboard,
  loading,
  selectedProjectId,
  selectedEvaluationId,
  selectedTaskId,
  selectedTab: tab,
  hasEvaluation,
  isDraft,
  isPlanning,
  isInProgress,
  isCompleted,
  canEdit,
  canStart,
  canComplete,
  loadEvaluations,
  loadEvaluation,
  createEvaluation,
  updateEvaluation,
  updateStatus,
  deleteEvaluation,
  loadTasks,
  createTasksBatch,
  updateTask,
  reorderTasks,
  deleteTask,
  loadActions,
  createActionsBatch,
  updateAction,
  reorderActions,
  deleteAction,
  loadRules,
  createRulesBatch,
  updateRule,
  deleteRule,
  loadEvaluators,
  assignEvaluatorsBatch,
  removeEvaluator,
  loadResponses,
  loadResponseSummary,
  loadProblems,
  loadProblemSummary,
  createProblem,
  updateProblemStatus,
  unifyProblems,
  loadRecommendations,
  createRecommendationsBatch,
  implementRecommendation,
  loadDashboard,
  loadAllData,
  selectTask,
  exportReport,
} = useCognitiveEvaluation();

// State
const projects = ref<any[]>([]);
const projectTasks = ref<any[]>([]);
const users = ref<any[]>([]);
const availableUsers = ref<any[]>([]);
const loadingProjects = ref(false);
const showEvaluationDialog = ref(false);
const showEditEvaluationDialog = ref(false);
const showTaskDialog = ref(false);
const showRulesDialog = ref(false);
const showEvaluatorDialog = ref(false);
const responseSummary = ref<any>(null);
const responseStats = ref<any>(null);
const problemSummary = ref<any>(null);
const evaluationProgress = ref(0);
const AuthUser = useAuthStore();

// Computed
const canCreateEvaluation = computed(() => {
  return selectedProjectId.value && !currentEvaluation.value;
});
const currentUser = computed(() => ({
  userId: AuthUser.user?.user_id,
  fullName: AuthUser.user?.display_name,
}));

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: "Borrador",
    planning: "Planificación",
    in_progress: "En progreso",
    completed: "Completada",
    archived: "Archivada",
  };
  return labels[status] || status;
};

const getProgressColor = (progress: number) => {
  if (progress >= 80) return "positive";
  if (progress >= 50) return "warning";
  return "grey";
};


// ============================================================
// FUNCIONES DE ESTADO
// ============================================================
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: "grey",
    planning: "orange",
    in_progress: "blue",
    completed: "positive",
    archived: "grey-7",
  };
  return colors[status] || "grey";
};

const getRoleColor = (role: string | number) => {
  // ✅ Si es número, convertirlo a string
  const roleStr = String(role || '').toLowerCase();
  
  const colors: Record<string, string> = {
    coordinator: "purple",
    coordinador: "purple",
    evaluator: "info",
    evaluador: "info",
    supervisor: "primary",
    observer: "grey",
    observador: "grey",
    estudiante: "info",
    student: "info",
    admin: "negative",
    administrador: "negative",
  };
  
  return colors[roleStr] || "grey";
};
// ============================================================
// ✅ CARGAR PROYECTOS DEL USUARIO AUTENTICADO
// ============================================================
const loadProjects = async () => {
  const userId = AuthUser.user?.user_id;
  
  if (!userId) {
    $q.notify({
      type: 'warning',
      message: 'No hay usuario autenticado'
    });
    return;
  }

  loadingProjects.value = true;
  try {
    console.log(" el usuario autenticado con el uuid es :", userId)
    // Obtener los project_reviewers del usuario
    const response = await api.get(`/project-reviewers/user/${userId}`);
    const reviewers = response.data;
    
    console.log('📋 Project Reviewers del usuario:', response);
    
    // Obtener los detalles de cada proyecto
    const projectPromises = reviewers.map(async (reviewer: any) => {
      try {
        const projectResponse = await api.get(`/figma-projects/${reviewer.projectId}`);
        const project = projectResponse.data;
        
        // Agregar el rol del usuario en este proyecto
        return {
          ...project,
          userRole: reviewer.roleName || reviewer.roleId || 'Revisor',
          reviewerId: reviewer.projectReviewerId,
          assignedAt: reviewer.assignedAt,
        };
      } catch (error) {
        console.error(`Error cargando proyecto ${reviewer.projectId}:`, error);
        return null;
      }
    });
    
    const projectResults = await Promise.all(projectPromises);
    projects.value = projectResults.filter(p => p !== null);
    
    console.log('✅ Proyectos cargados:', projects.value);
    
    if (projects.value.length === 0) {
      $q.notify({
        type: 'info',
        message: 'No tienes proyectos asignados'
      });
    }
    
  } catch (error: any) {
    console.error('Error al cargar proyectos:', error);
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al cargar proyectos'
    });
  } finally {
    loadingProjects.value = false;
  }
};


// ============================================================
// CARGAR USUARIOS DISPONIBLES PARA EVALUADORES
// ============================================================
const loadAvailableUsers = async () => {
  try {
    const { data } = await api.get("/users");
    availableUsers.value = data;
    console.log("Usuarios disponibles:", availableUsers.value);
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    $q.notify({
      type: "negative",
      message: "Error al cargar usuarios disponibles",
    });
  }
};


const getTaskCount = (projectId: string) => {
  return projectTasks.value.filter((t) => t.projectId === projectId).length;
};

const getEvaluationCount = (projectId: string) => {
  return evaluations.value.filter((e) => e.projectId === projectId).length;
};


// Methods
const selectProject = async (projectId: string) => {
  selectedProjectId.value = projectId;
  await loadProjectTasks(projectId);
  await loadEvaluations(projectId);
  currentEvaluation.value = null;
  selectedEvaluationId.value = null;
};

const handleAddTasksFromProject = async (selectedTasks: any[]) => {
  if (!currentEvaluation.value) return;

  const tasksToCreate = selectedTasks.map((task, index) => ({
    evaluationId: currentEvaluation.value.cognitiveEvaluationId,
    projectTaskId: task.taskId,
    title: task.title,
    description: task.description || "",
    userGoal: `El usuario debe ${task.title.toLowerCase()}`,
    orderIndex: tasks.value.length + index + 1,
  }));

  try {
    for (const task of tasksToCreate) {
      await api.post("/cognitive-tasks", task);
    }

    $q.notify({
      type: "positive",
      message: `${tasksToCreate.length} tareas agregadas exitosamente`,
    });

    await loadTasks(currentEvaluation.value.cognitiveEvaluationId);
  } catch (error) {
    $q.notify({
      type: "negative",
      message: "Error al agregar tareas",
    });
  }
};


const loadProjectTasks = async (projectId: string) => {
  try {
    const { data } = await api.get(`/tasks/projectId/${projectId}`);
    projectTasks.value = data;
    console.log("las tareas del proyecto es :", projectTasks.value);
  } catch (error) {
    $q.notify({
      type: "negative",
      message: "Error al cargar tareas del proyecto",
    });
  }
};

// Handlers - Evaluations
const handleCreateEvaluation = async (data: any) => {
  await createEvaluation(data);
  showEvaluationDialog.value = false;
};

const handleUpdateEvaluation = async (data: any) => {
  await updateEvaluation(data);
  showEditEvaluationDialog.value = false;
};

const handleStartEvaluation = async () => {
  const confirm = await $q.dialog({
    title: "Iniciar Evaluación",
    message:
      "¿Estás seguro de iniciar la evaluación? Los evaluadores podrán comenzar el recorrido cognitivo.",
    ok: "Iniciar",
    cancel: "Cancelar",
  });

  if (confirm) {
    await updateStatus("in_progress");
  }
};

const handleCompleteEvaluation = async () => {
  const confirm = await $q.dialog({
    title: "Completar Evaluación",
    message:
      "¿Estás seguro de completar la evaluación? Todos los evaluadores deben haber finalizado.",
    ok: "Completar",
    cancel: "Cancelar",
  });

  if (confirm) {
    await updateStatus("completed");
  }
};

const confirmDelete = async () => {
  const confirm = await $q.dialog({
    title: "Eliminar Evaluación",
    message:
      "¿Estás seguro de eliminar esta evaluación? Esta acción no se puede deshacer.",
    ok: { label: "Eliminar", color: "negative" },
    cancel: "Cancelar",
  });

  if (confirm) {
    await deleteEvaluation();
  }
};

const selectedProject = computed(() => {
  return projects.value.find(p => p.projectId === selectedProjectId.value)
})
const handleExportReport = async () => {
  const result = await $q.dialog({
    title: "Exportar Reporte",
    message: "Selecciona el formato del reporte",
    options: {
      type: "radio",
      items: [
        { label: "PDF", value: "pdf" },
        { label: "DOCX", value: "docx" },
      ],
    },
    ok: "Exportar",
    cancel: "Cancelar",
  });

  if (result) {
    await exportReport(currentEvaluation.value.cognitiveEvaluationId, result);
  }
};

// Handlers - Tasks
const handleAddTasks = () => {
  showTaskDialog.value = true;
};

const handleAddTasksBatch = async (data: any) => {
  await createTasksBatch(data);
  showTaskDialog.value = false;
};

const handleEditTask = (task: any) => {
  // Abrir diálogo de edición
};

const handleDeleteTask = async (id: string) => {
  await deleteTask(id);
};

const handleReorderTasks = async (taskIds: string[]) => {
  await reorderTasks(taskIds);
};

const handleSelectTask = async (taskId: string) => {
  await selectTask(taskId);
};

// Handlers - Rules
const handleAddRules = () => {
  showRulesDialog.value = true;
};

const handleAddRulesBatch = async (data: any) => {
  await createRulesBatch(data);
  showRulesDialog.value = false;
};

const handleEditRule = async (data: any) => {
  await updateRule(data.id, data);
};

const handleDeleteRule = async (id: string) => {
  await deleteRule(id);
};

const handleReorderRules = async (ruleIds: string[]) => {
  // Implementar reorden de reglas
  await api.reorderRules(
    currentEvaluation.value.cognitiveEvaluationId,
    ruleIds,
  );
  await loadRules(currentEvaluation.value.cognitiveEvaluationId);
};

// Handlers - Evaluators
const handleAddEvaluators = () => {
  showEvaluatorDialog.value = true;
};

const handleAddEvaluatorsBatch = async (data: any) => {
  console.log("DATA COMPLETA:", JSON.stringify(data, null, 2));

  console.log("EVALUADORES:", data.evaluators);

  data.evaluators.forEach((evaluator: any, index: number) => {
    console.log(`EVALUADOR ${index}:`, evaluator);
    console.log(`USER ID ${index}:`, evaluator.userId);
  });

  await assignEvaluatorsBatch(data);

  showEvaluatorDialog.value = false;
};

const handleRemoveEvaluator = async (id: string) => {
  await removeEvaluator(id);
};

// Handlers - Problems
const handleAddProblem = async (data: any) => {
  await createProblem(data);
};

const handleEditProblem = async (data: any) => {
  // Implementar edición de problema
};

const handleUnifyProblems = async (data: any) => {
  await unifyProblems(data);
};

const handleProblemStatusChange = async (
  id: string,
  status: string,
  notes?: string,
) => {
  await updateProblemStatus(id, status, notes);
};

// Handlers - Recommendations
const handleAddRecommendations = async (data: any) => {
  await createRecommendationsBatch(data);
};

const handleImplementRecommendation = async (id: string, notes: string) => {
  await implementRecommendation(id, notes);
};

// Watchers
watch(currentEvaluation, async (val) => {
  if (val) {
    await loadAllData(val.cognitiveEvaluationId);

    // Calcular progreso
    const totalTasks = tasks.value.length;
    const completedTasks = tasks.value.filter(
      (t) => t.status === "completed",
    ).length;
    evaluationProgress.value =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }
});
// Lifecycle
onMounted(() => {
  loadProjects();
  loadEvaluations();
  loadAvailableUsers();
  if (selectedProjectId.value) {
    loadProjectTasks(selectedProjectId.value);
  }
});

// API para llamadas adicionales
import api from "@/api/axios";
</script>

<style scoped>
/* Estilos personalizados si son necesarios */
</style>
