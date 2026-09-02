<!-- components/experto/heuristic/HeuristicTaskList.vue -->

<template>
  <q-dialog :model-value="show" persistent>
    <q-card style="min-width: 550px; max-width: 90vw;">
      <q-card-section>
        <div class="text-h6">Tareas del proyecto</div>
        <div class="text-caption text-grey-6">
          Selecciona una tarea para evaluar. Las tareas revisadas se marcarán como completadas.
        </div>
        <div class="text-caption text-primary q-mt-xs">
          Sesión activa: {{ sessionId ? '✅ Grabando' : '⏳ Sin sesión' }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="max-h-64 overflow-y-auto">
        <div v-if="loadingTasks" class="text-center q-py-md">
          <q-spinner color="primary" size="32px" />
          <div class="text-caption text-grey-6 q-mt-sm">Cargando tareas...</div>
        </div>

        <div v-else-if="tasks.length === 0" class="text-center text-grey-6 q-py-md">
          Este proyecto no tiene tareas asignadas
        </div>

        <div
          v-for="task in tasks"
          :key="task.taskId"
          class="q-px-sm q-py-xs rounded q-mb-xs border"
          :class="[
            task.reviewed ? 'border-green-500 bg-green-50' : 'border-transparent hover:border-primary hover:bg-grey-1',
            task.reviewed ? 'cursor-default' : 'cursor-pointer'
          ]"
          @click="task.reviewed ? null : seleccionarTarea(task)"
        >
          <div class="row items-center">
            <div class="col">
              <div class="row items-center q-gutter-sm">
                <div class="text-sm text-weight-medium">{{ task.title || task.description }}</div>
                <q-chip
                  v-if="task.reviewed"
                  color="positive"
                  text-color="white"
                  size="sm"
                  icon="check_circle"
                >
                  Revisada
                </q-chip>
                <q-chip
                  v-else-if="task.inProgress"
                  color="warning"
                  text-color="white"
                  size="sm"
                  icon="play_arrow"
                >
                  En evaluación
                </q-chip>
              </div>
              <div class="text-xs text-grey-6 q-mt-xs">{{ task.description }}</div>
            </div>
            <q-icon
              v-if="!task.reviewed"
              name="arrow_forward"
              color="primary"
              size="20px"
              class="q-ml-sm"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          v-if="tareasPendientes === 0 && sessionId"
          unelevated
          color="positive"
          label="Finalizar evaluación"
          icon="check"
          @click="$emit('finish-session')"
        />
        <q-btn
          v-else
          flat
          label="Cerrar"
          @click="$emit('close')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types/usability'

interface TaskWithStatus extends Task {
  reviewed: boolean
  inProgress: boolean
}

const props = defineProps<{
  show: boolean
  tasks: TaskWithStatus[]
  loadingTasks: boolean
  sessionId: string | null
}>()

const emit = defineEmits<{
  (e: 'select-task', task: TaskWithStatus): void
  (e: 'close'): void
  (e: 'finish-session'): void
}>()

const tareasPendientes = computed(() => {
  return props.tasks.filter(t => !t.reviewed).length
})

function seleccionarTarea(task: TaskWithStatus) {
  if (task.reviewed) return
  emit('select-task', task)
}
</script>