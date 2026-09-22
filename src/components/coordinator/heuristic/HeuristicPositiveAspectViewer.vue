<template>
  <div class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon name="thumb_up" color="positive" size="28px" class="q-mr-sm" />
      <div>
        <div class="text-h6">Aspectos Positivos Identificados</div>
        <div class="text-caption text-grey-6">
          {{ positiveAspects.length }} aspecto(s) positivo(s) · Solo lectura
        </div>
      </div>
      <q-space />
      <q-input
        v-model="searchQuery"
        dense
        outlined
        placeholder="Buscar..."
        clearable
        style="width: 240px"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Banner informativo -->
    <q-banner rounded class="bg-green-1 text-positive q-mb-md" v-if="positiveAspects.length > 0">
      <template v-slot:avatar>
        <q-icon name="lightbulb" color="positive" />
      </template>
      <div class="text-caption">
        Estos elementos positivos deben mantenerse y reforzarse en futuras versiones del sistema.
      </div>
    </q-banner>

    <!-- Sin aspectos -->
    <div v-if="positiveAspects.length === 0" class="text-center q-py-xl">
      <q-icon name="thumb_up_off_alt" size="64px" color="grey-5" />
      <div class="text-grey-6 q-mt-md">
        Aún no hay aspectos positivos registrados
      </div>
      <div class="text-caption text-grey-5">
        Los evaluadores los registrarán durante la sesión
      </div>
    </div>

    <!-- Sin resultados -->
    <div v-else-if="filteredAspects.length === 0" class="text-center q-py-xl">
      <q-icon name="search_off" size="64px" color="grey-5" />
      <div class="text-grey-6 q-mt-md">No se encontraron resultados</div>
    </div>

    <!-- Lista de aspectos positivos -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="aspect in filteredAspects"
        :key="aspect.aspectId"
        class="col-12 col-md-6"
      >
        <q-card flat bordered class="border-left-green h-full">
          <q-card-section>
            <div class="row items-center q-gutter-sm q-mb-sm">
              <q-avatar color="positive" text-color="white" size="28px">
                <q-icon name="check" size="18px" />
              </q-avatar>
              <div class="text-caption text-grey-6">
                {{ getEvaluatorName(aspect.evaluatorId) }}
              </div>
              <q-space />
              <div class="text-caption text-grey-5">
                {{ formatDate(aspect.createdAt) }}
              </div>
            </div>

            <div class="text-body2">
              {{ aspect.description }}
            </div>

            <div v-if="aspect.taskId" class="text-caption text-grey-6 q-mt-sm">
              <q-icon name="task" size="12px" />
              Tarea: {{ getTaskTitle(aspect.taskId) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type {
  HeuristicPositiveAspect,
  HeuristicEvaluator,
  HeuristicTask,
} from '@/api/heuristic.api'

const props = defineProps<{
  positiveAspects: HeuristicPositiveAspect[]
  evaluators: HeuristicEvaluator[]
  tasks: HeuristicTask[]
}>()

const searchQuery = ref('')

const filteredAspects = computed(() => {
  if (!searchQuery.value.trim()) return props.positiveAspects

  const query = searchQuery.value.toLowerCase().trim()
  return props.positiveAspects.filter(a =>
    a.description.toLowerCase().includes(query),
  )
})

function getEvaluatorName(evaluatorId: string): string {
  return props.evaluators.find(e => e.userId === evaluatorId)?.userId || 'Evaluador'
}

function getTaskTitle(taskId: string): string {
  return props.tasks.find(t => t.id === taskId)?.title || '—'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.border-left-green {
  border-left: 4px solid #4caf50 !important;
}
.h-full {
  height: 100%;
}
.bg-green-1 {
  background-color: #e8f5e9;
}
</style>