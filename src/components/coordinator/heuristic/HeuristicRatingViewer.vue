<template>
  <div class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon name="star" color="purple" size="28px" class="q-mr-sm" />
      <div>
        <div class="text-h6">Calificaciones de Problemas</div>
        <div class="text-caption text-grey-6">
          {{ ratingGroups.length }} problema(s) calificado(s) · Solo lectura
        </div>
      </div>
      <q-space />
      <q-toggle
        v-model="showOnlyCritical"
        label="Solo críticos (≥12)"
        color="negative"
        dense
      />
    </div>

    <!-- Info promedios -->
    <div class="row q-col-gutter-md q-mb-md" v-if="ratingGroups.length > 0">
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="bg-blue-1">
          <q-card-section>
            <div class="text-caption text-grey-7">Severidad promedio</div>
            <div class="text-h5 text-weight-bold text-primary">
              {{ globalAverages.severity.toFixed(1) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="bg-orange-1">
          <q-card-section>
            <div class="text-caption text-grey-7">Frecuencia promedio</div>
            <div class="text-h5 text-weight-bold text-orange">
              {{ globalAverages.frequency.toFixed(1) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="bg-purple-1">
          <q-card-section>
            <div class="text-caption text-grey-7">Criticidad promedio</div>
            <div class="text-h5 text-weight-bold text-purple">
              {{ globalAverages.criticality.toFixed(1) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Sin datos -->
    <div v-if="ratingGroups.length === 0" class="text-center q-py-xl">
      <q-icon name="star_border" size="64px" color="grey-5" />
      <div class="text-grey-6 q-mt-md">
        Aún no hay calificaciones registradas
      </div>
      <div class="text-caption text-grey-5">
        Los evaluadores calificarán los problemas durante la sesión
      </div>
    </div>

    <!-- Sin resultados filtrados -->
    <div v-else-if="filteredGroups.length === 0" class="text-center q-py-xl">
      <q-icon name="filter_alt_off" size="64px" color="grey-5" />
      <div class="text-grey-6 q-mt-md">
        No hay problemas críticos (criticidad ≥ 12)
      </div>
    </div>

    <!-- Lista de problemas calificados -->
    <div v-else class="q-gutter-y-md">
      <q-card
        v-for="group in filteredGroups"
        :key="group.problemId"
        flat
        bordered
        :class="getCriticalityBorderClass(group.avgCriticality)"
      >
        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-badge
              :color="getCriticalityColor(group.avgCriticality)"
              class="q-px-sm"
            >
              Criticidad: {{ group.avgCriticality.toFixed(1) }}
            </q-badge>
            <q-chip
              :label="getPrincipleCode(group.principleId)"
              color="primary"
              text-color="white"
              dense
            />
            <q-space />
            <div class="text-caption text-grey-6">
              {{ group.ratings.length }} calificación(es)
            </div>
          </div>

          <div class="text-body2 q-mb-sm">
            {{ group.description }}
          </div>

          <!-- Promedios -->
          <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6 col-sm-4">
              <div class="text-caption text-grey-6">Severidad prom.</div>
              <q-linear-progress
                :value="group.avgSeverity / 5"
                color="blue"
                track-color="grey-3"
                size="8px"
                rounded
              />
              <div class="text-caption text-weight-medium q-mt-xs">
                {{ group.avgSeverity.toFixed(1) }} / 5
              </div>
            </div>
            <div class="col-6 col-sm-4">
              <div class="text-caption text-grey-6">Frecuencia prom.</div>
              <q-linear-progress
                :value="group.avgFrequency / 10"
                color="orange"
                track-color="grey-3"
                size="8px"
                rounded
              />
              <div class="text-caption text-weight-medium q-mt-xs">
                {{ group.avgFrequency.toFixed(1) }} / 10
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-caption text-grey-6">Criticidad prom.</div>
              <q-linear-progress
                :value="group.avgCriticality / 15"
                :color="getCriticalityColor(group.avgCriticality)"
                track-color="grey-3"
                size="8px"
                rounded
              />
              <div class="text-caption text-weight-medium q-mt-xs">
                {{ group.avgCriticality.toFixed(1) }} / 15
              </div>
            </div>
          </div>

          <!-- Detalle por evaluador -->
          <q-expansion-item
            dense
            switch-toggle-side
            icon="people"
            :label="`Ver calificaciones individuales (${group.ratings.length})`"
            class="q-mt-sm"
          >
            <q-list dense separator>
              <q-item v-for="rating in group.ratings" :key="rating.ratingId">
                <q-item-section>
                  <q-item-label class="text-caption">
                    {{ getEvaluatorName(rating.evaluatorId) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-xs">
                    <q-badge color="blue" outline>
                      S: {{ rating.severity }}
                    </q-badge>
                    <q-badge color="orange" outline>
                      F: {{ rating.frequency }}
                    </q-badge>
                    <q-badge :color="getCriticalityColor(rating.criticality)">
                      C: {{ rating.criticality }}
                    </q-badge>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type {
  HeuristicRating,
  HeuristicObservation,
  HeuristicPrinciple,
  HeuristicEvaluator,
} from '@/api/heuristic.api'

const props = defineProps<{
  ratings: HeuristicRating[]
  observations: HeuristicObservation[]
  principles: HeuristicPrinciple[]
  evaluators: HeuristicEvaluator[]
}>()

const showOnlyCritical = ref(false)

// Agrupar calificaciones por problema
const ratingGroups = computed(() => {
  const grouped = new Map<string, {
    problemId: string
    description: string
    principleId: string
    ratings: HeuristicRating[]
    avgSeverity: number
    avgFrequency: number
    avgCriticality: number
  }>()

  props.ratings.forEach(rating => {
    const obs = props.observations.find(o => o.observationId === rating.problemId)
    if (!obs) return

    if (!grouped.has(rating.problemId)) {
      grouped.set(rating.problemId, {
        problemId: rating.problemId,
        description: obs.description,
        principleId: obs.principleId,
        ratings: [],
        avgSeverity: 0,
        avgFrequency: 0,
        avgCriticality: 0,
      })
    }
    grouped.get(rating.problemId)!.ratings.push(rating)
  })

  // Calcular promedios
  grouped.forEach(group => {
    const count = group.ratings.length
    group.avgSeverity = group.ratings.reduce((s, r) => s + r.severity, 0) / count
    group.avgFrequency = group.ratings.reduce((s, r) => s + r.frequency, 0) / count
    group.avgCriticality = group.ratings.reduce((s, r) => s + r.criticality, 0) / count
  })

  return Array.from(grouped.values()).sort(
    (a, b) => b.avgCriticality - a.avgCriticality,
  )
})

const filteredGroups = computed(() => {
  if (!showOnlyCritical.value) return ratingGroups.value
  return ratingGroups.value.filter(g => g.avgCriticality >= 12)
})

const globalAverages = computed(() => {
  if (props.ratings.length === 0) {
    return { severity: 0, frequency: 0, criticality: 0 }
  }
  const count = props.ratings.length
  return {
    severity: props.ratings.reduce((s, r) => s + r.severity, 0) / count,
    frequency: props.ratings.reduce((s, r) => s + r.frequency, 0) / count,
    criticality: props.ratings.reduce((s, r) => s + r.criticality, 0) / count,
  }
})

function getCriticalityColor(criticality: number): string {
  if (criticality >= 14) return 'red'
  if (criticality >= 12) return 'orange'
  if (criticality >= 8) return 'yellow'
  if (criticality >= 5) return 'blue'
  return 'green'
}

function getCriticalityBorderClass(criticality: number): string {
  if (criticality >= 14) return 'border-left-red'
  if (criticality >= 12) return 'border-left-orange'
  if (criticality >= 8) return 'border-left-yellow'
  return 'border-left-green'
}

function getPrincipleCode(principleId: string): string {
  return props.principles.find(p => p.principleId === principleId)?.code || '—'
}

function getEvaluatorName(evaluatorId: string): string {
  return props.evaluators.find(e => e.userId === evaluatorId)?.userId || 'Evaluador'
}
</script>

<style scoped>
.border-left-green {
  border-left: 4px solid #4caf50 !important;
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
.bg-orange-1 {
  background-color: #fff3e0;
}
.bg-purple-1 {
  background-color: #f3e5f5;
}
</style>