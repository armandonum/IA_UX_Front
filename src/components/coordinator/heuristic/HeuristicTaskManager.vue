<template>
  <div class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon name="task" color="primary" size="28px" class="q-mr-sm" />
      <div>
        <div class="text-h6">Tareas de la Evaluación</div>
        <div class="text-caption text-grey-6">
          {{ tasks.length }} tarea(s) registrada(s)
        </div>
      </div>
      <q-space />
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="add"
        label="Agregar Tareas"
        unelevated
        @click="showAddDialog = true"
      />
    </div>

    <!-- Lista de tareas -->
    <div v-if="tasks.length === 0" class="text-center q-py-xl">
      <q-icon name="inbox" size="64px" color="grey-5" />
      <div class="text-grey-6 q-mt-md">
        No hay tareas asignadas a esta evaluación
      </div>
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="add"
        label="Agregar la primera tarea"
        unelevated
        class="q-mt-md"
        @click="showAddDialog = true"
      />
    </div>

    <q-list v-else separator class="rounded-borders border">
      <q-item v-for="(task, index) in sortedTasks" :key="task.id">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white" size="32px">
            {{ index + 1 }}
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ task.title }}
          </q-item-label>
          <q-item-label caption v-if="task.description">
            {{ task.description }}
          </q-item-label>
          <q-item-label caption v-if="task.userGoal">
            <q-icon name="flag" size="12px" />
            {{ task.userGoal }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="row items-center q-gutter-xs">
            <q-badge :color="getStatusColor(task.status)">
              {{ getStatusLabel(task.status) }}
            </q-badge>
            <q-btn
              v-if="canEdit"
              flat
              round
              dense
              icon="delete"
              color="negative"
              @click="confirmDelete(task)"
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- ============================================================ -->
    <!-- DIALOG: AGREGAR TAREAS                                        -->
    <!-- ============================================================ -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 600px; max-width: 90vw; max-height: 80vh">
        <q-card-section>
          <div class="text-h6">Agregar Tareas del Proyecto</div>
          <div class="text-caption text-grey-6">
            Selecciona las tareas que deseas incluir en la evaluación
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-py-md" style="max-height: 50vh; overflow-y: auto">
          <div v-if="availableProjectTasks.length === 0" class="text-center q-py-lg">
            <q-icon name="info" size="48px" color="grey-5" />
            <div class="text-grey-6 q-mt-sm">
              No hay tareas disponibles en el proyecto
            </div>
          </div>

          <q-list v-else separator>
            <q-item
              v-for="pt in availableProjectTasks"
              :key="pt.taskId"
              tag="label"
              clickable
            >
              <q-item-section avatar>
                <q-checkbox
                  v-model="selectedTaskIds"
                  :val="pt.taskId"
                  color="primary"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ pt.title }}
                </q-item-label>
                <q-item-label caption v-if="pt.description">
                  {{ pt.description }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="cancelAdd" />
          <q-btn
            color="primary"
            unelevated
            label="Agregar"
            :disable="selectedTaskIds.length === 0"
            @click="handleAddTasks"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import type { HeuristicTask } from '@/api/heuristic.api'

const props = defineProps<{
  tasks: HeuristicTask[]
  projectTasks: any[]
  evaluationId?: string
  canEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'add-tasks', tasks: any[]): void
  (e: 'delete', taskId: string): void
  (e: 'reorder', taskIds: string[]): void
}>()

const $q = useQuasar()

const showAddDialog = ref(false)
const selectedTaskIds = ref<string[]>([])

const sortedTasks = computed(() =>
  [...props.tasks].sort((a, b) => a.orderIndex - b.orderIndex),
)

// Tareas del proyecto que NO están ya en la evaluación
const availableProjectTasks = computed(() => {
  const existingTaskIds = new Set(props.tasks.map(t => t.projectTaskId).filter(Boolean))
  return props.projectTasks.filter(pt => !existingTaskIds.has(pt.taskId))
})

function handleAddTasks() {
  const selected = availableProjectTasks.value.filter(pt =>
    selectedTaskIds.value.includes(pt.taskId),
  )
  emit('add-tasks', selected)
  selectedTaskIds.value = []
  showAddDialog.value = false
}

function cancelAdd() {
  selectedTaskIds.value = []
  showAddDialog.value = false
}

function confirmDelete(task: HeuristicTask) {
  $q.dialog({
    title: 'Eliminar Tarea',
    message: `¿Eliminar la tarea "${task.title}"?`,
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: true,
    persistent: true,
  }).onOk(() => {
    emit('delete', task.id)
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'grey',
    in_progress: 'warning',
    completed: 'positive',
    failed: 'negative',
  }
  return colors[status] || 'grey'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completada',
    failed: 'Fallida',
  }
  return labels[status] || status
}
</script>