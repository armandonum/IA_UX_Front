```vue
<template>
  <div>
    <!-- Tabs -->
    <q-tabs
      v-model="taskTab"
      active-color="primary"
      indicator-color="primary"
      class="border-bottom"
      align="left"
    >
      <q-tab
        name="list"
        icon="assignment"
        label="Lista de Tareas"
      />
      <q-tab
        name="flow"
        icon="route"
        label="Grabar Flujo Ideal"
      />
    </q-tabs>

    <q-tab-panels
      v-model="taskTab"
      animated
      class="q-mt-md"
    >
      <!-- ============================================================ -->
      <!-- TAB 1: LISTA DE TAREAS                                        -->
      <!-- ============================================================ -->
      <q-tab-panel name="list">
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-subtitle1 text-weight-medium">
              Tareas del Proyecto
            </div>

            <div class="text-caption text-grey-6">
              Tareas disponibles para la evaluación
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-btn
              v-if="canEdit"
              color="primary"
              icon="add"
              label="Agregar Tareas"
              size="sm"
              unelevated
              @click="openTaskSelector"
            />

            <q-btn
              v-if="canEdit && selectedProjectTasks.length > 0"
              color="positive"
              icon="check"
              label="Agregar Seleccionadas"
              size="sm"
              unelevated
              @click="addSelectedTasks"
              :loading="addingTasks"
            />
          </div>
        </div>

        <!-- Tareas existentes en la evaluación -->
        <div v-if="tasks && tasks.length > 0" class="q-mb-md">
          <div class="text-caption text-grey-6 q-mb-sm">
            Tareas en la evaluación ({{ tasks.length }})
          </div>

          <q-list bordered separator class="rounded-borders">
            <q-item
              v-for="task in sortedTasks"
              :key="task.id"
              clickable
              @click="selectTask(task)"
            >
              <q-item-section avatar>
                <q-icon
                  :name="getStatusIcon(task.status)"
                  :color="getStatusColor(task.status)"
                  size="20px"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ task.title }}

                  <q-badge
                    :color="getStatusColor(task.status)"
                    class="q-ml-sm"
                    size="sm"
                  >
                    {{ getStatusLabel(task.status) }}
                  </q-badge>

                  <q-badge
                    v-if="task.hasFlow"
                    color="info"
                    class="q-ml-sm"
                    size="sm"
                  >
                    <q-icon name="route" size="12px" class="q-mr-xs" />
                    Flow
                  </q-badge>
                </q-item-label>

                <q-item-label caption class="text-grey-6">
                  {{ task.description || 'Sin descripción' }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  v-if="canEdit"
                  icon="delete"
                  flat
                  round
                  dense
                  size="sm"
                  color="negative"
                  @click.stop="confirmDelete(task.id)"
                >
                  <q-tooltip>
                    Eliminar tarea
                  </q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Sin tareas -->
        <div
          v-else
          class="column items-center justify-center q-pa-xl text-grey-6"
        >
          <q-icon
            name="assignment"
            size="42px"
            color="grey-5"
          />

          <div class="text-body2 q-mt-sm">
            No hay tareas en la evaluación
          </div>

          <q-btn
            v-if="canEdit"
            flat
            color="primary"
            label="Agregar tareas del proyecto"
            icon="add"
            class="q-mt-sm"
            @click="openTaskSelector"
          />
        </div>

        <!-- Dialog: Selector de Tareas del Proyecto -->
        <q-dialog
          v-model="showTaskSelector"
          persistent
        >
          <q-card style="width: 800px; max-width: 90vw;">
            <q-card-section class="bg-primary text-white">
              <div class="text-subtitle1 text-weight-medium">
                Seleccionar Tareas del Proyecto
              </div>

              <div class="text-caption q-mt-xs">
                Selecciona las tareas que deseas agregar a la evaluación
                cognitiva
              </div>
            </q-card-section>

            <q-card-section>
              <!-- Buscador -->
              <q-input
                v-model="searchQuery"
                placeholder="Buscar tareas..."
                dense
                outlined
                clearable
                class="q-mb-md"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>

              <!-- Cantidad -->
              <div class="text-caption text-grey-6 q-mb-sm">
                {{ projectTasksList.length }}
                tareas disponibles en el proyecto
              </div>

              <!-- Loading -->
              <div
                v-if="loadingProjectTasks"
                class="column items-center justify-center q-pa-xl"
              >
                <q-spinner
                  color="primary"
                  size="40px"
                />

                <div class="text-caption text-grey-6 q-mt-sm">
                  Cargando tareas...
                </div>
              </div>

              <!-- Sin tareas -->
              <div
                v-else-if="projectTasksList.length === 0"
                class="column items-center justify-center q-pa-xl text-grey-6"
              >
                <q-icon
                  name="inbox"
                  size="40px"
                  color="grey-5"
                />

                <div class="text-body2 q-mt-sm">
                  No hay tareas disponibles en este proyecto
                </div>
              </div>

              <!-- Lista -->
              <div
                v-else
                style="max-height: 380px; overflow-y: auto;"
              >
                <q-list bordered separator class="rounded-borders">
                  <q-item
                    v-for="task in filteredProjectTasks"
                    :key="task.taskId"
                    clickable
                  >
                    <q-item-section avatar>
                      <q-checkbox
                        v-model="selectedProjectTasks"
                        :val="task"
                        color="primary"
                        :disable="isTaskAlreadyInEvaluation(task)"
                      />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        {{ task.title }}

                        <q-badge
                          v-if="isTaskAlreadyInEvaluation(task)"
                          color="positive"
                          size="sm"
                          class="q-ml-sm"
                        >
                          Ya agregada
                        </q-badge>
                      </q-item-label>

                      <q-item-label caption class="text-grey-6">
                        {{ task.description || 'Sin descripción' }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <div class="text-caption text-grey-6">
                        #{{ task.orderIndex }}
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Selección -->
              <div class="row items-center q-mt-md">
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  label="Seleccionar todas"
                  @click="selectAllTasks"
                />

                <q-btn
                  flat
                  dense
                  size="sm"
                  color="grey-7"
                  label="Deseleccionar todas"
                  @click="deselectAllTasks"
                />

                <q-space />

                <div class="text-caption text-grey-6">
                  {{ selectedProjectTasks.length }} seleccionadas
                </div>
              </div>
            </q-card-section>

            <q-card-actions
              align="right"
              class="q-pa-md"
            >
              <q-btn
                flat
                label="Cancelar"
                @click="closeTaskSelector"
              />

              <q-btn
                color="primary"
                label="Agregar Seleccionadas"
                icon="add"
                unelevated
                :loading="addingTasks"
                :disable="selectedProjectTasks.length === 0"
                @click="addSelectedTasks"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-tab-panel>

      <!-- ============================================================ -->
      <!-- TAB 2: GRABAR FLUJO IDEAL                                    -->
      <!-- ============================================================ -->
      <q-tab-panel name="flow">
        <div
          v-if="!selectedTaskForFlow"
          class="column items-center justify-center q-pa-xl text-grey-6"
        >
          <q-icon
            name="route"
            size="48px"
            color="grey-5"
          />

          <div class="text-body1 q-mt-md text-weight-medium">
            Selecciona una tarea para grabar su flujo ideal
          </div>

          <div class="text-caption text-grey-6 q-mt-xs text-center">
            El flujo ideal representa los pasos que un evaluador debe seguir
            en el prototipo.
          </div>

          <div
            class="q-mt-lg"
            style="width: 100%; max-width: 420px;"
          >
            <q-select
              v-model="selectedTaskForFlow"
              :options="tasksWithFlowStatus"
              option-label="label"
              option-value="value"
              label="Seleccionar Tarea"
              outlined
              dense
              emit-value
              map-options
            />

            <div class="text-caption text-grey-6 q-mt-sm">
              <span
                v-if="
                  selectedTaskForFlow &&
                  getTaskFlowStatus(selectedTaskForFlow)
                "
              >
                {{ getTaskFlowStatus(selectedTaskForFlow) }}
              </span>
            </div>
          </div>
        </div>

        <div v-else>
          <TaskFlowRecorder
            :key="selectedTaskForFlow"
            :task="getSelectedTask()"
            :project-id="projectId"
            :file-key="fileKey"
            @flow-created="onFlowCreated"
            @flow-updated="loadFlows"
          />

          <div class="q-mt-md text-center">
            <q-btn
              flat
              color="primary"
              icon="arrow_back"
              label="Cambiar tarea"
              size="sm"
              @click="selectedTaskForFlow = null"
            />
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>
```


