<template>
  <q-dialog :model-value="show" persistent>
    <q-card style="min-width: 550px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Tareas de la Evaluación</div>
        <div class="text-caption text-grey-6">
          Selecciona una tarea para evaluar. Las tareas revisadas se marcarán como completadas.
        </div>
        <div class="text-caption text-primary q-mt-xs">
          Sesión activa: {{ sessionId ? '✅ Grabando' : '⏳ Sin sesión' }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-py-md" style="max-height: 60vh; overflow-y: auto">
        <!-- Loading -->
        <div v-if="loadingTasks" class="text-center q-py-md">
          <q-spinner color="primary" size="32px" />
          <div class="text-caption text-grey-6 q-mt-sm">Cargando tareas...</div>
        </div>

        <!-- Sin tareas -->
        <div v-else-if="tasks.length === 0" class="text-center q-py-lg">
          <q-icon name="inbox" size="48px" color="grey-5" />
          <div class="text-grey-6 q-mt-sm">
            Esta evaluación no tiene tareas asignadas
          </div>
        </div>

        <!-- Lista de tareas -->
        <q-list v-else separator>
          <q-item
            v-for="task in sortedTasks"
            :key="task.taskId"
            clickable
            :disable="task.reviewed"
            :class="[
              task.reviewed ? 'bg-green-1' : '',
              task.inProgress ? 'bg-orange-1' : '',
            ]"
            @click="task.reviewed ? null : seleccionarTarea(task)"
          >
            <q-item-section avatar>
              <q-avatar
                :color="task.reviewed ? 'positive' : task.inProgress ? 'warning' : 'primary'"
                text-color="white"
                size="36px"
              >
                <q-icon
                  :name="task.reviewed ? 'check' : task.inProgress ? 'play_arrow' : 'task'"
                  size="20px"
                />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ task.title }}
              </q-item-label>
              <q-item-label v-if="task.description" caption>
                {{ task.description }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-xs">
                <q-chip
                  v-if="task.reviewed"
                  color="positive"
                  text-color="white"
                  size="sm"
                  icon="check_circle"
                >
                  Completada
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
                <q-icon
                  v-else
                  name="arrow_forward"
                  color="primary"
                  size="20px"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          v-if="tareasPendientes === 0 && sessionId"
          unelevated
          color="positive"
          icon="check"
          label="Finalizar evaluación"
          @click="$emit('finish-session')"
        />
        <q-btn flat label="Cerrar" @click="$emit('close')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TaskWithStatus {
  taskId: string
  title: string
  description: string
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

const sortedTasks = computed(() => props.tasks)

const tareasPendientes = computed(
  () => props.tasks.filter(t => !t.reviewed).length,
)

function seleccionarTarea(task: TaskWithStatus) {
  if (task.reviewed) return
  emit('select-task', task)
}
</script>

<style scoped>
.bg-green-1 {
  background-color: #e8f5e9 !important;
}
.bg-orange-1 {
  background-color: #fff3e0 !important;
}
</style>