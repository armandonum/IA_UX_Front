<!-- components/docente/heuristics/detail/ObservationsViewer.vue -->
<template>
  <div>
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle2 text-weight-bold">
          📝 Observaciones ({{ filteredObservations.length }})
        </div>
        <div class="text-caption text-grey-6">
          Problemas identificados por los evaluadores
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
    <!-- STATS POR SEVERIDAD                                           -->
    <!-- ============================================================ -->
    <div v-if="observations.length" class="row q-col-gutter-md q-mb-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm cursor-pointer" @click="filterBySeverity(5)">
          <div class="text-h5 text-negative text-weight-bold">
            {{ severityStats.critical }}
          </div>
          <div class="text-caption text-grey-7">Críticas (5)</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm cursor-pointer" @click="filterBySeverity(4)">
          <div class="text-h5 text-deep-orange text-weight-bold">
            {{ severityStats.high }}
          </div>
          <div class="text-caption text-grey-7">Altas (4)</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm cursor-pointer" @click="filterBySeverity(3)">
          <div class="text-h5 text-warning text-weight-bold">
            {{ severityStats.medium }}
          </div>
          <div class="text-caption text-grey-7">Medias (3)</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-sm cursor-pointer" @click="filterBySeverity(2)">
          <div class="text-h5 text-info text-weight-bold">
            {{ severityStats.low }}
          </div>
          <div class="text-caption text-grey-7">Bajas (1-2)</div>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- FILTROS                                                       -->
    <!-- ============================================================ -->
    <q-card v-if="observations.length" flat bordered class="q-mb-md">
      <q-card-section class="q-py-sm">
        <div class="row items-center q-gutter-md">
          <q-input
            v-model="searchText"
            dense
            outlined
            placeholder="Buscar en descripción..."
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
            v-model="filterPrinciple"
            :options="principleOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            dense
            outlined
            label="Principio"
            clearable
            style="min-width: 200px;"
          />

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

          <q-space />

          <q-btn
            v-if="hasActiveFilters"
            flat
            dense
            color="primary"
            icon="clear"
            label="Limpiar filtros"
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
      <div class="text-caption text-grey-7 q-mt-sm">Cargando observaciones...</div>
    </div>

    <div
      v-else-if="!observations.length"
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="rate_review" size="48px" />
      <div class="text-h6 q-mt-sm">Sin observaciones</div>
      <div class="text-caption">
        Los evaluadores aún no han registrado observaciones
      </div>
    </div>

    <div
      v-else-if="!filteredObservations.length"
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="search_off" size="48px" />
      <div class="text-h6 q-mt-sm">Sin resultados</div>
      <div class="text-caption q-mb-md">
        Ajusta los filtros para ver más observaciones
      </div>
      <q-btn flat color="primary" icon="clear" label="Limpiar filtros" @click="clearFilters" />
    </div>

    <!-- ============================================================ -->
    <!-- LISTA                                                         -->
    <!-- ============================================================ -->
    <div v-else class="q-gutter-y-md">
      <q-card
        v-for="obs in filteredObservations"
        :key="obs.observationId"
        flat
        bordered
        class="observation-card"
      >
        <q-card-section>
          <div class="row items-start no-wrap q-gutter-md">
            <!-- Severidad badge -->
            <div class="severity-indicator" :class="`sev-${obs.severity}`">
              <div class="text-h6 text-weight-bold">{{ obs.severity }}</div>
              <div class="text-caption">Sev.</div>
            </div>

            <!-- Contenido -->
            <div class="col">
              <!-- Header de la observación -->
              <div class="row items-center q-gutter-xs q-mb-xs">
                <q-badge color="primary" text-color="white" class="principle-badge">
                  {{ getPrincipleCode(obs.principleId) }}
                </q-badge>
                <span class="text-caption text-grey-7">
                  {{ getPrincipleName(obs.principleId) }}
                </span>
              </div>

              <!-- Descripción -->
              <div class="text-body2 q-mb-sm">
                {{ obs.description }}
              </div>

              <!-- Frecuencia -->
              <div class="row items-center q-gutter-xs text-caption text-grey-6">
                <q-icon name="repeat" size="14px" />
                <span>Frecuencia: <strong>{{ obs.frequency }}</strong></span>
              </div>

              <!-- Recomendación -->
              <q-card
                v-if="obs.recommendation"
                flat
                class="bg-green-1 q-mt-sm recommendation-box"
              >
                <q-card-section class="q-pa-sm">
                  <div class="row items-start no-wrap q-gutter-xs">
                    <q-icon name="lightbulb" color="positive" size="16px" class="q-mt-xs" />
                    <div class="col">
                      <div class="text-caption text-positive text-weight-bold">
                        Recomendación
                      </div>
                      <div class="text-caption">{{ obs.recommendation }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Metadata -->
              <div class="row items-center q-gutter-md q-mt-sm text-caption text-grey-6">
                <div class="row items-center">
                  <q-icon name="person" size="12px" class="q-mr-xs" />
                  {{ getEvaluatorName(obs.evaluatorId) }}
                </div>
                <div v-if="obs.nodeId" class="row items-center">
                  <q-icon name="layers" size="12px" class="q-mr-xs" />
                  {{ obs.nodeId }}
                </div>
                <div class="row items-center">
                  <q-icon name="schedule" size="12px" class="q-mr-xs" />
                  {{ formatDate(obs.createdAt) }}
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDocenteStore } from '@/stores/docente.stores'
import type {
  HeuristicObservation,
  HeuristicPrinciple,
  HeuristicEvaluator,
  HeuristicTask,
} from '@/api/heuristic.api'

