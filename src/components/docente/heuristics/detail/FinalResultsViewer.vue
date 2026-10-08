<!-- components/docente/heuristics/detail/FinalResultsViewer.vue -->
<template>
  <div>
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle2 text-weight-bold">
          📊 Resultados finales
        </div>
        <div class="text-caption text-grey-6">
          Ranking consolidado de problemas por criticidad
        </div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn
          v-if="results"
          flat
          color="primary"
          icon="download"
          label="Exportar"
          @click="exportToJson"
        />
        <q-btn
          v-if="!results"
          unelevated
          color="primary"
          icon="calculate"
          label="Generar resultados"
          :loading="loading"
          @click="onGenerate"
        />
        <q-btn
          v-else
          flat
          color="primary"
          icon="refresh"
          label="Recalcular"
          :loading="loading"
          @click="onRecalculate"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- LOADING                                                       -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">
        {{ results ? 'Recalculando resultados...' : 'Generando resultados...' }}
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- EMPTY                                                         -->
    <!-- ============================================================ -->
    <div
      v-else-if="!results"
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="insights" size="64px" />
      <div class="text-h6 q-mt-sm">Sin resultados generados</div>
      <div class="text-caption q-mb-md">
        Genera los resultados cuando los evaluadores hayan terminado su trabajo
      </div>

      <q-card flat bordered class="q-mt-md" style="max-width: 500px; margin: 0 auto;">
        <q-card-section>
          <div class="text-caption text-grey-7 q-mb-sm">
            Al generar resultados se calcula:
          </div>
          <q-list dense>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check" color="positive" size="16px" />
              </q-item-section>
              <q-item-section class="text-caption">
                Ranking de problemas por criticidad
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check" color="positive" size="16px" />
              </q-item-section>
              <q-item-section class="text-caption">
                Promedios de severidad y frecuencia
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check" color="positive" size="16px" />
              </q-item-section>
              <q-item-section class="text-caption">
                Problemas críticos priorizados
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>

    <!-- ============================================================ -->
    <!-- RESULTADOS                                                    -->
    <!-- ============================================================ -->
    <template v-else>
      <!-- KPIs -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3">
          <q-card flat bordered class="text-center q-pa-md">
            <q-icon name="bug_report" color="primary" size="28px" />
            <div class="text-h4 text-primary text-weight-bold q-mt-xs">
              {{ results.totalProblems }}
            </div>
            <div class="text-caption text-grey-7">Problemas</div>
          </q-card>
        </div>

        <div class="col-6 col-md-3">
          <q-card flat bordered class="text-center q-pa-md">
            <q-icon name="thumb_up" color="positive" size="28px" />
            <div class="text-h4 text-positive text-weight-bold q-mt-xs">
              {{ results.totalPositiveAspects }}
            </div>
            <div class="text-caption text-grey-7">Positivos</div>
          </q-card>
        </div>

        <div class="col-6 col-md-3">
          <q-card flat bordered class="text-center q-pa-md">
            <q-icon name="warning" color="warning" size="28px" />
            <div class="text-h4 text-warning text-weight-bold q-mt-xs">
              {{ results.avgSeverity?.toFixed(1) || '—' }}
            </div>
            <div class="text-caption text-grey-7">Sev. promedio</div>
          </q-card>
        </div>

        <div class="col-6 col-md-3">
          <q-card flat bordered class="text-center q-pa-md">
            <q-icon name="priority_high" color="negative" size="28px" />
            <div class="text-h4 text-negative text-weight-bold q-mt-xs">
              {{ results.avgCriticality?.toFixed(1) || '—' }}
            </div>
            <div class="text-caption text-grey-7">Criticidad prom.</div>
          </q-card>
        </div>
      </div>

      <!-- Info de generación -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="q-py-sm">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-md text-caption text-grey-6">
              <div class="row items-center">
                <q-icon name="event" size="14px" class="q-mr-xs" />
                Calculado: {{ formatDate(results.calculatedAt) }}
              </div>
              <div class="row items-center">
                <q-icon name="people" size="14px" class="q-mr-xs" />
                {{ results.totalEvaluators }} evaluadores
              </div>
              <div class="row items-center">
                <q-icon name="check_circle" size="14px" class="q-mr-xs" />
                {{ results.completedEvaluators }} completaron
              </div>
            </div>

            <q-badge
              :color="getResultStatusColor(results.status)"
              text-color="white"
            >
              {{ getResultStatusLabel(results.status) }}
            </q-badge>
          </div>
        </q-card-section>
      </q-card>

      <!-- Ranking de problemas -->
      <q-card v-if="ranking.length" flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 text-weight-bold q-mb-md">
            🏆 Ranking de problemas por criticidad
          </div>

          <q-list separator>
            <q-item
              v-for="(item, index) in ranking"
              :key="index"
              class="ranking-item"
            >
              <q-item-section avatar>
                <q-avatar
                  :color="getRankColor(index)"
                  text-color="white"
                  class="rank-avatar"
                >
                  {{ index + 1 }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ item.description || item.title || 'Problema sin título' }}
                </q-item-label>
                <q-item-label caption class="q-mt-xs">
                  <div class="row items-center q-gutter-md">
                    <span v-if="item.principleCode">
                      <q-badge color="primary" outline>
                        {{ item.principleCode }}
                      </q-badge>
                    </span>
                    <span v-if="item.severity">
                      Severidad: <strong>{{ item.severity }}</strong>
                    </span>
                    <span v-if="item.frequency">
                      Frecuencia: <strong>{{ item.frequency }}</strong>
                    </span>
                    <span v-if="item.criticality">
                      Criticidad: <strong>{{ item.criticality }}</strong>
                    </span>
                  </div>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-chip
                  :color="getCriticityColor(item.criticality || 0)"
                  text-color="white"
                  :label="`${item.criticality || 0}`"
                  dense
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Problemas críticos -->
      <q-card
        v-if="criticalProblems.length"
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section>
          <div class="text-subtitle2 text-weight-bold q-mb-md text-negative">
            🚨 Problemas críticos ({{ criticalProblems.length }})
          </div>

          <div class="q-gutter-y-sm">
            <q-card
              v-for="(problem, index) in criticalProblems"
              :key="index"
              flat
              bordered
              class="critical-card"
            >
              <q-card-section class="q-pa-sm">
                <div class="text-body2 text-weight-medium">
                  {{ problem.description || problem.title }}
                </div>
                <div
                  v-if="problem.recommendation"
                  class="text-caption text-grey-7 q-mt-xs"
                >
                  💡 {{ problem.recommendation }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
      </q-card>

      <!-- Recomendaciones -->
      <q-card
        v-if="recommendations.length"
        flat
        bordered
      >
        <q-card-section>
          <div class="text-subtitle2 text-weight-bold q-mb-md text-positive">
            💡 Recomendaciones
          </div>

          <q-list>
            <q-item
              v-for="(rec, index) in recommendations"
              :key="index"
            >
              <q-item-section avatar>
                <q-icon name="lightbulb" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ rec.description || rec.text || rec }}
                </q-item-label>
                <q-item-label v-if="rec.priority" caption>
                  Prioridad: {{ rec.priority }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Sin contenido -->
      <q-card
        v-if="!ranking.length && !criticalProblems.length && !recommendations.length"
        flat
        bordered
      >
        <q-card-section class="text-center q-py-xl text-grey-6">
          <q-icon name="inbox" size="48px" />
          <div class="text-h6 q-mt-sm">Resultados vacíos</div>
          <div class="text-caption">
            Recalcula los resultados cuando haya más datos disponibles
          </div>
        </q-card-section>
      </q-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useHeuristicEvaluationDetail } from '@/composables/docente/useHeuristicEvaluationDetail'
