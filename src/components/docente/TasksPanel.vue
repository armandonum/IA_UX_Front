<template>
  <div>
    <div class="text-h6 text-weight-bold text-grey-9 q-mb-md">
      Requerimientos y Tareas
    </div>

    <!-- ================= FILTROS ================= -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-3" v-if="semesterId">
        <div class="text-caption text-grey-6 q-mt-sm">
          <q-icon name="calendar_month" size="16px" class="q-mr-xs" />
          Semestre: {{ semesterName }}
        </div>
      </div>

      <!-- Selector de proyecto -->
      <div class="col-12 col-md-4">
        <q-select
          v-model="selectedProject"
          filled
          :options="filteredProjects"
          option-label="projectName"
          option-value="projectId"
          label="Proyecto (opcional)"
          emit-value
          map-options
          clearable
          :loading="loadingProjects"
          :disable="!semesterId"
          @update:model-value="onProjectChange"
        >
          <template v-slot:prepend>
            <q-icon name="dashboard" color="primary" />
          </template>
          <template v-slot:no-option>
            <div class="text-center q-pa-md text-grey-6">
              <q-icon name="info" size="20px" />
              <div>No hay proyectos en este semestre</div>
            </div>
          </template>
        </q-select>
      </div>

      <!-- Toggle: Requerimientos globales vs específicos -->
      <div class="col-12 col-md-3 flex items-center">
        <q-toggle
          v-model="showGlobalRequirements"
          :label="
            showGlobalRequirements
              ? 'Requerimientos generales'
              : 'Requerimientos del proyecto'
          "
          :icon="showGlobalRequirements ? 'public' : 'folder_open'"
          color="primary"
          :disable="!semesterId"
          @update:model-value="loadRequirements"
        />
      </div>

      <div class="col-12 col-md-2 flex items-center justify-end">
        <q-badge color="primary" class="q-px-md q-py-sm">
          {{ filteredRequirements.length }} requerimientos
        </q-badge>
      </div>
    </div>

    <!-- Indicador de semestre no seleccionado -->
    <q-banner
      v-if="!semesterId"
      rounded
      class="bg-orange-1 text-orange-10 q-mb-md"
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>
      Selecciona un semestre para ver y gestionar requerimientos y tareas.
    </q-banner>

    <div v-if="semesterId" class="row q-col-gutter-lg">
      <!-- ================= COLUMNA IZQUIERDA: REQUERIMIENTOS ================= -->
      <div class="col-12 col-md-5">
        <div class="row items-center justify-between q-mb-sm">
          <div>
            <div class="text-subtitle1 text-weight-medium">Requerimientos</div>
            <div class="text-caption text-grey-6">
              <q-icon
                :name="isGlobalView ? 'public' : 'folder_open'"
                size="16px"
                class="q-mr-xs"
              />
              {{
                isGlobalView
                  ? "Generales del semestre"
                  : "Del proyecto seleccionado"
              }}
            </div>
          </div>

          <q-btn
            dense
            flat
            round
            icon="add"
            color="primary"
            @click="openRequirementDialog(null)"
            :disable="!semesterId"
          >
            <q-tooltip>
              {{
                isGlobalView
                  ? "Crear requerimiento global"
                  : "Crear requerimiento del proyecto"
              }}
            </q-tooltip>
          </q-btn>
        </div>
        <q-list bordered separator>
          <q-item
            v-for="req in filteredRequirements"
            :key="req.requirementId"
            clickable
            :active="req.requirementId === selectedRequirement?.requirementId"
            active-class="bg-blue-1"
            @click="selectRequirement(req)"
          >
            <q-item-section>
              <q-item-label class="text-weight-medium">
                <q-badge
                  :color="req.semesterId ? 'primary' : 'grey-7'"
                  class="q-mr-sm"
                >
                  {{ req.semesterId ? "🌐" : "📁" }}
                </q-badge>
                <q-badge color="grey-7" class="q-mr-sm">{{ req.code }}</q-badge>
                {{ req.title }}
              </q-item-label>
              <q-item-label caption lines="2">{{
                req.description
              }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn
                  flat
                  dense
                  round
                  icon="edit"
                  size="sm"
                  @click.stop="openRequirementDialog(req)"
                />
                <q-btn
                  flat
                  dense
                  round
                  icon="delete"
                  color="negative"
                  size="sm"
                  @click.stop="confirmDeleteRequirement(req)"
                />
              </div>
            </q-item-section>
          </q-item>

          <q-item v-if="!filteredRequirements.length">
            <q-item-section class="text-grey-6 text-center q-py-md">
              <q-icon name="info" size="32px" />
              <div class="q-mt-sm">
                {{
                  isGlobalView
                    ? "No hay requerimientos globales para este semestre"
                    : "No hay requerimientos para este proyecto"
                }}
              </div>
              <q-btn
                flat
                dense
                color="primary"
                label="Crear primero"
                @click="openRequirementDialog(null)"
                class="q-mt-sm"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- ================= COLUMNA DERECHA: TAREAS ================= -->
      <div class="col-12 col-md-7">
        <template v-if="selectedRequirement">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1 text-weight-medium">
              Tareas de "{{ selectedRequirement.title }}"
              <q-badge
                :color="selectedRequirement.semesterId ? 'primary' : 'grey-7'"
                class="q-ml-sm"
              >
                {{ selectedRequirement.semesterId ? "Global" : "Proyecto" }}
              </q-badge>
            </div>
            <q-btn
              unelevated
              dense
              color="primary"
              icon="add"
              label="Nueva tarea"
              :disable="!canCreateTask"
              @click="openTaskDialog(null)"
            >
              <q-tooltip v-if="!canCreateTask">
                Selecciona un proyecto primero para crear tareas en requerimientos globales
              </q-tooltip>
            </q-btn>
          </div>

          <!-- Banner informativo según el contexto -->
          <q-banner
            v-if="selectedRequirement.semesterId && !selectedProject"
            dense
            rounded
            class="bg-warning text-white q-mb-sm"
          >
            <template #avatar>
              <q-icon name="info" />
            </template>
            <div class="text-caption">
              <strong>Requerimiento global:</strong> Para crear tareas, primero selecciona
              un proyecto en el filtro superior.
            </div>
          </q-banner>

          <q-banner
            v-else-if="selectedRequirement.semesterId && selectedProject"
            dense
            rounded
            class="bg-blue-1 text-primary q-mb-sm"
          >
            <template #avatar>
              <q-icon name="info" />
            </template>
            <div class="text-caption">
              Las tareas se asignarán al proyecto:
              <strong>{{ getProjectName(selectedProject) }}</strong>
            </div>
          </q-banner>

          <div class="text-caption text-grey-6 q-mb-sm">
            Arrastra las tareas para cambiar el orden en que se le presentan al
            usuario.
          </div>

          <q-list bordered separator>
            <q-item
              v-for="(task, index) in orderedTasks"
              :key="task.taskId"
              draggable="true"
              class="cursor-move"
              @dragstart="onDragStart(index)"
              @dragover.prevent
              @drop="onDrop(index)"
            >
              <q-item-section avatar>
                <q-icon name="drag_indicator" color="grey-6" />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ task.title }}
                </q-item-label>
                <q-item-label caption lines="2">
                  {{ task.description }}
                </q-item-label>
                <!-- Mostrar a qué proyecto pertenece la tarea -->
                <q-item-label caption v-if="task.projectId" class="q-mt-xs">
                  <q-badge color="info" outline class="q-px-sm">
                    <q-icon name="dashboard" size="12px" class="q-mr-xs" />
                    {{ getProjectName(task.projectId) }}
                  </q-badge>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <q-badge color="grey-6">#{{ index + 1 }}</q-badge>
                  <q-btn
                    flat
                    dense
                    round
                    icon="edit"
                    size="sm"
                    @click.stop="openTaskDialog(task)"
                  />
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click.stop="confirmDeleteTask(task)"
                  />
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="!orderedTasks.length">
              <q-item-section class="text-grey-6 text-center q-py-md">
                <q-icon name="assignment" size="32px" />
                <div class="q-mt-sm">
                  Este requerimiento todavía no tiene tareas.
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <q-linear-progress
            v-if="reordering"
            indeterminate
            color="primary"
            class="q-mt-sm"
          />
        </template>

        <q-card v-else flat bordered class="flex flex-center q-pa-xl">
          <q-icon name="click" size="48px" color="grey-5" />
          <div class="text-grey-6 q-mt-md">
            Selecciona un requerimiento para ver y ordenar sus tareas.
          </div>
        </q-card>
      </div>
    </div>

    <div v-else class="text-grey-6 q-mt-md">
      <q-icon name="info" size="20px" />
      Selecciona un semestre para comenzar.
    </div>

    <!-- ================= DIALOG: crear/editar requerimiento ================= -->
    <q-dialog v-model="requirementDialogOpen">
      <q-card style="width: 560px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">
            {{
              editingRequirement
                ? "Editar requerimiento"
                : "Nuevo requerimiento"
            }}
          </div>
          <div class="text-caption text-grey-6">
            {{
              isGlobalView
                ? "🌐 Se creará como requerimiento global del semestre"
                : "📁 Se creará como requerimiento específico del proyecto"
            }}
          </div>
        </q-card-section>

        <q-form @submit.prevent="onSaveRequirement">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="requirementForm.code"
              filled
              label="Código (ej. RF-001)"
              :rules="[required]"
            />
            <q-input
              v-model="requirementForm.title"
              filled
              label="Título"
              :rules="[required]"
            />
            <q-input
              v-model="requirementForm.description"
              filled
              type="textarea"
              autogrow
              label="Descripción"
              :rules="[required]"
            />
            <q-input
              v-model="requirementForm.acceptanceCriteria"
              filled
              type="textarea"
              autogrow
              label="Criterios de aceptación (opcional)"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Cancelar"
              @click="requirementDialogOpen = false"
            />
            <q-btn
              unelevated
              color="primary"
              type="submit"
              label="Guardar"
              :loading="savingRequirement"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- ================= DIALOG: crear/editar tarea ================= -->
    <q-dialog v-model="taskDialogOpen">
      <q-card style="width: 520px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">
            {{ editingTask ? "Editar tarea" : "Nueva tarea" }}
          </div>
          <div class="text-caption text-grey-6" v-if="!editingTask">
            Se agregará al final de "{{ selectedRequirement?.title }}"
          </div>
        </q-card-section>

        <q-form @submit.prevent="onSaveTask">
          <q-card-section class="q-gutter-md">
            <!-- Selector de proyecto (SOLO si el requerimiento es global) -->
            <q-select
              v-if="selectedRequirement?.semesterId"
              v-model="taskForm.projectId"
              :options="filteredProjects"
              option-label="projectName"
              option-value="projectId"
              label="Proyecto *"
              filled
              emit-value
              map-options
              :rules="[(val) => !!val || 'Debes seleccionar un proyecto']"
              :disable="!!editingTask"
            >
              <template v-slot:prepend>
                <q-icon name="dashboard" color="primary" />
              </template>
              <template v-slot:hint>
                <div class="text-caption">
                  <q-icon name="info" size="12px" class="q-mr-xs" />
                  Requerimiento global: la tarea debe pertenecer a un proyecto específico
                </div>
              </template>
            </q-select>

            <!-- Info si el requerimiento es de proyecto -->
            <q-banner
              v-else-if="selectedRequirement?.projectId"
              dense
              rounded
              class="bg-blue-1 text-primary"
            >
              <template #avatar>
                <q-icon name="folder_open" size="18px" />
              </template>
              <div class="text-caption">
                Esta tarea pertenecerá al proyecto:
                <strong>{{ getProjectName(selectedRequirement.projectId) }}</strong>
              </div>
            </q-banner>

            <q-input
              v-model="taskForm.title"
              filled
              label="Título *"
              :rules="[required]"
            />
            <q-input
              v-model="taskForm.description"
              filled
              type="textarea"
              autogrow
              label="Descripción (lo que verá el estudiante) *"
              :rules="[required]"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" @click="taskDialogOpen = false" />
            <q-btn
              unelevated
              color="primary"
              type="submit"
              :label="editingTask ? 'Guardar' : 'Crear'"
              :loading="savingTask"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { useDocenteStore } from "@/stores/docente.stores";
