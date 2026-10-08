<!-- components/docente/heuristics/detail/PositiveAspectsViewer.vue -->
<template>
  <div>
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle2 text-weight-bold">
           Aspectos positivos ({{ aspects.length }})
        </div>
        <div class="text-caption text-grey-6">
          Cosas que funcionan bien según los evaluadores
        </div>
      </div>

      <q-btn
        flat
        color="primary"
        icon="refresh"
        label="Actualizar"
        :loading="loading"
        @click="$emit('reload')"
      />
    </div>

    <!-- ============================================================ -->
    <!-- STATS                                                         -->
    <!-- ============================================================ -->
    <div v-if="aspects.length" class="row q-col-gutter-md q-mb-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm">
          <div class="text-h5 text-positive text-weight-bold">
            {{ aspects.length }}
          </div>
          <div class="text-caption text-grey-7">Total</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm">
          <div class="text-h5 text-primary text-weight-bold">
            {{ uniqueEvaluators }}
          </div>
          <div class="text-caption text-grey-7">Evaluadores</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm">
          <div class="text-h5 text-info text-weight-bold">
            {{ aspectsWithTasks }}
          </div>
          <div class="text-caption text-grey-7">Con tarea</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm">
          <div class="text-h5 text-grey-7 text-weight-bold">
            {{ recentCount }}
          </div>
          <div class="text-caption text-grey-7">Últimos 7 días</div>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- FILTROS                                                       -->
    <!-- ============================================================ -->
    <q-card v-if="aspects.length" flat bordered class="q-mb-md">
      <q-card-section class="q-py-sm">
        <div class="row items-center q-gutter-md">
          <q-input
            v-model="searchText"
            dense
            outlined
            placeholder="Buscar..."
            style="min-width: 250px;"
          >
            <template v-slot:prepend>
              <q-icon name="search" size="sm" />
            </template>
            <template v-slot:append v-if="searchText">
              <q-icon name="close" size="sm" class="cursor-pointer" @click="searchText = ''" />
            </template>
          </q-input>

          <q-select
            v-model="filterEvaluator"
            :options="evaluatorOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            dense
            outlined
            label="Evaluador"
            clearable
            style="min-width: 200px;"
          />

          <q-select
            v-model="filterTask"
            :options="taskOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            dense
            outlined
            label="Tarea"
            clearable
            style="min-width: 200px;"
          />

          <q-space />

          <q-btn
            v-if="hasActiveFilters"
            flat
            dense
            color="primary"
            icon="clear"
            label="Limpiar"
            @click="clearFilters"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- LOADING / EMPTY                                               -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="32px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando aspectos...</div>
    </div>

    <div
      v-else-if="!aspects.length"
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="thumb_up" size="48px" />
      <div class="text-h6 q-mt-sm">Sin aspectos positivos</div>
      <div class="text-caption">
        Los evaluadores aún no han registrado aspectos positivos
      </div>
    </div>

    <div
      v-else-if="!filteredAspects.length"
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="search_off" size="48px" />
      <div class="text-h6 q-mt-sm">Sin resultados</div>
      <div class="text-caption q-mb-md">
        Ajusta los filtros para ver más aspectos
      </div>
      <q-btn flat color="primary" icon="clear" label="Limpiar filtros" @click="clearFilters" />
    </div>

    <!-- ============================================================ -->
    <!-- GRID                                                          -->
    <!-- ============================================================ -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="aspect in filteredAspects"
        :key="aspect.aspectId"
        class="col-12 col-md-6"
      >
        <q-card flat bordered class="positive-card full-height column">
          <q-card-section>
            <div class="row items-start no-wrap q-gutter-sm">
              <!-- Icono -->
              <q-avatar
                color="positive"
                text-color="white"
                size="44px"
              >
                <q-icon name="thumb_up" size="22px" />
              </q-avatar>

              <!-- Contenido -->
              <div class="col">
                <div class="text-body2 q-mb-sm">
                  {{ aspect.description }}
                </div>

                <!-- Metadata -->
                <div class="row items-center q-gutter-md text-caption text-grey-6">
                  <div class="row items-center">
                    <q-icon name="person" size="12px" class="q-mr-xs" />
                    {{ getEvaluatorName(aspect.evaluatorId) }}
                  </div>
                  <div v-if="aspect.taskId" class="row items-center">
                    <q-icon name="assignment" size="12px" class="q-mr-xs" />
                    {{ getTaskTitle(aspect.taskId) }}
                  </div>
                  <div class="row items-center">
                    <q-icon name="schedule" size="12px" class="q-mr-xs" />
                    {{ formatDate(aspect.createdAt) }}
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDocenteStore } from '@/stores/docente.stores'
import type {
  HeuristicPositiveAspect,
  HeuristicEvaluator,
  HeuristicTask,
} from '@/api/heuristic.api'