import type {
  HeuristicFinalResult,
  HeuristicObservation,
  HeuristicPositiveAspect,
  HeuristicPrinciple,
} from '@/api/heuristic.api'

const props = defineProps<{
  evaluationId: string
  results: HeuristicFinalResult | null
  observations: HeuristicObservation[]
  positiveAspects: HeuristicPositiveAspect[]
  principles: HeuristicPrinciple[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'generated'): void
  (e: 'recalculated'): void
}>()

const $q = useQuasar()

const { generateFinalResults, recalculateFinalResults } =
  useHeuristicEvaluationDetail()

// ============================================================
// COMPUTED
// ============================================================
const ranking = computed(() => {
  if (!props.results?.rankingJson) return []
  return props.results.rankingJson as any[]
})

const criticalProblems = computed(() => {
  if (!props.results?.criticalProblems) return []
  return props.results.criticalProblems as any[]
})

const recommendations = computed(() => {
  if (!props.results?.recommendations) return []
  return props.results.recommendations as any[]
})

// ============================================================
// ACTIONS
// ============================================================
async function onGenerate() {
  try {
    await generateFinalResults(props.evaluationId)
    emit('generated')
  } catch (e) {
    // Error manejado
  }
}

async function onRecalculate() {
  try {
    await recalculateFinalResults(props.evaluationId)
    emit('recalculated')
  } catch (e) {
    // Error manejado
  }
}

function exportToJson() {
  if (!props.results) return

  const data = {
    evaluationId: props.evaluationId,
    generatedAt: props.results.calculatedAt,
    stats: {
      totalProblems: props.results.totalProblems,
      totalPositiveAspects: props.results.totalPositiveAspects,
      avgSeverity: props.results.avgSeverity,
      avgFrequency: props.results.avgFrequency,
      avgCriticality: props.results.avgCriticality,
    },
    ranking: ranking.value,
    criticalProblems: criticalProblems.value,
    recommendations: recommendations.value,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resultados-heuristicos-${props.evaluationId}.json`
  a.click()
  URL.revokeObjectURL(url)

  $q.notify({
    type: 'positive',
    message: 'Resultados exportados',
    icon: 'download',
  })
}

// ============================================================
// HELPERS
// ============================================================
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

function getResultStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'warning',
    completed: 'positive',
    reviewed: 'info',
  }
  return colors[status] || 'grey'
}

function getResultStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente revisión',
    completed: 'Completado',
    reviewed: 'Revisado',
  }
  return labels[status] || status
}

function getRankColor(index: number): string {
  if (index === 0) return 'negative'
  if (index === 1) return 'deep-orange'
  if (index === 2) return 'warning'
  if (index < 5) return 'info'
  return 'grey-6'
}

function getCriticityColor(criticality: number): string {
  if (criticality >= 8) return 'negative'
  if (criticality >= 6) return 'deep-orange'
  if (criticality >= 4) return 'warning'
  if (criticality >= 2) return 'info'
  return 'grey-6'
}
</script>

<style scoped>
.ranking-item {
  padding: 12px 8px;
}

.rank-avatar {
  font-weight: bold;
  font-size: 16px;
}

.critical-card {
  border-left: 4px solid #dc2626;
  border-radius: 8px;
}

.ranking-item:hover {
  background-color: #f8fafc;
}
</style>