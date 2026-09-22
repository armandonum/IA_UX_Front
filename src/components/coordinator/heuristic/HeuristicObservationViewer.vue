<template>
  <div class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon name="report_problem" color="orange" size="28px" class="q-mr-sm" />
      <div>
        <div class="text-h6">Observaciones Registradas</div>
        <div class="text-caption text-grey-6">
          {{ observations.length }} observación(es) · Solo lectura
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

    <!-- Filtros -->
    <div class="row q-gutter-sm q-mb-md">
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
        style="min-width: 200px"
      />
    </div>

    <!-- Sin observaciones -->
    <div v-if="observations.length === 0" class="text-center q-py-xl">
      <q-icon name="inbox" size="64px" color="grey-5" />
      <div class="text-grey-6 q-mt-md">
        Aún no hay observaciones registradas
      </div>
      <div class="text-caption text-grey-5">
        Los evaluadores las registrarán durante la sesión
      </div>
    </div>

    <!-- Sin resultados de búsqueda -->
    <div v-else-if="filteredObservations.length === 0" class="text-center q-py-xl">
      <q-icon name="search_off" size="64px" color="grey-5" />
      <div class="text-grey-6 q-mt-md">No se encontraron observaciones</div>
    </div>

    <!-- Lista de observaciones -->
    <div v-else class="q-gutter-y-md">
      <q-card
        v-for="obs in filteredObservations"
        :key="obs.observationId"
        flat
        bordered
        :class="getSeverityBorderClass(obs.severity)"
      >
        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-badge :color="getSeverityColor(obs.severity)" class="q-px-sm">
              Severidad: {{ obs.severity }}
            </q-badge>
            <q-badge color="grey-6" class="q-px-sm">
              {{ obs.frequency }}
            </q-badge>
            <q-chip
              :label="getPrincipleCode(obs.principleId)"
              color="primary"
              text-color="white"
              dense
            />
            <q-space />
            <div class="text-caption text-grey-6">
              {{ getEvaluatorName(obs.evaluatorId) }}
            </div>
            <div class="text-caption text-grey-5">
              {{ formatDate(obs.createdAt) }}
            </div>
          </div>

          <div class="text-body2 q-mb-sm">
            {{ obs.description }}
          </div>

          <q-banner
            v-if="obs.recommendation"
            rounded
            dense
            class="bg-blue-1 text-primary q-mt-sm"
          >
            <template v-slot:avatar>
              <q-icon name="lightbulb" size="18px" />
            </template>
            <div class="text-caption">
              <strong>Recomendación:</strong> {{ obs.recommendation }}
            </div>
          </q-banner>

          <div v-if="obs.taskId" class="text-caption text-grey-6 q-mt-sm">
            <q-icon name="task" size="12px" />
            Tarea: {{ getTaskTitle(obs.taskId) }}
          </div>

          <div v-if="obs.nodeId || obs.screenIdentifier" class="text-caption text-grey-5 q-mt-xs">
            <q-icon name="code" size="12px" />
            {{ obs.nodeId || obs.screenIdentifier }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
}>()

const searchQuery = ref('')
const filterSeverity = ref<number | null>(null)
const filterPrinciple = ref<string | null>(null)

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
    result = result.filter(o =>
      o.description.toLowerCase().includes(query) ||
      (o.recommendation?.toLowerCase().includes(query) ?? false),
    )
  }

  return result
})

function getSeverityColor(severity: number): string {
  const colors: Record<number, string> = {
    1: 'green',
    2: 'blue',
    3: 'yellow',
    4: 'orange',
    5: 'red',
  }
  return colors[severity] || 'grey'
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
  return props.principles.find(p => p.principleId === principleId)?.code || '—'
}

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