const props = defineProps<{
  aspects: HeuristicPositiveAspect[]
  evaluators: HeuristicEvaluator[]
  tasks: HeuristicTask[]
  loading?: boolean
}>()

defineEmits<{ (e: 'reload'): void }>()

const docenteStore = useDocenteStore()

// ============================================================
// STATE
// ============================================================
const searchText = ref('')
const filterEvaluator = ref<string | null>(null)
const filterTask = ref<string | null>(null)

// ============================================================
// COMPUTED
// ============================================================
const uniqueEvaluators = computed(
  () => new Set(props.aspects.map((a) => a.evaluatorId)).size,
)

const aspectsWithTasks = computed(
  () => props.aspects.filter((a) => a.taskId).length,
)

const recentCount = computed(() => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return props.aspects.filter(
    (a) => new Date(a.createdAt).getTime() > sevenDaysAgo,
  ).length
})

const evaluatorOptions = computed(() => {
  const usedIds = new Set(props.aspects.map((a) => a.evaluatorId))
  return props.evaluators
    .filter((e) => usedIds.has(e.userId))
    .map((e) => ({
      label: getUserName(e.userId),
      value: e.userId,
    }))
})

const taskOptions = computed(() => {
  const usedIds = new Set(props.aspects.map((a) => a.taskId).filter(Boolean))
  return props.tasks
    .filter((t) => usedIds.has(t.id))
    .map((t) => ({
      label: `#${t.orderIndex} ${t.title}`,
      value: t.id,
    }))
})

const filteredAspects = computed(() => {
  let result = [...props.aspects]

  // Filtro por texto
  if (searchText.value.trim()) {
    const q = searchText.value.toLowerCase().trim()
    result = result.filter((a) => a.description.toLowerCase().includes(q))
  }

  // Filtro por evaluador
  if (filterEvaluator.value) {
    result = result.filter((a) => a.evaluatorId === filterEvaluator.value)
  }

  // Filtro por tarea
  if (filterTask.value) {
    result = result.filter((a) => a.taskId === filterTask.value)
  }

  // Ordenar por fecha descendente
  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return result
})

const hasActiveFilters = computed(
  () => !!searchText.value.trim() || !!filterEvaluator.value || !!filterTask.value,
)

// ============================================================
// HELPERS
// ============================================================
function getUserName(userId: string): string {
  const user = docenteStore.students.find((s: any) => s.user_id === userId)
  return user?.display_name || `Usuario ${userId.substring(0, 8)}`
}

function getEvaluatorName(evaluatorId: string): string {
  return getUserName(evaluatorId)
}

function getTaskTitle(taskId: string): string {
  const task = props.tasks.find((t) => t.id === taskId)
  return task ? `#${task.orderIndex} ${task.title}` : '—'
}

function formatDate(date: string): string {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return date
  }
}

function clearFilters() {
  searchText.value = ''
  filterEvaluator.value = null
  filterTask.value = null
}
</script>

<style scoped>
.positive-card {
  transition: all 0.2s ease;
  border-radius: 12px;
  border-left: 4px solid #22c55e;
  height: 100%;
}

.positive-card:hover {
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
  transform: translateY(-2px);
}
</style>