<!-- components/tasks/TaskForm.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 600px; max-width: 800px;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Agregar Tareas a la Evaluación</div>
        <div class="text-subtitle2">Selecciona tareas del proyecto para la evaluación</div>
      </q-card-section>

      <q-card-section>
        <div class="text-sm text-slate-500 q-mb-md">
          Tareas disponibles del proyecto ({{ projectTasks.length }})
        </div>

        <q-list bordered separator class="rounded-lg">
          <q-item
            v-for="task in projectTasks"
            :key="task.taskId"
            class="hover:bg-slate-700 transition-colors"
          >
            <q-item-section avatar>
              <q-checkbox
                v-model="selectedTasks"
                :val="task"
                color="primary"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ task.title }}</q-item-label>
              <q-item-label caption class="text-slate-500">
                {{ task.description || 'Sin descripción' }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-badge color="info" size="sm">
                ID: {{ task.orderIndex }}
              </q-badge>
            </q-item-section>
          </q-item>

          <q-item v-if="projectTasks.length === 0">
            <q-item-section class="text-center py-4">
              <q-icon name="info" size="32px" color="grey-6" />
              <p class="text-grey-6 mt-2">No hay tareas disponibles en este proyecto</p>
            </q-item-section>
          </q-item>
        </q-list>

        <div class="q-mt-md">
          <q-input
            v-model="userGoalPrefix"
            label="Prefijo para Objetivo del Usuario (opcional)"
            filled
            dense
            placeholder="Ej: El usuario debe..."
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup @click="close" />
        <q-btn
          color="primary"
          label="Agregar Tareas"
          :loading="loading"
          :disable="selectedTasks.length === 0"
          @click="save"
        />
        <span class="text-xs text-slate-500 q-ml-sm">
          {{ selectedTasks.length }} seleccionadas
        </span>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  evaluationId?: string
  projectTasks: any[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const selectedTasks = ref<any[]>([])
const userGoalPrefix = ref('')

const save = async () => {
  if (selectedTasks.value.length === 0) return

  loading.value = true
  try {
    const tasks = selectedTasks.value.map((task, index) => ({
      projectTaskId: task.taskId,
      title: task.title,
      description: task.description || '',
      userGoal: userGoalPrefix.value ? `${userGoalPrefix.value} ${task.title}` : task.title,
      orderIndex: task.orderIndex || index + 1
    }))

    emit('save', {
      evaluationId: props.evaluationId,
      tasks
    })
    close()
  } finally {
    loading.value = false
  }
}

const close = () => {
  visible.value = false
  selectedTasks.value = []
  userGoalPrefix.value = ''
}
</script>