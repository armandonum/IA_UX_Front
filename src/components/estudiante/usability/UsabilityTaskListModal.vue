<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div class="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
      <h2 class="text-xl font-semibold mb-1">Tareas de la evaluación</h2>
      <p class="text-sm text-gray-500 mb-4">
        {{ completedCount }} de {{ tasks.length }} completadas. Selecciona la siguiente tarea para continuar.
      </p>

      <div v-if="loading" class="py-10 text-center text-gray-500">Cargando tareas…</div>

      <ul v-else class="space-y-2">
        <li
          v-for="task in tasksOrdenadas"
          :key="task.taskId"
          class="flex items-center justify-between rounded-lg border px-4 py-3"
          :class="isCompleted(task) ? 'border-green-200 bg-green-50' : 'border-gray-200'"
        >
          <div>
            <p class="font-medium" :class="isCompleted(task) ? 'text-green-700' : 'text-gray-800'">
              <span v-if="isCompleted(task)">✅ </span>{{ task.title }}
            </p>
            <p class="text-sm text-gray-500">{{ task.description }}</p>
          </div>

          <button
            v-if="!isCompleted(task)"
            class="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="$emit('seleccionar-tarea', task)"
          >
            Iniciar
          </button>
          <span v-else class="shrink-0 text-sm text-green-600">Completada</span>
        </li>
      </ul>

      <p v-if="!loading && tasks.length === 0" class="text-center text-gray-500 py-6">
        Este proyecto no tiene tareas configuradas.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types/usability'

const props = defineProps<{
  show: boolean
  tasks: Task[]
  completedTaskIds: Set<string>
  loading?: boolean
}>()

defineEmits<{
  (e: 'seleccionar-tarea', task: Task): void
}>()
console.log("lista de tareas :", props.tasks)
const tasksOrdenadas = computed(() =>
  [...props.tasks].sort((a, b) => a.order_index - b.order_index)
)

const completedCount = computed(() => props.completedTaskIds.size)

function isCompleted(task: Task) {
  return props.completedTaskIds.has(task.taskId)
}
</script>