<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import TaskFlowRecorder from './TaskFlowRecorder.vue'
import { useFlowApi } from '@/composables/useFlowApi'

const props = defineProps<{
  tasks: any[]           // Tareas ya en la evaluación
  projectTasks: any[]    // Tareas del proyecto
  evaluationId?: string
  projectId?: string
  fileKey?: string
  canEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-tasks', tasks: any[]): void
  (e: 'delete', id: string): void
  (e: 'task-selected', task: any): void
}>()

const $q = useQuasar()
const flowApi = useFlowApi()

// ============================================================
// STATE
// ============================================================
const taskTab = ref('list')
const showTaskSelector = ref(false)
const loadingProjectTasks = ref(false)
const addingTasks = ref(false)
const searchQuery = ref('')
const selectedProjectTasks = ref<any[]>([])
const selectedTaskForFlow = ref<string | null>(null)
const flowsMap = ref<Record<string, any>>({})
const loadingFlows = ref(false)

// ============================================================
// COMPUTED
// ============================================================
const projectTasksList = computed(() => {
  if (!props.projectTasks) return []
  if (Array.isArray(props.projectTasks)) return props.projectTasks
  return Array.from(props.projectTasks as any) || []
})

const sortedTasks = computed(() => {
  if (!props.tasks) return []
  return [...props.tasks].sort((a, b) => a.orderIndex - b.orderIndex)
})

