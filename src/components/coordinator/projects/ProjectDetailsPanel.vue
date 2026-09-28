<!-- components/coordinator/projects/ProjectDetailsPanel.vue -->
<template>
  <q-dialog v-model="localOpen" full-width persistent>
    <q-card style="max-width: 1200px; width: 100%; max-height: 92vh">
      <!-- ================= HEADER ================= -->
      <q-card-section class="bg-primary text-white">
        <div class="row items-center">
          <q-avatar color="white" text-color="primary" size="48px" icon="dashboard" />
          <div class="col q-ml-md">
            <div class="text-h6">{{ project?.projectName || 'Proyecto' }}</div>
            <div class="text-caption" style="opacity: 0.85">
              <q-icon name="code" size="14px" />
              {{ project?.fileKey }}
              <span class="q-ml-md">
                <q-icon name="calendar_month" size="14px" />
                Semestre: {{ semesterName }}
              </span>
            </div>
          </div>
          <q-btn flat round icon="close" color="white" @click="close" />
        </div>
      </q-card-section>

      <!-- ================= TABS ================= -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey-7"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
        no-caps
      >
        <q-tab name="requirements" icon="assignment" label="Requerimientos y Tareas" />
        <q-tab name="figma" icon="link" label="Conexión Figma" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated style="max-height: 70vh; overflow-y: auto">
        <!-- ============================================= -->
        <!-- TAB: REQUERIMIENTOS Y TAREAS                  -->
        <!-- ============================================= -->
        <q-tab-panel name="requirements" class="q-pa-md">
          <div class="row q-col-gutter-lg">
            <!-- ============ COLUMNA IZQUIERDA: REQUERIMIENTOS ============ -->
            <div class="col-12 col-md-5">
              <div class="row items-center justify-between q-mb-sm">
                <div>
                  <div class="text-subtitle1 text-weight-medium">Requerimientos</div>
                  <div class="text-caption text-grey-6">
                    {{ globalRequirements.length }} globales ·
                    {{ projectRequirements.length }} del proyecto
                  </div>
                </div>
                <q-btn
                  dense
                  flat
                  round
                  icon="add"
                  color="primary"
                  @click="openRequirementDialog(null)"
                >
                  <q-tooltip>Crear requerimiento del proyecto</q-tooltip>
                </q-btn>
              </div>

              <!-- Requerimientos GLOBALES -->
              <div v-if="globalRequirements.length > 0" class="q-mb-md">
                <div class="row items-center q-mb-sm">
                  <q-icon name="public" color="primary" size="18px" class="q-mr-xs" />
                  <div class="text-caption text-weight-medium text-grey-7">
                    Globales del semestre (solo lectura)
                  </div>
                  <q-badge color="primary" class="q-ml-sm" outline>
                    {{ globalRequirements.length }}
                  </q-badge>
                </div>

                <q-list bordered separator>
                  <q-item
                    v-for="req in globalRequirements"
                    :key="req.requirementId"
                    clickable
                    :active="req.requirementId === selectedRequirement?.requirementId"
                    active-class="bg-blue-1"
                    @click="selectRequirement(req)"
                  >
                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        <q-badge color="primary" class="q-mr-sm">
                          <q-icon name="public" size="10px" />
                        </q-badge>
                        <q-badge color="grey-7" class="q-mr-sm">{{ req.code }}</q-badge>
                        {{ req.title }}
                      </q-item-label>
                      <q-item-label caption lines="2">
                        {{ req.description }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-icon name="lock" color="grey-5" size="18px">
                        <q-tooltip>Requerimiento global (no editable desde aquí)</q-tooltip>
                      </q-icon>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Requerimientos DEL PROYECTO -->
              <div>
                <div class="row items-center q-mb-sm">
                  <q-icon name="folder_open" color="primary" size="18px" class="q-mr-xs" />
                  <div class="text-caption text-weight-medium text-grey-7">
                    Específicos del proyecto
                  </div>
                  <q-badge color="primary" class="q-ml-sm" outline>
                    {{ projectRequirements.length }}
                  </q-badge>
                </div>

                <q-list v-if="projectRequirements.length > 0" bordered separator>
                  <q-item
                    v-for="req in projectRequirements"
                    :key="req.requirementId"
                    clickable
                    :active="req.requirementId === selectedRequirement?.requirementId"
                    active-class="bg-blue-1"
                    @click="selectRequirement(req)"
                  >
                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        <q-badge color="grey-7" class="q-mr-sm">{{ req.code }}</q-badge>
                        {{ req.title }}
                      </q-item-label>
                      <q-item-label caption lines="2">
                        {{ req.description }}
                      </q-item-label>
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
                </q-list>

                <q-banner
                  v-else
                  dense
                  rounded
                  class="bg-grey-2 text-grey-7"
                >
                  <template #avatar>
                    <q-icon name="info" />
                  </template>
                  <div class="text-caption">
                    Este proyecto no tiene requerimientos específicos.
                    Puedes crear uno con el botón <q-icon name="add" size="14px" />.
                  </div>
                </q-banner>
              </div>
            </div>

            <!-- ============ COLUMNA DERECHA: TAREAS ============ -->
            <div class="col-12 col-md-7">
              <template v-if="selectedRequirement">
                <div class="row items-center justify-between q-mb-sm">
                  <div>
                    <div class="text-subtitle1 text-weight-medium">
                      Tareas de "{{ selectedRequirement.title }}"
                    </div>
                    <div class="text-caption text-grey-6">
                      <q-badge
                        :color="selectedRequirement.semesterId ? 'primary' : 'grey-7'"
                        class="q-mr-xs"
                      >
                        {{ selectedRequirement.semesterId ? 'Global' : 'Proyecto' }}
                      </q-badge>
                      {{ selectedRequirement.code }}
                    </div>
                  </div>
                  <q-btn
                    unelevated
                    dense
                    color="primary"
                    icon="add"
                    label="Nueva tarea"
                    @click="openTaskDialog(null)"
                  />
                </div>

                <!-- Info sobre el proyecto de la tarea -->
                <q-banner dense rounded class="bg-blue-1 text-primary q-mb-sm">
                  <template #avatar>
                    <q-icon name="info" />
                  </template>
                  <div class="text-caption">
                    Las tareas se asociarán al proyecto:
                    <strong>{{ project?.projectName }}</strong>
                  </div>
                </q-banner>

                <div class="text-caption text-grey-6 q-mb-sm">
                  Arrastra las tareas para cambiar el orden en que se le presentan al usuario.
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
                      <q-btn
                        flat
                        dense
                        color="primary"
                        label="Crear primera tarea"
                        @click="openTaskDialog(null)"
                        class="q-mt-sm"
                      />
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
                  Selecciona un requerimiento para ver y gestionar sus tareas.
                </div>
              </q-card>
            </div>
          </div>
        </q-tab-panel>

        <!-- ============================================= -->
        <!-- TAB: CONEXIÓN FIGMA                           -->
        <!-- ============================================= -->
        <q-tab-panel name="figma" class="q-pa-md">
          <FigmaTokenManager ref="tokenManagerRef" />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- ================= DIALOG: REQUERIMIENTO ================= -->
    <q-dialog v-model="requirementDialogOpen" persistent>
      <q-card style="min-width: 560px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">
            {{ editingRequirement ? 'Editar requerimiento' : 'Nuevo requerimiento del proyecto' }}
          </div>
          <div class="text-caption text-grey-6">
            📁 Se creará como requerimiento específico de "{{ project?.projectName }}"
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
            <q-btn flat label="Cancelar" @click="requirementDialogOpen = false" />
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

    <!-- ================= DIALOG: TAREA ================= -->
    <q-dialog v-model="taskDialogOpen" persistent>
      <q-card style="min-width: 520px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">
            {{ editingTask ? 'Editar tarea' : 'Nueva tarea' }}
          </div>
          <div class="text-caption text-grey-6" v-if="!editingTask">
            Se agregará al final de "{{ selectedRequirement?.title }}"
          </div>
        </q-card-section>

        <q-form @submit.prevent="onSaveTask">
          <q-card-section class="q-gutter-md">
            <q-banner dense rounded class="bg-blue-1 text-primary">
              <template #avatar>
                <q-icon name="folder_open" />
              </template>
              <div class="text-caption">
                Tarea del proyecto: <strong>{{ project?.projectName }}</strong>
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
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { useDocenteStore } from '@/stores/docente.stores'
import { useSemesterStore } from '@/stores/semester.store'
import { requirementsApi } from '@/api/requirements.api'
import FigmaTokenManager from './FigmaTokenManager.vue'
import type { FigmaProject } from '@/types/coordinator/projects.types'
import type { ProjectRequirement } from '@/types/requirement.types'
import type { Task } from '@/types/docente.types'
import { useAuthStore } from '@/stores/auth.store' 

const props = defineProps<{
  modelValue: boolean
  project: FigmaProject | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const $q = useQuasar()
const store = useDocenteStore()
const semesterStore = useSemesterStore()
const authStore = useAuthStore()

const localOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// ==========================================
// STATE
// ==========================================
const activeTab = ref('requirements')
const tokenManagerRef = ref<InstanceType<typeof FigmaTokenManager> | null>(null)

// Requerimientos
const globalRequirements = ref<ProjectRequirement[]>([])
const projectRequirements = ref<ProjectRequirement[]>([])
const selectedRequirement = ref<ProjectRequirement | null>(null)
const loadingRequirements = ref(false)

// Tareas
const orderedTasks = ref<Task[]>([])
const loadingTasks = ref(false)
const reordering = ref(false)

// Diálogos
const requirementDialogOpen = ref(false)
const savingRequirement = ref(false)
const editingRequirement = ref<ProjectRequirement | null>(null)
const requirementForm = reactive({
  code: '',
  title: '',
  description: '',
  acceptanceCriteria: '',
})

const taskDialogOpen = ref(false)
const savingTask = ref(false)
const editingTask = ref<Task | null>(null)
const taskForm = reactive({
  title: '',
  description: '',
})

const required = (val: string) => !!val || 'Campo obligatorio'

// ==========================================
// COMPUTED
// ==========================================
const semesterName = computed(() => {
  if (!props.project?.semesterId) return 'Sin semestre'
  const sem = semesterStore.semesters.find(s => s.semesterId === props.project!.semesterId)
  return sem ? `${sem.name} (${sem.code})` : 'Sin semestre'
})

// ==========================================
// CARGA DE DATOS
// ==========================================
async function loadRequirements() {
  if (!props.project) return

  loadingRequirements.value = true
  try {
    // 1. Cargar requerimientos del proyecto
    const projectReqs = await requirementsApi.findByProject(props.project.projectId)
    projectRequirements.value = projectReqs

    // 2. Cargar requerimientos globales del semestre
    if (props.project.semesterId) {
      const globalReqs = await requirementsApi.findBySemester(props.project.semesterId)
      // Filtrar solo los que tienen semesterId (globales)
      globalRequirements.value = globalReqs.filter(r => r.semesterId)
    } else {
      globalRequirements.value = []
    }
  } catch (e: any) {
    $q.notify({
      type: 'negative',
      message: e.message ?? 'No se pudieron cargar los requerimientos',
    })
  } finally {
    loadingRequirements.value = false
  }
}

async function loadTasksForRequirement(requirementId: string) {
  loadingTasks.value = true
  try {
    await store.fetchTasksByRequirement(requirementId)
    orderedTasks.value = [...store.tasks].sort(
      (a: Task, b: Task) => a.orderIndex - b.orderIndex,
    )
  } catch (e: any) {
    $q.notify({
      type: 'negative',
      message: e.message ?? 'No se pudieron cargar las tareas',
    })
  } finally {
    loadingTasks.value = false
  }
}

// ==========================================
// SELECCIONAR REQUERIMIENTO
// ==========================================
async function selectRequirement(req: ProjectRequirement) {
  selectedRequirement.value = req
  await loadTasksForRequirement(req.requirementId)
}

// ==========================================
// CRUD REQUERIMIENTO
// ==========================================
function openRequirementDialog(req: ProjectRequirement | null) {
  // 🔥 Solo permite editar requerimientos del proyecto
  if (req?.semesterId) {
    $q.notify({
      type: 'info',
      message: 'Los requerimientos globales no se pueden editar desde aquí',
    })
    return
  }

  editingRequirement.value = req
  requirementForm.code = req?.code ?? ''
  requirementForm.title = req?.title ?? ''
  requirementForm.description = req?.description ?? ''
  requirementForm.acceptanceCriteria = req?.acceptanceCriteria ?? ''
  requirementDialogOpen.value = true
}
async function onSaveRequirement() {
  if (!props.project) return

  // 🔥 Validar que hay usuario autenticado
  const userId = authStore.user?.user_id
  if (!userId) {
    $q.notify({
      type: 'negative',
      message: 'No hay usuario autenticado',
    })
    return
  }

  savingRequirement.value = true
  try {
    const payload = {
      code: requirementForm.code,
      title: requirementForm.title,
      description: requirementForm.description,
      acceptanceCriteria: requirementForm.acceptanceCriteria || undefined,
    }

    if (editingRequirement.value) {
      await requirementsApi.update(editingRequirement.value.requirementId, payload)
      $q.notify({ type: 'positive', message: 'Requerimiento actualizado' })
    } else {
      // 🔥 Crear requerimiento del proyecto CON createdBy
      await requirementsApi.create({
        ...payload,
        createdBy: userId,  // 🔥 AGREGAR ESTO
        projectId: props.project.projectId,
        semesterId: props.project.semesterId || undefined,
      })
      $q.notify({ type: 'positive', message: 'Requerimiento creado' })
    }

    requirementDialogOpen.value = false
    editingRequirement.value = null
    await loadRequirements()
  } catch (e: any) {
    $q.notify({
      type: 'negative',
      message: e.message ?? 'No se pudo guardar el requerimiento',
    })
  } finally {
    savingRequirement.value = false
  }
}

function confirmDeleteRequirement(req: ProjectRequirement) {
  // 🔥 Bloquear eliminación de globales
  if (req.semesterId) {
    $q.notify({
      type: 'warning',
      message: 'Los requerimientos globales no se pueden eliminar desde aquí',
    })
    return
  }

  $q.dialog({
    title: 'Eliminar requerimiento',
    message: `Se eliminará "${req.title}" y todas sus tareas asociadas. ¿Continuar?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await requirementsApi.delete(req.requirementId)
      if (selectedRequirement.value?.requirementId === req.requirementId) {
        selectedRequirement.value = null
        orderedTasks.value = []
      }
      await loadRequirements()
      $q.notify({ type: 'positive', message: 'Requerimiento eliminado' })
    } catch (e: any) {
      $q.notify({
        type: 'negative',
        message: e.message ?? 'No se pudo eliminar el requerimiento',
      })
    }
  })
}

// ==========================================
// CRUD TAREA
// ==========================================
function openTaskDialog(task: Task | null) {
  if (!selectedRequirement.value) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona un requerimiento primero',
    })
    return
  }
  if (!props.project) return

  editingTask.value = task
  taskForm.title = task?.title ?? ''
  taskForm.description = task?.description ?? ''
  taskDialogOpen.value = true
}

async function onSaveTask() {
  if (!selectedRequirement.value || !props.project) return

  savingTask.value = true
  try {
    if (editingTask.value) {
      await store.updateTask(editingTask.value.taskId, {
        title: taskForm.title,
        description: taskForm.description,
      })
      $q.notify({ type: 'positive', message: 'Tarea actualizada' })
    } else {
      // 🔥 La tarea se asocia al proyecto Y al requerimiento
      await store.createTask({
        projectId: props.project.projectId,
        requirementId: selectedRequirement.value.requirementId,
        orderIndex: orderedTasks.value.length,
        title: taskForm.title,
        description: taskForm.description,
      })
      $q.notify({ type: 'positive', message: 'Tarea creada' })
    }

    taskDialogOpen.value = false
    editingTask.value = null
    taskForm.title = ''
    taskForm.description = ''
    await loadTasksForRequirement(selectedRequirement.value.requirementId)
  } catch (e: any) {
    $q.notify({
      type: 'negative',
      message: e.message ?? 'No se pudo guardar la tarea',
    })
  } finally {
    savingTask.value = false
  }
}

function confirmDeleteTask(task: Task) {
  $q.dialog({
    title: 'Eliminar tarea',
    message: `¿Seguro que quieres eliminar "${task.title}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await store.deleteTask(task.taskId)
      if (selectedRequirement.value) {
        await loadTasksForRequirement(selectedRequirement.value.requirementId)
      }
      $q.notify({ type: 'positive', message: 'Tarea eliminada' })
    } catch (e: any) {
      $q.notify({
        type: 'negative',
        message: e.message ?? 'No se pudo eliminar la tarea',
      })
    }
  })
}

// ==========================================
// DRAG & DROP
// ==========================================
const draggedIndex = ref<number | null>(null)

function onDragStart(index: number) {
  draggedIndex.value = index
}

async function onDrop(targetIndex: number) {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return

  const list = [...orderedTasks.value]
  const [moved] = list.splice(draggedIndex.value, 1)
  list.splice(targetIndex, 0, moved)
  draggedIndex.value = null

  reordering.value = true
  try {
    await Promise.all(
      list.map((task, idx) =>
        task.orderIndex !== idx
          ? store.updateTaskOrder(task.taskId, idx)
          : Promise.resolve(),
      ),
    )
    if (selectedRequirement.value) {
      await loadTasksForRequirement(selectedRequirement.value.requirementId)
    }
  } catch (e: any) {
    $q.notify({
      type: 'negative',
      message: e.message ?? 'No se pudo reordenar',
    })
  } finally {
    reordering.value = false
  }
}

// ==========================================
// UTILS
// ==========================================
function close() {
  emit('update:modelValue', false)
}

// ==========================================
// WATCHERS
// ==========================================
watch(
  () => props.modelValue,
  (open) => {
    if (open && props.project) {
      loadRequirements()
      selectedRequirement.value = null
      orderedTasks.value = []
      activeTab.value = 'requirements'
    }
  },
)
</script>

<style scoped>
.bg-blue-1 {
  background-color: #e3f2fd;
}
</style>