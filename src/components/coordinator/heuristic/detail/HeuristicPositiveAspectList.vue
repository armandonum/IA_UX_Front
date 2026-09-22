<!-- components/coordinador/heuristic/detail/HeuristicPositiveAspectList.vue -->
<template>
  <div>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon name="thumb_up" color="positive" size="24px" class="q-mr-sm" />
      <div>
        <div class="text-subtitle1 text-weight-medium">
          Aspectos Positivos
        </div>
        <div class="text-caption text-grey-6">
          {{ positiveAspects.length }} elemento(s) positivo(s)
        </div>
      </div>
      <q-space />

      <q-input
        v-model="searchQuery"
        placeholder="Buscar..."
        dense
        outlined
        clearable
        style="min-width: 200px"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Banner informativo -->
    <q-banner
      v-if="positiveAspects.length > 0"
      rounded
      class="bg-green-1 text-positive q-mb-md"
    >
      <template v-slot:avatar>
        <q-icon name="lightbulb" color="positive" />
      </template>
      <div class="text-caption">
        Estos elementos deben mantenerse y reforzarse en futuras versiones.
      </div>
    </q-banner>

    <!-- Sin datos -->
    <div
      v-if="positiveAspects.length === 0"
      class="text-center q-py-lg text-grey-6"
    >
      <q-icon name="thumb_up_off_alt" size="48px" />
      <div class="q-mt-sm">Sin aspectos positivos registrados</div>
    </div>

    <!-- Sin resultados -->
    <div
      v-else-if="filteredAspects.length === 0"
      class="text-center q-py-lg text-grey-6"
    >
      <q-icon name="search_off" size="48px" />
      <div class="q-mt-sm">No hay resultados</div>
    </div>

    <!-- Lista -->
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
              <q-space />
              <div class="text-caption text-grey-5">
                {{ formatDate(aspect.createdAt) }}
              </div>
            </div>

            <div class="text-body2">
              {{ aspect.description }}
            </div>

            <div
              v-if="aspect.taskId"
              class="text-caption text-grey-6 q-mt-sm"
            >
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
  HeuristicTask,
} from '@/api/heuristic.api'

const props = defineProps<{
  positiveAspects: HeuristicPositiveAspect[]
  tasks: HeuristicTask[]
}>()

defineEmits<{
  (e: 'seek', ms: number): void
}>()

const searchQuery = ref('')

const filteredAspects = computed(() => {
  if (!searchQuery.value.trim()) return props.positiveAspects
  const query = searchQuery.value.toLowerCase().trim()
  return props.positiveAspects.filter(a =>
    a.description.toLowerCase().includes(query),
  )
})

function getTaskTitle(taskId: string | null): string {
  if (!taskId) return '—'
  return props.tasks.find(t => t.id === taskId)?.title || '—'
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-BO', {
    day: '2-digit',
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