const filteredProjectTasks = computed(() => {
  const tasks = projectTasksList.value
  if (!searchQuery.value) return tasks
  return tasks.filter(task =>
    task.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const tasksWithFlowStatus = computed(() => {
  return (props.tasks || []).map(task => {
    const hasFlow = !!flowsMap.value[task.id]
    const flow = flowsMap.value[task.id]
    const status = flow?.status === 'completed' ? '✅ Completado' : 
                   flow?.status === 'in_progress' ? '⏳ En progreso' : '❌ Sin flujo'
    return {
      label: `${task.title} ${hasFlow ? `(${status})` : ''}`,
      value: task.id
    }
  })
})

// ============================================================
// METHODS
// ============================================================
const isTaskSelected = (task: any) => {
  return selectedProjectTasks.value.some(t => t.taskId === task.taskId)
}

const isTaskAlreadyInEvaluation = (task: any) => {
  if (!props.tasks) return false
  return props.tasks.some(t => t.projectTaskId === task.taskId)
}

const selectAllTasks = () => {
  const availableTasks = filteredProjectTasks.value.filter(
    task => !isTaskAlreadyInEvaluation(task)
  )
  selectedProjectTasks.value = availableTasks
}

const deselectAllTasks = () => {
  selectedProjectTasks.value = []
}

const openTaskSelector = () => {
  selectedProjectTasks.value = []
  searchQuery.value = ''
  showTaskSelector.value = true
}

const closeTaskSelector = () => {
  showTaskSelector.value = false
  selectedProjectTasks.value = []
  searchQuery.value = ''
}

const addSelectedTasks = async () => {
  if (selectedProjectTasks.value.length === 0) return

  addingTasks.value = true
  try {
    const tasksToAdd = selectedProjectTasks.value.filter(
      task => !isTaskAlreadyInEvaluation(task)
    )

    if (tasksToAdd.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Todas las tareas seleccionadas ya están en la evaluación'
      })
      return
    }

    emit('add-tasks', tasksToAdd)
    closeTaskSelector()
  } catch (error) {
    console.error('Error al agregar tareas:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al agregar tareas'
    })
  } finally {
    addingTasks.value = false
  }
}

const selectTask = (task: any) => {
  emit('task-selected', task)
  if (flowsMap.value[task.id]) {
    selectedTaskForFlow.value = task.id
    taskTab.value = 'flow'
  }
}

const getSelectedTask = () => {  
  console.log("lo nadie sae s que amo a lupe :", props.tasks?.find(t => t.id === selectedTaskForFlow.value) || null)

  return props.tasks?.find(t => t.id === selectedTaskForFlow.value) || null
}

const getTaskFlowStatus = (taskId: string) => {
  const flow = flowsMap.value[taskId]
  if (!flow) return '❌ Sin flujo'
  if (flow.status === 'completed') return '✅ Flujo completado'
  if (flow.status === 'in_progress') return '⏳ Flujo en progreso'
  return '❌ Sin flujo'
}

const confirmDelete = (id: string) => {
  $q.dialog({
    title: 'Eliminar Tarea',
    message: '¿Estás seguro de eliminar esta tarea de la evaluación?',
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: 'Cancelar',
  }).onOk(() => {
    emit('delete', id)
  })
}

// ============================================================
// FLOW METHODS
// ============================================================
const loadFlows = async () => {
  if (!props.tasks || props.tasks.length === 0) return

  loadingFlows.value = true
  try {
    const newFlowsMap: Record<string, any> = {}
    for (const task of props.tasks) {
      try {
        const flows = await flowApi.getFlows(task.id)
        if (flows && flows.length > 0) {
          newFlowsMap[task.id] = flows[0]
          // Si hay un flujo completado y estamos en la pestaña de flow, seleccionarlo
          if (flows[0].status === 'completed' && !selectedTaskForFlow.value) {
            selectedTaskForFlow.value = task.id
          }
        }
      } catch (error) {
        console.error(`Error loading flow for task ${task.id}:`, error)
      }
    }
    flowsMap.value = newFlowsMap
  } finally {
    loadingFlows.value = false
  }
}

const onFlowCreated = (flow: any) => {
  flowsMap.value[flow.taskId] = flow
  $q.notify({
    type: 'positive',
    message: 'Flujo creado. Comienza a grabar los pasos en el prototipo.'
  })
}

// ============================================================
// WATCHERS
// ============================================================
watch(() => props.tasks, () => {
  loadFlows()
}, { deep: true, immediate: true })

// ============================================================
// STYLES
// ============================================================
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'grey',
    in_progress: 'blue',
    completed: 'positive',
    failed: 'negative'
  }
  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completada',
    failed: 'Fallida'
  }
  return labels[status] || status
}

const getStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    pending: 'pending',
    in_progress: 'play_circle',
    completed: 'check_circle',
    failed: 'error'
  }
  return icons[status] || 'circle'
}
</script>