import { useSemesterStore } from "@/stores/semester.store";
import type { ProjectRequirement } from "@/types/requirement.types";
import type { Task } from "@/types/docente.types";

const props = defineProps<{
  semesterId: string | null;
}>();

const $q = useQuasar();
const store = useDocenteStore();
const semesterStore = useSemesterStore();

// ==========================================
// STATE
// ==========================================
const selectedProject = ref<string | null>(null);
const selectedRequirement = ref<ProjectRequirement | null>(null);
const showGlobalRequirements = ref(true);
const loadingProjects = ref(false);

const required = (val: string) => !!val || "Campo obligatorio";

// --- requerimientos ---
const requirementDialogOpen = ref(false);
const savingRequirement = ref(false);
const editingRequirement = ref<ProjectRequirement | null>(null);
const requirementForm = reactive({
  code: "",
  title: "",
  description: "",
  acceptanceCriteria: "",
});

// --- tareas ---
const taskDialogOpen = ref(false);
const savingTask = ref(false);
const reordering = ref(false);
const editingTask = ref<Task | null>(null);
const taskForm = reactive({
  title: "",
  description: "",
  projectId: "" as string,
});

// ==========================================
// COMPUTED
// ==========================================
const semesterName = computed(() => {
  const sem = semesterStore.semesters.find(
    (s) => s.semesterId === props.semesterId,
  );
  return sem ? `${sem.name} (${sem.code})` : "";
});