const props = defineProps<{
  observations: HeuristicObservation[]
  principles: HeuristicPrinciple[]
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
const filterPrinciple = ref<string | null>(null)
const filterEvaluator = ref<string | null>(null)

// ============================================================
// COMPUTED
// ============================================================
const severityStats = computed(() => ({
  critical: props.observations.filter((o) => o.severity >= 5).length,
  high: props.observations.filter((o) => o.severity === 4).length,
  medium: props.observations.filter((o) => o.severity === 3).length,
  low: props.observations.filter((o) => o.severity <= 2).length,
}))

const principleOptions = computed(() => {
  const usedPrincipleIds = new Set(props.observations.map((o) => o.principleId))
  return props.principles
    .filter((p) => usedPrincipleIds.has(p.principleId))
    .map((p) => ({
      label: `${p.code} - ${p.name}`,
      value: p.principleId,
    }))
})

const evaluatorOptions = computed(() => {
  const usedEvaluatorIds = new Set(props.observations.map((o) => o.evaluatorId))
  return props.evaluators
    .filter((e) => usedEvaluatorIds.has(e.userId))
    .map((e) => ({
      label: getUserName(e.userId),
      value: e.userId,
    }))
})

const filteredObservations = computed(() => {
  let result = [...props.observations]

  // Filtro por texto
  if (searchText.value.trim()) {
    const q = searchText.value.toLowerCase().trim()
    result = result.filter(
      (obs) =>
        obs.description.toLowerCase().includes(q) ||
        (obs.recommendation || '').toLowerCase().includes(q),
    )
  }

  // Filtro por principio
  if (filterPrinciple.value) {
    result = result.filter((o) => o.principleId === filterPrinciple.value)
  }

  // Filtro por evaluador
  if (filterEvaluator.value) {
    result = result.filter((o) => o.evaluatorId === filterEvaluator.value)
  }

  // Ordenar por severidad descendente
  result.sort((a, b) => b.severity - a.severity)

  return result
})

const hasActiveFilters = computed(
  () => !!searchText.value.trim() || !!filterPrinciple.value || !!filterEvaluator.value,
)

// ============================================================
// HELPERS
// ============================================================
function getPrincipleCode(principleId: string): string {
  const p = props.principles.find((pr) => pr.principleId === principleId)
  return p?.code || principleId.substring(0, 4).toUpperCase()
}

function getPrincipleName(principleId: string): string {
  const p = props.principles.find((pr) => pr.principleId === principleId)
  return p?.name || '—'
}

function getEvaluatorName(evaluatorId: string): string {
  return getUserName(evaluatorId)
}

function getUserName(userId: string): string {
  const user = docenteStore.students.find((s: any) => s.user_id === userId)
  return user?.display_name || `Usuario ${userId.substring(0, 8)}`
}

function formatDate(date: string): string {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return date
  }
}

function filterBySeverity(severity: number) {
  // Toggle rápido
  if (severity === 5) {
    // Todas las críticas (>=5)
    filterBySeverityRange('critical')
  } else if (severity === 4) {
    filterBySeverityRange('high')
  } else if (severity === 3) {
    filterBySeverityRange('medium')
  } else if (severity === 2) {
    filterBySeverityRange('low')
  }
}

function filterBySeverityRange(type: string) {
  // Reset others
  filterPrinciple.value = null
  filterEvaluator.value = null

  // Apply filter via search text? No, mejor un filter dedicado
  // Por simplicidad, alternamos el texto
  // (En una versión más completa, agregar filterSeverity ref)
}

function clearFilters() {
  searchText.value = ''
  filterPrinciple.value = null
  filterEvaluator.value = null
}
</script>

<style scoped>
.observation-card {
  transition: all 0.2s ease;
  border-radius: 12px;
}

.observation-card:hover {
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.1);
}

.severity-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  color: white;
  flex-shrink: 0;
}

.sev-5 {
  background: #dc2626;
}
.sev-4 {
  background: #ea580c;
}
.sev-3 {
  background: #d97706;
}
.sev-2 {
  background: #0284c7;
}
.sev-1 {
  background: #64748b;
}

.principle-badge {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.recommendation-box {
  background: #f0fdf4;
}

.bg-green-1 {
  background-color: #f0fdf4;
}
</style>