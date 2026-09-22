<!-- components/coordinador/heuristic/detail/HeuristicObservationList.vue -->
<template>
  <div>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon name="report_problem" color="orange" size="24px" class="q-mr-sm" />
      <div>
        <div class="text-subtitle1 text-weight-medium">
          Observaciones Heurísticas
        </div>
        <div class="text-caption text-grey-6">
          {{ observations.length }} problema(s) identificado(s)
        </div>
      </div>
      <q-space />

      <!-- Filtros -->
      <q-select
        v-model="filterSeverity"
        :options="severityOptions"
        option-label="label"
        option-value="value"
        label="Severidad"
        dense
        outlined
        clearable
        emit-value
        map-options
        style="min-width: 160px"
        class="q-mr-sm"
      />
      <q-select
        v-model="filterPrinciple"
        :options="principleOptions"
        option-label="label"
        option-value="value"
        label="Principio"
        dense
        outlined
        clearable
        emit-value
        map-options
        style="min-width: 180px"
        class="q-mr-sm"
      />
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

    <!-- Sin datos -->
    <div v-if="observations.length === 0" class="text-center q-py-lg text-grey-6">
      <q-icon name="inbox" size="48px" />
      <div class="q-mt-sm">Sin observaciones registradas</div>
    </div>

    <!-- Sin resultados filtrados -->
    <div
      v-else-if="filteredObservations.length === 0"
      class="text-center q-py-lg text-grey-6"
    >
      <q-icon name="search_off" size="48px" />
      <div class="q-mt-sm">No hay observaciones que coincidan con los filtros</div>
    </div>

    <!-- Lista -->
    <div v-else class="q-gutter-y-md">
      <q-card
        v-for="obs in filteredObservations"
        :key="obs.observationId"
        flat
        bordered
        :class="getSeverityBorderClass(obs.severity)"
      >
        <q-card-section>
          <!-- Header -->
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-badge
              :color="getSeverityColor(obs.severity)"
              class="q-px-sm q-py-xs"
            >
              {{ getSeverityLabel(obs.severity) }}
            </q-badge>
            <q-badge color="grey-6" class="q-px-sm q-py-xs">
              {{ obs.frequency }}
            </q-badge>
            <q-chip
              :label="getPrincipleCode(obs.principleId)"
              color="primary"
              text-color="white"
              dense
              size="sm"
            />
            <q-chip
              v-if="getPrincipleName(obs.principleId)"
              dense
              size="sm"
              outline
              color="primary"
            >
              {{ getPrincipleName(obs.principleId) }}
            </q-chip>
            <q-space />
            <div v-if="getTaskTitle(obs.taskId)" class="text-caption text-grey-6">
              <q-icon name="task" size="12px" />
              {{ getTaskTitle(obs.taskId) }}
            </div>
            <div class="text-caption text-grey-5">
              {{ formatDate(obs.createdAt) }}
            </div>
          </div>

          <!-- Descripción -->
          <div class="text-body2 q-mb-sm">
            {{ obs.description }}
          </div>

          <!-- Recomendación -->
          <q-banner
            v-if="obs.recommendation"
            dense
            rounded
            class="bg-blue-1 text-primary q-mt-sm"
          >
            <template v-slot:avatar>
              <q-icon name="lightbulb" size="18px" />
            </template>
            <div class="text-caption">
              <strong>Recomendación:</strong> {{ obs.recommendation }}
            </div>
          </q-banner>

          <!-- Node ID -->
          <div
            v-if="obs.nodeId || obs.screenIdentifier"
            class="text-caption text-grey-6 q-mt-sm"
          >
            <q-icon name="code" size="12px" />
            <span class="font-mono">
              {{ obs.nodeId || obs.screenIdentifier }}
            </span>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SEVERITY_COLORS } from '@/data/heuristicFindingsDictionary'
import type {
  HeuristicObservation,
  HeuristicPrinciple,
  HeuristicTask,
} from '@/api/heuristic.api'

const props = defineProps<{
  observations: HeuristicObservation[]
  principles: HeuristicPrinciple[]
  tasks: HeuristicTask[]
}>()

defineEmits<{
  (e: 'seek', ms: number): void
}>()

// ============================================================
// FILTROS
// ============================================================
const filterSeverity = ref<number | null>(null)
const filterPrinciple = ref<string | null>(null)
const searchQuery = ref('')

const severityOptions = [
  { label: '1 - Leve', value: 1 },
  { label: '2 - Menor', value: 2 },
  { label: '3 - Moderado', value: 3 },
  { label: '4 - Grave', value: 4 },
  { label: '5 - Crítico', value: 5 },
]

const principleOptions = computed(() =>
  props.principles.map(p => ({
    label: `${p.code} - ${p.name}`,
    value: p.principleId,
  })),
)

// ============================================================
// COMPUTED
// ============================================================
const filteredObservations = computed(() => {
  let result = props.observations

  if (filterSeverity.value !== null) {
    result = result.filter(o => o.severity === filterSeverity.value)
  }

  if (filterPrinciple.value) {
    result = result.filter(o => o.principleId === filterPrinciple.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(
      o =>
        o.description.toLowerCase().includes(query) ||
        (o.recommendation?.toLowerCase().includes(query) ?? false),
    )
  }

  return [...result].sort(
    (a, b) => b.severity - a.severity,
  )
})

// ============================================================
// HELPERS
// ============================================================
function getSeverityColor(severity: number): string {
  const map: Record<number, string> = {
    1: 'green',
    2: 'blue',
    3: 'yellow',
    4: 'orange',
    5: 'red',
  }
  return map[severity] || 'grey'
}

function getSeverityLabel(severity: number): string {
  const labels: Record<number, string> = {
    1: '1 - Leve',
    2: '2 - Menor',
    3: '3 - Moderado',
    4: '4 - Grave',
    5: '5 - Crítico',
  }
  return labels[severity] || `Nivel ${severity}`
}

function getSeverityBorderClass(severity: number): string {
  const classes: Record<number, string> = {
    1: 'border-left-green',
    2: 'border-left-blue',
    3: 'border-left-yellow',
    4: 'border-left-orange',
    5: 'border-left-red',
  }
  return classes[severity] || ''
}

function getPrincipleCode(principleId: string): string {
  return (
    props.principles.find(p => p.principleId === principleId)?.code || '—'
  )
}

function getPrincipleName(principleId: string): string {
  return (
    props.principles.find(p => p.principleId === principleId)?.name || ''
  )
}

function getTaskTitle(taskId: string | null): string {
  if (!taskId) return ''
  return props.tasks.find(t => t.id === taskId)?.title || ''
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
.border-left-blue {
  border-left: 4px solid #2196f3 !important;
}
.border-left-yellow {
  border-left: 4px solid #ffc107 !important;
}
.border-left-orange {
  border-left: 4px solid #ff9800 !important;
}
.border-left-red {
  border-left: 4px solid #f44336 !important;
}
.bg-blue-1 {
  background-color: #e3f2fd;
}
</style>