const filteredProjects = computed(() => {
  if (!props.semesterId) return [];
  return store.projects.filter((p) => p.semesterId === props.semesterId);
});

const isGlobalView = computed(() => {
  return showGlobalRequirements.value || !selectedProject.value;
});

const filteredRequirements = computed(() => {
  if (!props.semesterId) return [];

  let requirements = store.requirements;

  if (showGlobalRequirements.value) {
    requirements = requirements.filter(
      (r) => r.semesterId === props.semesterId,
    );
  } else if (selectedProject.value) {
    requirements = requirements.filter(
      (r) => r.projectId === selectedProject.value,
    );
  }

  return requirements;
});

const orderedTasks = computed(() =>
  [...store.tasks].sort((a: Task, b: Task) => a.orderIndex - b.orderIndex),
);

/**
 * 🔥 NUEVA REGLA:
 * - Requerimiento GLOBAL: requiere proyecto seleccionado para crear tareas
 * - Requerimiento de PROYECTO: siempre se puede crear tareas (el proyecto está implícito)
 */
const canCreateTask = computed(() => {
  if (!selectedRequirement.value) return false;

  // Si es un requerimiento de proyecto → siempre se puede crear
  if (selectedRequirement.value.projectId) return true;

  // Si es un requerimiento global → requiere que haya proyecto seleccionado
  return !!selectedProject.value;
});

