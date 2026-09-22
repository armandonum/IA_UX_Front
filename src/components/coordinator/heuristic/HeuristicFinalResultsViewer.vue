<template>
  <div class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon name="analytics" color="deep-purple" size="28px" class="q-mr-sm" />
      <div>
        <div class="text-h6">Resultados Finales</div>
        <div class="text-caption text-grey-6">
          Consolidado de la evaluación heurística
        </div>
      </div>
      <q-space />
      <q-btn
        v-if="canGenerate && !finalResults"
        color="deep-purple"
        icon="analytics"
        label="Generar Resultados"
        unelevated
        :loading="loading"
        @click="$emit('generate')"
      />
      <q-btn
        v-else-if="finalResults"
        color="primary"
        icon="refresh"
        label="Recalcular"
        outline
        :loading="loading"
        @click="$emit('recalculate')"
      />
    </div>

    <!-- Sin resultados -->
    <div v-if="!finalResults" class="text-center q-py-xl">
      <q-icon name="analytics" size="80px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">
        No hay resultados finales generados
      </div>
      <div class="text-caption text-grey-5 q-mt-sm">
        Genera los resultados una vez que los evaluadores hayan completado
      </div>
      <q-btn
        v-if="canGenerate"
        color="deep-purple"
        icon="analytics"
        label="Generar Resultados Ahora"
        unelevated
        class="q-mt-md"
        :loading="loading"
        @click="$emit('generate')"
      />
    </div>

    <!-- Resultados -->
    <div v-else>
      <!-- Estado -->
      <q-banner rounded class="bg-purple-1 text-purple q-mb-md">
        <template v-slot:avatar>
          <q-icon name="check_circle" color="purple" />
        </template>
        <div class="text-caption">
          <strong>Resultados generados:</strong>
          {{ formatDate(finalResults.calculatedAt) }} ·
          Estado: <strong>{{ getResultStatusLabel(finalResults.status) }}</strong>
        </div>
      </q-banner>

      <!-- KPIs principales -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-blue-1">
            <q-card-section>
              <div class="text-caption text-grey-7">Total problemas</div>
              <div class="text-h4 text-weight-bold text-primary">
                {{ finalResults.totalProblems }}
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-green-1">
            <q-card-section>
              <div class="text-caption text-grey-7">Aspectos positivos</div>
              <div class="text-h4 text-weight-bold text-positive">
                {{ finalResults.totalPositiveAspects }}
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-orange-1">
            <q-card-section>
              <div class="text-caption text-grey-7">Evaluadores</div>
              <div class="text-h4 text-weight-bold text-orange">
                {{ finalResults.completedEvaluators }}/{{ finalResults.totalEvaluators }}
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-purple-1">
            <q-card-section>
              <div class="text-caption text-grey-7">Criticidad promedio</div>
              <div class="text-h4 text-weight-bold text-purple">
                {{ finalResults.avgCriticality?.toFixed(1) || '—' }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Promedios globales -->
      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">Promedios Globales</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <div class="text-caption text-grey-6">Severidad</div>
              <q-linear-progress
                :value="(finalResults.avgSeverity || 0) / 5"
                color="blue"
                track-color="grey-3"
                size="12px"
                rounded
              />
              <div class="text-caption text-weight-medium q-mt-xs">
                {{ finalResults.avgSeverity?.toFixed(1) || '—' }} / 5
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-caption text-grey-6">Frecuencia</div>
              <q-linear-progress
                :value="(finalResults.avgFrequency || 0) / 10"
                color="orange"
                track-color="grey-3"
                size="12px"
                rounded
              />
              <div class="text-caption text-weight-medium q-mt-xs">
                {{ finalResults.avgFrequency?.toFixed(1) || '—' }} / 10
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-caption text-grey-6">Criticidad</div>
              <q-linear-progress
                :value="(finalResults.avgCriticality || 0) / 15"
                color="purple"
                track-color="grey-3"
                size="12px"
                rounded
              />
              <div class="text-caption text-weight-medium q-mt-xs">
                {{ finalResults.avgCriticality?.toFixed(1) || '—' }} / 15
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Ranking de problemas -->
      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="row items-center q-mb-md">
            <q-icon name="leaderboard" color="primary" size="24px" class="q-mr-sm" />
            <div class="text-h6">Ranking de Problemas por Criticidad</div>
            <q-space />
            <q-badge color="primary">
              {{ rankingItems.length }}
            </q-badge>
          </div>

          <div v-if="rankingItems.length === 0" class="text-center text-grey-6 q-py-md">
            Sin problemas en el ranking
          </div>

          <q-list v-else separator>
            <q-item v-for="(item, idx) in rankingItems" :key="idx">
              <q-item-section avatar>
                <q-avatar
                  :color="getRankColor(idx + 1)"
                  text-color="white"
                  size="32px"
                >
                  {{ idx + 1 }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ item.problemDescription }}
                </q-item-label>
                <q-item-label caption>
                  <q-chip dense size="sm" color="primary" text-color="white">
                    {{ item.principleCode }}
                  </q-chip>
                  <span class="q-ml-sm">{{ item.principleName }}</span>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-badge color="blue" outline>S: {{ item.avgSeverity }}</q-badge>
                  <q-badge color="orange" outline>F: {{ item.avgFrequency }}</q-badge>
                  <q-badge :color="getCriticalityColor(item.avgCriticality)">
                    C: {{ item.avgCriticality }}
                  </q-badge>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Problemas críticos -->
      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="row items-center q-mb-md">
            <q-icon name="warning" color="negative" size="24px" class="q-mr-sm" />
            <div class="text-h6">Problemas Críticos</div>
            <q-space />
            <q-badge color="negative">{{ criticalProblems.length }}</q-badge>
          </div>

          <div v-if="criticalProblems.length === 0" class="text-center q-py-lg">
            <q-icon name="check_circle" color="positive" size="48px" />
            <div class="text-grey-6 q-mt-sm">
              No se identificaron problemas críticos
            </div>
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
                </q-item-label>

                <q-banner
                  v-if="problem.recommendation"
                  rounded
                  dense
                  class="bg-blue-1 text-primary q-mt-sm"
                >
                  <template v-slot:avatar>
                    <q-icon name="lightbulb" size="18px" />
                  </template>
                  <div class="text-caption">
                    {{ problem.recommendation }}
                  </div>
                </q-banner>
              </q-item-section>

              <q-item-section side>
                <q-badge :color="getCriticalityColor(problem.criticality)">
                  {{ problem.criticality }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Recomendaciones -->
      <q-card flat bordered>
        <q-card-section>
          <div class="row items-center q-mb-md">
            <q-icon name="lightbulb" color="warning" size="24px" class="q-mr-sm" />
            <div class="text-h6">Recomendaciones</div>
            <q-space />
            <q-badge color="warning">{{ recommendations.length }}</q-badge>
          </div>

          <div v-if="recommendations.length === 0" class="text-center q-py-lg">
            <q-icon name="lightbulb_outline" color="grey-5" size="48px" />
            <div class="text-grey-6 q-mt-sm">
              No hay recomendaciones registradas
            </div>
          </div>

          <q-list v-else separator>
            <q-item v-for="(rec, idx) in recommendations" :key="idx">
              <q-item-section avatar>
                <q-avatar
                  :color="getPriorityColor(rec.priority)"
                  text-color="white"
                  size="32px"
                >
                  <q-icon name="lightbulb" size="18px" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ rec.recommendation }}
                </q-item-label>
                <q-item-label caption>
                  Problema: {{ rec.problemDescription }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge :color="getPriorityColor(rec.priority)">
                  {{ getPriorityLabel(rec.priority) }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  HeuristicFinalResult,
  HeuristicEvaluation,
} from '@/api/heuristic.api'

const props = defineProps<{
  finalResults: HeuristicFinalResult | null
  evaluation: HeuristicEvaluation | null
  canGenerate: boolean
  loading: boolean
}>()

defineEmits<{
  (e: 'generate'): void
  (e: 'recalculate'): void
}>()

const rankingItems = computed(() => {
  if (!props.finalResults?.rankingJson) return []
  return props.finalResults.rankingJson as any[]
})

const criticalProblems = computed(() => {
  if (!props.finalResults?.criticalProblems) return []
  return props.finalResults.criticalProblems as any[]
})

const recommendations = computed(() => {
  if (!props.finalResults?.recommendations) return []
  return props.finalResults.recommendations as any[]
})

function getRankColor(rank: number): string {
  if (rank === 1) return 'red'
  if (rank === 2) return 'orange'
  if (rank === 3) return 'amber'
  return 'grey'
}

function getCriticalityColor(criticality: number): string {
  if (criticality >= 14) return 'red'
  if (criticality >= 12) return 'orange'
  if (criticality >= 8) return 'yellow'
  if (criticality >= 5) return 'blue'
  return 'green'
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: 'negative',
    medium: 'warning',
    low: 'info',
  }
  return colors[priority] || 'grey'
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  }
  return labels[priority] || priority
}

function getResultStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    completed: 'Completado',
    reviewed: 'Revisado',
  }
  return labels[status] || status
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.bg-blue-1 {
  background-color: #e3f2fd;
}
.bg-green-1 {
  background-color: #e8f5e9;
}
.bg-orange-1 {
  background-color: #fff3e0;
}
.bg-purple-1 {
  background-color: #f3e5f5;
}
</style>