<template>
  <div class="q-pa-md">
    <!-- ============================================================ -->
    <!-- KPIs PRINCIPALES                                              -->
    <!-- ============================================================ -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-blue-1">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Evaluadores</div>
                <div class="text-h4 text-weight-bold text-primary">
                  {{ completedEvaluators }}/{{ totalEvaluators }}
                </div>
                <div class="text-caption text-grey-6">completados</div>
              </div>
              <q-icon name="groups" size="48px" color="primary" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-orange-1">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Observaciones</div>
                <div class="text-h4 text-weight-bold text-orange">
                  {{ observations.length }}
                </div>
                <div class="text-caption text-grey-6">registradas</div>
              </div>
              <q-icon name="report_problem" size="48px" color="orange" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-green-1">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Aspectos positivos</div>
                <div class="text-h4 text-weight-bold text-positive">
                  {{ positiveAspects.length }}
                </div>
                <div class="text-caption text-grey-6">identificados</div>
              </div>
              <q-icon name="thumb_up" size="48px" color="positive" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-purple-1">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Calificaciones</div>
                <div class="text-h4 text-weight-bold text-purple">
                  {{ ratings.length }}
                </div>
                <div class="text-caption text-grey-6">asignadas</div>
              </div>
              <q-icon name="star" size="48px" color="purple" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- PROGRESO GENERAL                                              -->
    <!-- ============================================================ -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">Progreso General</div>
        <div class="row items-center q-gutter-md">
          <q-circular-progress
            :value="evaluationProgress"
            size="80px"
            :color="getProgressColor(evaluationProgress)"
            track-color="grey-3"
            show-value
            font-size="16px"
            class="text-weight-bold"
          />
          <div class="col">
            <q-linear-progress
              :value="evaluationProgress / 100"
              :color="getProgressColor(evaluationProgress)"
              track-color="grey-3"
              size="20px"
              rounded
            />
            <div class="text-caption text-grey-6 q-mt-sm">
              {{ completedEvaluators }} de {{ totalEvaluators }} evaluadores han completado
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- ESTADÍSTICAS DE OBSERVACIONES POR PRINCIPIO                   -->
    <!-- ============================================================ -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Observaciones por Principio</div>
            <div v-if="observationsByPrinciple.length === 0" class="text-center text-grey-6 q-py-md">
              Sin observaciones registradas
            </div>
            <div v-else class="q-gutter-y-sm">
              <div
                v-for="item in observationsByPrinciple"
                :key="item.principleId"
                class="row items-center q-gutter-sm"
              >
                <q-chip :label="item.code" color="primary" text-color="white" dense />
                <div class="col">
                  <div class="text-caption text-grey-7 ellipsis">
                    {{ item.name }}
                  </div>
                  <q-linear-progress
                    :value="item.count / maxObservationCount"
                    color="orange"
                    track-color="grey-3"
                    size="8px"
                    rounded
                    class="q-mt-xs"
                  />
                </div>
                <q-badge color="orange">{{ item.count }}</q-badge>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- ============================================================ -->
      <!-- DISTRIBUCIÓN DE SEVERIDAD                                     -->
      <!-- ============================================================ -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Distribución de Severidad</div>
            <div v-if="observations.length === 0" class="text-center text-grey-6 q-py-md">
              Sin datos
            </div>
            <div v-else class="q-gutter-y-sm">
              <div
                v-for="item in severityDistribution"
                :key="item.severity"
                class="row items-center q-gutter-sm"
              >
                <q-badge :color="item.color" :label="item.label" class="q-px-sm" />
                <div class="col">
                  <q-linear-progress
                    :value="item.count / observations.length"
                    :color="item.color"
                    track-color="grey-3"
                    size="12px"
                    rounded
                  />
                </div>
                <span class="text-weight-medium" style="min-width: 30px; text-align: right">
                  {{ item.count }}
                </span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TOP PROBLEMAS CRÍTICOS                                        -->
    <!-- ============================================================ -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <q-icon name="warning" color="negative" size="24px" class="q-mr-sm" />
          <div class="text-h6">Problemas Críticos</div>
          <q-space />
          <q-badge color="negative">{{ criticalProblems.length }}</q-badge>
        </div>

        <div v-if="criticalProblems.length === 0" class="text-center text-grey-6 q-py-lg">
          <q-icon name="check_circle" color="positive" size="48px" />
          <div class="q-mt-sm">No hay problemas críticos identificados aún</div>
        </div>

        <q-list v-else separator>
          <q-item v-for="(problem, idx) in criticalProblems" :key="idx">
            <q-item-section avatar>
              <q-avatar color="negative" text-color="white" size="32px">
                {{ idx + 1 }}
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ problem.description }}
              </q-item-label>
              <q-item-label caption>
                <q-chip dense size="sm" color="primary" text-color="white">
                  {{ problem.principleCode }}
                </q-chip>
                <span class="q-ml-sm">
                  Severidad: {{ problem.severity }} · Frecuencia: {{ problem.frequency }}
                </span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-badge color="negative">
                Criticidad: {{ problem.criticality }}
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- ESTADO DE LA EVALUACIÓN                                       -->
    <!-- ============================================================ -->
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 q-mb-md">Estado del Sistema</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-3">
            <q-item>
              <q-item-section avatar>
                <q-icon
                  :name="evaluation?.status === 'in_progress' ? 'play_circle' : 'pause_circle'"
                  :color="evaluation?.status === 'in_progress' ? 'positive' : 'grey'"
                  size="32px"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Estado</q-item-label>
                <q-item-label class="text-weight-medium">
                  {{ getStatusLabel(evaluation?.status) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-item>
              <q-item-section avatar>
                <q-icon name="library_books" color="primary" size="32px" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Framework</q-item-label>
                <q-item-label class="text-weight-medium">
                  {{ framework?.name || '—' }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-item>
              <q-item-section avatar>
                <q-icon name="task" color="info" size="32px" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Tareas</q-item-label>
                <q-item-label class="text-weight-medium">{{ tasks.length }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-item>
              <q-item-section avatar>
                <q-icon name="timer" color="warning" size="32px" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Duración</q-item-label>
                <q-item-label class="text-weight-medium">
                  {{ evaluation?.maxDurationMinutes }} min
                </q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  HeuristicEvaluation,
  HeuristicFramework,
  HeuristicEvaluator,
  HeuristicTask,
  HeuristicObservation,
  HeuristicPositiveAspect,
  HeuristicRating,
  HeuristicFinalResult,
  HeuristicPrinciple,
} from '@/api/heuristic.api'

// ============================================================
// PROPS
// ============================================================
const props = defineProps<{
  evaluation: HeuristicEvaluation | null
  framework: HeuristicFramework | null
  evaluators: HeuristicEvaluator[]
  tasks: HeuristicTask[]
  observations: HeuristicObservation[]
  positiveAspects: HeuristicPositiveAspect[]
  ratings: HeuristicRating[]
  finalResults: HeuristicFinalResult | null
  principles?: HeuristicPrinciple[]
}>()

// ============================================================
// COMPUTED
// ============================================================
const completedEvaluators = computed(
  () => props.evaluators.filter(e => e.completedAt !== null).length,
)

const totalEvaluators = computed(() => props.evaluators.length)

const evaluationProgress = computed(() => {
  if (totalEvaluators.value === 0) return 0
  return Math.round((completedEvaluators.value / totalEvaluators.value) * 100)
})

const maxObservationCount = computed(() => {
  const counts = observationsByPrinciple.value.map(o => o.count)
  return counts.length > 0 ? Math.max(...counts) : 1
})

// Distribución de severidad
const severityDistribution = computed(() => {
  const dist = [
    { severity: 1, label: '1 - Leve', color: 'green', count: 0 },
    { severity: 2, label: '2 - Menor', color: 'blue', count: 0 },
    { severity: 3, label: '3 - Moderado', color: 'yellow', count: 0 },
    { severity: 4, label: '4 - Grave', color: 'orange', count: 0 },
    { severity: 5, label: '5 - Crítico', color: 'red', count: 0 },
  ]

  props.observations.forEach(obs => {
    const item = dist.find(d => d.severity === obs.severity)
    if (item) item.count++
  })

  return dist
})

// Observaciones agrupadas por principio
const observationsByPrinciple = computed(() => {
  const map = new Map<string, { principleId: string; code: string; name: string; count: number }>()

  props.observations.forEach(obs => {
    const principle = props.principles?.find(p => p.principleId === obs.principleId)
    const key = obs.principleId

    if (!map.has(key)) {
      map.set(key, {
        principleId: obs.principleId,
        code: principle?.code || '—',
        name: principle?.name || '—',
        count: 0,
      })
    }
    map.get(key)!.count++
  })

  return Array.from(map.values()).sort((a, b) => b.count - a.count)
})

// Problemas críticos (criticidad >= 12)
const criticalProblems = computed(() => {
  // Si hay resultados finales, usar esos
  if (props.finalResults?.criticalProblems && Array.isArray(props.finalResults.criticalProblems)) {
    return props.finalResults.criticalProblems
  }

  // Si no, calcular desde las observaciones
  const ratingsByProblem = new Map<string, HeuristicRating[]>()
  props.ratings.forEach(r => {
    if (!ratingsByProblem.has(r.problemId)) {
      ratingsByProblem.set(r.problemId, [])
    }
    ratingsByProblem.get(r.problemId)!.push(r)
  })

  const problems: any[] = []

  props.observations.forEach(obs => {
    const obsRatings = ratingsByProblem.get(obs.observationId) || []

    if (obsRatings.length === 0) return

    const avgSeverity = obsRatings.reduce((s, r) => s + r.severity, 0) / obsRatings.length
    const avgFrequency = obsRatings.reduce((s, r) => s + r.frequency, 0) / obsRatings.length
    const avgCriticality = obsRatings.reduce((s, r) => s + r.criticality, 0) / obsRatings.length

    if (avgCriticality >= 12) {
      const principle = props.principles?.find(p => p.principleId === obs.principleId)
      problems.push({
        observationId: obs.observationId,
        description: obs.description,
        principleCode: principle?.code || '—',
        severity: parseFloat(avgSeverity.toFixed(1)),
        frequency: parseFloat(avgFrequency.toFixed(1)),
        criticality: parseFloat(avgCriticality.toFixed(1)),
      })
    }
  })

  return problems.sort((a, b) => b.criticality - a.criticality)
})

// ============================================================
// HELPERS
// ============================================================
function getProgressColor(progress: number): string {
  if (progress >= 80) return 'positive'
  if (progress >= 50) return 'warning'
  return 'grey'
}

function getStatusLabel(status?: string): string {
  if (!status) return '—'
  const labels: Record<string, string> = {
    draft: 'Borrador',
    planning: 'Planificación',
    in_progress: 'En progreso',
    completed: 'Completada',
    archived: 'Archivada',
  }
  return labels[status] || status
}
</script>

<style scoped>
.bg-blue-1 {
  background-color: #e3f2fd;
}
.bg-orange-1 {
  background-color: #fff3e0;
}
.bg-green-1 {
  background-color: #e8f5e9;
}
.bg-purple-1 {
  background-color: #f3e5f5;
}
</style>