// ==========================================
// HELPERS
// ==========================================
function getProjectName(projectId: string): string {
  const project = store.projects.find((p) => p.projectId === projectId);
  return project?.projectName || "Proyecto desconocido";
}

// ==========================================
// METHODS
// ==========================================
async function loadRequirements() {
  if (!props.semesterId) return;

  try {
    if (showGlobalRequirements.value || !selectedProject.value) {
      await store.fetchRequirementsBySemester(props.semesterId);
    } else if (selectedProject.value) {
      await store.fetchRequirements(selectedProject.value);
    }
  } catch (e: any) {
    $q.notify({
      type: "negative",
      message: e.message ?? "No se pudo cargar los requerimientos",
    });
  }
}

async function onProjectChange() {
  selectedRequirement.value = null;
  store.tasks.length = 0;

  if (selectedProject.value) {
    await loadRequirements();
  } else {
    showGlobalRequirements.value = true;
    await loadRequirements();
  }
}

async function selectRequirement(req: ProjectRequirement) {
  selectedRequirement.value = req;
  try {
    await store.fetchTasksByRequirement(req.requirementId);
  } catch (e: any) {
    $q.notify({
      type: "negative",
      message: e.message ?? "No se pudo cargar las tareas",
    });
  }
}

// --- CRUD requerimiento ---
function openRequirementDialog(req: ProjectRequirement | null) {
  editingRequirement.value = req;
  requirementForm.code = req?.code ?? "";
  requirementForm.title = req?.title ?? "";
  requirementForm.description = req?.description ?? "";
  requirementForm.acceptanceCriteria = req?.acceptanceCriteria ?? "";
  requirementDialogOpen.value = true;
}

