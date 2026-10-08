<!-- components/docente/heuristics/detail/EvaluationTasksManager.vue -->
<template>
  <div>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle2 text-weight-bold">
          📝 Tareas de la evaluación ({{ tasks.length }})
        </div>
        <div class="text-caption text-grey-6">
          Los evaluadores ejecutarán estas tareas durante la sesión
        </div>
      </div>

      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Nueva tarea"
        @click="openCreateDialog"
      />
    </div>

    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="32px" />
    </div>

    <div v-else-if="!tasks.length" class="text-center q-py-xl text-grey-6">
      <q-icon name="assignment" size="48px" />
      <div class="text-h6 q-mt-sm">Sin tareas</div>
      <div class="text-caption q-mb-md">
        Agrega la primera tarea que los evaluadores deberán completar
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Crear primera tarea"
        @click="openCreateDialog"
      />
    </div>

    <q-list v-else bordered separator>
      <q-item v-for="(task, index) in sortedTasks" :key="task.id">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white" size="32px">
            {{ index + 1 }}
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ task.title }}
            <q-badge
              :color="getTaskStatusColor(task.status)"
              text-color="white"
              :label="getTaskStatusLabel(task.status)"
              class="q-ml-sm"
            />
          </q-item-label>
          <q-item-label caption>{{ task.description }}</q-item-label>
          <q-item-label v-if="task.userGoal" caption>
            🎯 Meta: {{ task.userGoal }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="row items-center q-gutter-xs">
            <q-btn
              flat
              dense
              round
              icon="edit"
              color="primary"
              size="sm"
              @click="openEditDialog(task)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              size="sm"
              @click="confirmDelete(task)"
            >
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- ============================================================ -->
    <!-- DIALOG                                                        -->
    <!-- ============================================================ -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 550px; max-width: 650px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            {{ editingTask ? 'Editar tarea' : 'Nueva tarea' }}
          </div>
        </q-card-section>

        <q-form @submit.prevent="onSubmit">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="form.title"
              filled
              label="Título de la tarea *"
              placeholder="Ej: Registro con correo electrónico"
              :rules="[(v) => !!v || 'El título es requerido']"
              autofocus
            />

            <q-input
              v-model="form.description"
              filled
              type="textarea"
              autogrow
              label="Descripción *"
              placeholder="Ej: El usuario debe completar el formulario de registro"
              :rules="[(v) => !!v || 'La descripción es requerida']"
              :rows="3"
            />

            <q-input
              v-model="form.userGoal"
              filled
              type="textarea"
              autogrow
              label="Meta del usuario (opcional)"
              placeholder="Ej: Contar con un registro de usuarios y perfiles"
              :rows="2"
            />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model.number="form.orderIndex"
                  filled
                  type="number"
                  label="Orden"
                  :min="1"
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="form.status"
                  :options="statusOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  filled
                  label="Estado"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" @click="dialogOpen = false" />
            <q-btn
              unelevated
              color="primary"
              type="submit"
              :label="editingTask ? 'Actualizar' : 'Crear'"
              :loading="saving"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useHeuristicEvaluationDetail } from '@/composables/docente/useHeuristicEvaluationDetail'
import type { HeuristicTask } from '@/api/heuristic.api'

const props = defineProps<{
  evaluationId: string
  tasks: HeuristicTask[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'created'): void
  (e: 'updated'): void
  (e: 'removed'): void
}>()

const $q = useQuasar()

const { createTask, updateTask, removeTask } = useHeuristicEvaluationDetail()

// ============================================================
// STATE
// ============================================================
const dialogOpen = ref(false)
const editingTask = ref<HeuristicTask | null>(null)
const saving = ref(false)

const form = reactive({
  title: '',
  description: '',
  userGoal: '',
  orderIndex: 1,
  status: 'pending',
})

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completada', value: 'completed' },
  { label: 'Fallida', value: 'failed' },
]

// ============================================================
// COMPUTED
// ============================================================
const sortedTasks = computed(() =>
  [...props.tasks].sort((a, b) => a.orderIndex - b.orderIndex),
)

// ============================================================
// ACTIONS
// ============================================================
function openCreateDialog() {
  editingTask.value = null
  form.title = ''
  form.description = ''
  form.userGoal = ''
  form.orderIndex = props.tasks.length + 1
  form.status = 'pending'
  dialogOpen.value = true
}

function openEditDialog(task: HeuristicTask) {
  editingTask.value = task
  form.title = task.title
  form.description = task.description || ''
  form.userGoal = task.userGoal || ''
  form.orderIndex = task.orderIndex
  form.status = task.status
  dialogOpen.value = true
}

async function onSubmit() {
  saving.value = true
  try {
    if (editingTask.value) {
      await updateTask(editingTask.value.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        userGoal: form.userGoal?.trim() || null,
        orderIndex: form.orderIndex,
        status: form.status as any,
      })
      emit('updated')
    } else {
      await createTask({
        evaluationId: props.evaluationId,
        title: form.title.trim(),
        description: form.description.trim(),
        userGoal: form.userGoal?.trim() || null,
        orderIndex: form.orderIndex,
        status: form.status as any,
      })
      emit('created')
    }
    dialogOpen.value = false
  } catch (e) {
    // Error manejado
  } finally {
    saving.value = false
  }
}

function confirmDelete(task: HeuristicTask) {
  $q.dialog({
    title: 'Eliminar tarea',
    message: `¿Estás seguro de eliminar "${task.title}"?`,
    cancel: true,
    persistent: true,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true },
  }).onOk(async () => {
    try {
      await removeTask(task.id)
      emit('removed')
    } catch (e) {
      // Error manejado
    }
  })
}

// ============================================================
// HELPERS
// ============================================================
function getTaskStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completada',
    failed: 'Fallida',
  }
  return labels[status] || status
}

function getTaskStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'grey-6',
    in_progress: 'warning',
    completed: 'positive',
    failed: 'negative',
  }
  return colors[status] || 'grey'
}
</script>