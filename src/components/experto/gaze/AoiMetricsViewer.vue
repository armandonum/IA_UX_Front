<!-- components/experto/gaze/AoiMetricsViewer.vue -->
<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando métricas AOI...</div>
    </div>

    <!-- Sin datos -->
    <div v-else-if="!metrics.length" class="text-center q-py-xl text-grey-6">
      <q-icon name="analytics" size="64px" />
      <div class="text-h6 q-mt-md">Sin métricas AOI</div>
      <div class="text-caption q-mb-md">
        No hay áreas de interés definidas o no se han calculado métricas
      </div>
      <q-btn
        color="primary"
        icon="calculate"
        label="Calcular métricas"
        unelevated
        :loading="calculating"
        @click="calculateMetrics"
      />
    </div>

    <!-- Tabla de métricas -->
    <template v-else>
      <div class="row items-center justify-between q-mb-md">
        <div class="text-subtitle1 text-weight-bold">
          📊 Métricas por Área de Interés ({{ metrics.length }})
        </div>
        <q-btn
          flat
          color="primary"
          icon="refresh"
          label="Recalcular"
          :loading="calculating"
          @click="calculateMetrics"
        />
      </div>

      <q-markup-table flat bordered dense>
        <thead>
          <tr>
            <th class="text-left">AOI</th>
            <th class="text-center">TFF (ms)</th>
            <th class="text-center">Fixaciones</th>
            <th class="text-center">Duración total (ms)</th>
            <th class="text-center">% Atención</th>
            <th class="text-center">Nivel</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="metric in sortedMetrics" :key="metric.metricId">
            <td>
              <div class="text-weight-medium">{{ metric.aoiName }}</div>
              <div v-if="metric.nodeId" class="text-caption text-grey-6 font-mono">
                {{ metric.nodeId }}
              </div>
            </td>
            <td class="text-center">
              <q-badge :color="getTffColor(metric.timeToFirstFixationMs)" text-color="white">
                {{ metric.timeToFirstFixationMs }}
              </q-badge>
            </td>
            <td class="text-center">
              <q-badge :color="getFixationColor(metric.fixationCount)" text-color="white">
                {{ metric.fixationCount }}
              </q-badge>
            </td>
            <td class="text-center">{{ metric.totalFixationDurationMs }}</td>
            <td class="text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-linear-progress
                  :value="metric.percentageFixated / 100"
                  :color="getAttentionColor(metric.percentageFixated)"
                  track-color="grey-3"
                  size="6px"
                  rounded
                  style="width: 60px;"
                />
                <span class="text-caption">
                  {{ metric.percentageFixated.toFixed(1) }}%
                </span>
              </div>
            </td>
            <td class="text-center">
              <q-badge
                :color="getAttentionBadgeColor(metric.percentageFixated)"
                text-color="white"
              >
                {{ getAttentionLabel(metric.percentageFixated) }}
              </q-badge>
            </td>
          </tr>
        </tbody>
      </q-markup-table>

      <div class="q-mt-md text-caption text-grey-6">
        <q-icon name="info" size="14px" />
        TFF = Time to First Fixation | Duración en milisegundos
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { aoiMetricsApi } from '@/api/coordinator/gaze-events.api'
import type { AoiMetric } from '@/api/coordinator/gaze-events.api'

const props = defineProps<{
  sessionId: string
}>()

const $q = useQuasar()

// ============================================================
// STATE
// ============================================================
const loading = ref(false)
const calculating = ref(false)
const metrics = ref<AoiMetric[]>([])

// ============================================================
// COMPUTED
// ============================================================
const sortedMetrics = computed(() =>
  [...metrics.value].sort((a, b) => b.percentageFixated - a.percentageFixated),
)

// ============================================================
// LOAD
// ============================================================
async function loadMetrics() {
  if (!props.sessionId) return

  loading.value = true
  try {
    const { data } = await aoiMetricsApi.getBySession(props.sessionId)
    metrics.value = data
  } catch (e: any) {
    console.error('Error cargando métricas:', e)
  } finally {
    loading.value = false
  }
}

async function calculateMetrics() {
  if (!props.sessionId) return

  calculating.value = true
  try {
    const { data } = await aoiMetricsApi.calculate(props.sessionId)
    metrics.value = data.metrics
    $q.notify({
      type: 'positive',
      message: `✅ ${data.aoiCount} métricas calculadas`,
    })
  } catch (e: any) {
    console.error('Error calculando métricas:', e)
    $q.notify({
      type: 'negative',
      message: e.response?.data?.message || 'Error al calcular métricas',
    })
  } finally {
    calculating.value = false
  }
}

// ============================================================
// HELPERS
// ============================================================
function getTffColor(tff: number): string {
  if (tff <= 1000) return 'positive'
  if (tff <= 3000) return 'warning'
  return 'negative'
}

function getFixationColor(count: number): string {
  if (count === 0) return 'grey'
  if (count <= 3) return 'info'
  if (count <= 8) return 'primary'
  return 'deep-orange'
}

function getAttentionColor(pct: number): string {
  if (pct < 10) return 'grey'
  if (pct < 30) return 'info'
  if (pct < 50) return 'primary'
  return 'positive'
}

function getAttentionBadgeColor(pct: number): string {
  if (pct < 10) return 'grey'
  if (pct < 30) return 'info'
  if (pct < 50) return 'primary'
  return 'positive'
}

function getAttentionLabel(pct: number): string {
  if (pct < 10) return 'Baja'
  if (pct < 30) return 'Media'
  if (pct < 50) return 'Alta'
  return 'Muy alta'
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(loadMetrics)

watch(() => props.sessionId, loadMetrics)
</script>