async function onSaveRequirement() {
  if (!props.semesterId) {
    $q.notify({ type: "warning", message: "No hay semestre seleccionado" });
    return;
  }

  savingRequirement.value = true;
  try {
    const payload = {
      code: requirementForm.code,
      title: requirementForm.title,
      description: requirementForm.description,
      acceptanceCriteria: requirementForm.acceptanceCriteria || undefined,
    };

    if (editingRequirement.value) {
      await store.updateRequirement(editingRequirement.value.requirementId, {
        code: payload.code,
        title: payload.title,
        description: payload.description,
        acceptanceCriteria: payload.acceptanceCriteria,
      });
      $q.notify({ type: "positive", message: "Requerimiento actualizado" });
    } else {
      if (showGlobalRequirements.value || !selectedProject.value) {
        // 🔥 GLOBAL: semesterId, sin projectId
        await store.createRequirement({
          ...payload,
          semesterId: props.semesterId,
        });
        $q.notify({ type: "positive", message: "Requerimiento global creado" });
      } else {
        // 🔥 DE PROYECTO: projectId + semesterId
        await store.createRequirement({
          ...payload,
          projectId: selectedProject.value!,
          semesterId: props.semesterId,
        });
        $q.notify({
          type: "positive",
          message: "Requerimiento del proyecto creado",
        });
      }
    }

    requirementDialogOpen.value = false;
    await loadRequirements();
  } catch (e: any) {
    console.error("Error saving requirement:", e);
    $q.notify({
      type: "negative",
      message: e.message ?? "No se pudo guardar el requerimiento",
    });
  } finally {
    savingRequirement.value = false;
  }
}

function confirmDeleteRequirement(req: ProjectRequirement) {
  $q.dialog({
    title: "Eliminar requerimiento",
    message: `Se eliminará "${req.title}" y todas sus tareas asociadas. ¿Continuar?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await store.deleteRequirement(req.requirementId);
      if (selectedRequirement.value?.requirementId === req.requirementId) {
        selectedRequirement.value = null;
        store.tasks.length = 0;
      }
      await loadRequirements();
      $q.notify({ type: "positive", message: "Requerimiento eliminado" });
    } catch (e: any) {
      $q.notify({
        type: "negative",
        message: e.message ?? "No se pudo eliminar el requerimiento",
      });
    }
  });
}

// --- CRUD tarea ---
function openTaskDialog(task: Task | null) {
  editingTask.value = task;
  taskForm.title = task?.title ?? "";
  taskForm.description = task?.description ?? "";

  // 🔥 Determinar el projectId de la tarea:
  // - Si edita: usar el projectId de la tarea existente
  // - Si crea en req de proyecto: heredar el projectId del requerimiento
  // - Si crea en req global: usar el proyecto seleccionado (o vacío para forzar selección)
  if (task) {
    taskForm.projectId = task.projectId || "";
  } else if (selectedRequirement.value?.projectId) {
    taskForm.projectId = selectedRequirement.value.projectId;
  } else {
    taskForm.projectId = selectedProject.value || "";
  }

  taskDialogOpen.value = true;
}

async function onSaveTask() {
  if (!selectedRequirement.value) {
    $q.notify({
      type: "warning",
      message: "Selecciona un requerimiento primero",
    });
    return;
  }

  // 🔥 VALIDACIÓN: si es requerimiento global, exigir proyecto
  if (selectedRequirement.value.semesterId && !taskForm.projectId) {
    $q.notify({
      type: "negative",
      message: "Debes seleccionar un proyecto para esta tarea",
    });
    return;
  }

  // Determinar el projectId final
  const finalProjectId =
    selectedRequirement.value.projectId || taskForm.projectId;

  if (!finalProjectId) {
    $q.notify({
      type: "negative",
      message: "La tarea debe pertenecer a un proyecto",
    });
    return;
  }

  savingTask.value = true;
  try {
    if (editingTask.value) {
      await store.updateTask(editingTask.value.taskId, {
        title: taskForm.title,
        description: taskForm.description,
        // 🔥 NO permitir cambiar el proyecto en edición
      });
      $q.notify({ type: "positive", message: "Tarea actualizada" });
    } else {
      await store.createTask({
        projectId: finalProjectId,
        requirementId: selectedRequirement.value.requirementId,
        orderIndex: orderedTasks.value.length,
        title: taskForm.title,
        description: taskForm.description,
      });
      $q.notify({ type: "positive", message: "Tarea creada" });
    }
    taskDialogOpen.value = false;
    editingTask.value = null;
    taskForm.title = "";
    taskForm.description = "";
    taskForm.projectId = "";
    await store.fetchTasksByRequirement(
      selectedRequirement.value.requirementId,
    );
  } catch (e: any) {
    $q.notify({
      type: "negative",
      message: e.message ?? "No se pudo guardar la tarea",
    });
  } finally {
    savingTask.value = false;
  }
}

function confirmDeleteTask(task: Task) {
  $q.dialog({
    title: "Eliminar tarea",
    message: `¿Seguro que quieres eliminar "${task.title}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await store.deleteTask(task.taskId);
      if (selectedRequirement.value) {
        await store.fetchTasksByRequirement(
          selectedRequirement.value.requirementId,
        );
      }
      $q.notify({ type: "positive", message: "Tarea eliminada" });
    } catch (e: any) {
      $q.notify({
        type: "negative",
        message: e.message ?? "No se pudo eliminar la tarea",
      });
    }
  });
}

// --- drag & drop ---
const draggedIndex = ref<number | null>(null);

function onDragStart(index: number) {
  draggedIndex.value = index;
}

async function onDrop(targetIndex: number) {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return;

  const list = [...orderedTasks.value];
  const [moved] = list.splice(draggedIndex.value, 1);
  list.splice(targetIndex, 0, moved);
  draggedIndex.value = null;

  reordering.value = true;
  try {
    await Promise.all(
      list.map((task, idx) =>
        task.orderIndex !== idx
          ? store.updateTaskOrder(task.taskId, idx)
          : Promise.resolve(),
      ),
    );
    if (selectedRequirement.value) {
      await store.fetchTasksByRequirement(
        selectedRequirement.value.requirementId,
      );
    }
  } catch (e: any) {
    $q.notify({
      type: "negative",
      message: e.message ?? "No se pudo reordenar",
    });
  } finally {
    reordering.value = false;
  }
}

// ==========================================
// WATCHERS & LIFECYCLE
// ==========================================
watch(
  () => props.semesterId,
  (newVal) => {
    if (newVal) {
      selectedProject.value = null;
      selectedRequirement.value = null;
      store.requirements.length = 0;
      store.tasks.length = 0;
      showGlobalRequirements.value = true;
      loadRequirements();
    }
  },
  { immediate: true },
);

onMounted(async () => {
  try {
    await store.fetchProjects();
  } catch (e: any) {
    $q.notify({
      type: "negative",
      message: e.message ?? "No se pudo cargar los proyectos",
    });
  }
});
</script>

<style scoped>
.bg-blue-1 {
  background-color: #e3f2fd;
}
</style>