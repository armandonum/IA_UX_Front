<!-- components/coordinador/heuristic/detail/HeuristicSentimentList.vue -->
<template>
  <div>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon name="psychology" color="purple" size="24px" class="q-mr-sm" />
      <div>
        <div class="text-subtitle1 text-weight-medium">
          Análisis de Sentimientos
        </div>
        <div class="text-caption text-grey-6">
          {{ sentiments.length }} análisis registrado(s)
        </div>
      </div>
      <q-space />

      <!-- Filtro por categoría UX -->
      <q-select
        v-model="filterUxLabel"
        :options="uxLabelOptions"
        option-label="label"
        option-value="value"
        label="Categoría"
        dense
        outlined
        clearable
        emit-value
        map-options
        style="min-width: 200px"
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
    <div v-if="sentiments.length === 0" class="text-center q-py-lg text-grey-6">
      <q-icon name="psychology_alt" size="48px" />
      <div class="q-mt-sm">Sin análisis de sentimientos disponibles</div>
    </div>

    <!-- Sin resultados -->
    <div
      v-else-if="filteredSentiments.length === 0"
      class="text-center q-py-lg text-grey-6"
    >
      <q-icon name="search_off" size="48px" />
      <div class="q-mt-sm">No hay resultados</div>
    </div>

    <!-- Lista -->
    <div v-else class="q-gutter-y-sm">
      <q-card
        v-for="s in filteredSentiments"
        :key="s.sentimentId"
        flat
        bordered
        clickable
        class="sentiment-card"
        @click="$emit('seek', s.elapsedMsTotal)"
      >
        <q-card-section class="q-pa-sm">
          <div class="row items-center q-gutter-sm">
            <span class="font-mono text-caption text-primary" style="min-width: 50px">
              {{ formatTimeMs(s.elapsedMsTotal) }}
            </span>

            <q-chip
              :color="getSentimentColor(s.uxLabel)"
              text-color="white"
              size="sm"
              dense
            >
              {{ s.uxLabel }}
            </q-chip>

            <span class="text-body2 col ellipsis">
              "{{ s.text }}"
            </span>

            <q-badge outline color="purple" class="q-ml-sm">
              {{ (s.confidence * 100).toFixed(0) }}%
            </q-badge>

            <q-btn
              dense
              flat
              size="sm"
              icon="expand_more"
              :icon-right="expandedId === s.sentimentId ? 'expand_less' : 'expand_more'"
              @click.stop="toggleExpand(s.sentimentId)"
            />
          </div>

          <!-- Detalle expandido -->
          <div
            v-if="expandedId === s.sentimentId"
            class="q-mt-sm q-pa-sm bg-grey-1 rounded-borders"
          >
            <div class="row items-center q-gutter-sm q-mb-sm">
              <div class="text-caption text-grey-6">
                <strong>Etiqueta original:</strong> {{ s.originalLabel }}
              </div>
              <q-separator vertical />
              <div class="text-caption text-grey-6">
                <strong>Sentimiento UX:</strong> {{ s.uxLabel }}
              </div>
            </div>

            <!-- Scores por categoría UX -->
            <div class="text-caption text-grey-7 q-mb-xs">
              <strong>Distribución de scores:</strong>
            </div>
            <div class="row q-col-gutter-xs">
              <div
                v-for="(score, label) in sortedScores(s.scoresJson)"
                :key="label"
                class="col-12 col-sm-6 col-md-4"
              >
                <div class="row items-center q-gutter-xs">
                  <div class="text-caption" style="min-width: 130px">
                    {{ label }}
                  </div>
                  <q-linear-progress
                    :value="score"
                    :color="getSentimentColor(label)"
                    track-color="grey-3"
                    size="6px"
                    rounded
                    class="col"
                  />
                  <div class="text-caption font-mono" style="min-width: 40px">
                    {{ (score * 100).toFixed(0) }}%
                  </div>
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
import type { TextSentiment } from '@/composables/coordinator/heuristic/useHeuristicSessionDetail'

const props = defineProps<{
  sentiments: TextSentiment[]
}>()

defineEmits<{
  (e: 'seek', ms: number): void
}>()

// ============================================================
// ESTADO
// ============================================================
const filterUxLabel = ref<string | null>(null)
const searchQuery = ref('')
const expandedId = ref<string | null>(null)

// ============================================================
// OPCIONES
// ============================================================
const uxLabelOptions = [
  { label: 'Confusión', value: 'Confusión' },
  { label: 'Frustración', value: 'Frustración' },
  { label: 'Satisfacción', value: 'Satisfacción' },
  { label: 'Desconfianza', value: 'Desconfianza' },
  { label: 'Dificultad / esfuerzo', value: 'Dificultad / esfuerzo' },
  { label: 'Rechazo', value: 'Rechazo' },
  { label: 'Interés / motivación', value: 'Interés / motivación' },
  { label: 'Aburrimiento', value: 'Aburrimiento' },
  { label: 'Sorpresa', value: 'Sorpresa' },
  { label: 'Alivio', value: 'Alivio' },
  { label: 'Neutral', value: 'Neutral' },
]

// ============================================================
// COMPUTED
// ============================================================
const filteredSentiments = computed(() => {
  let result = props.sentiments

  if (filterUxLabel.value) {
    result = result.filter(s => s.uxLabel === filterUxLabel.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(
      s =>
        s.text.toLowerCase().includes(query) ||
        s.uxLabel.toLowerCase().includes(query) ||
        s.originalLabel.toLowerCase().includes(query),
    )
  }

  return [...result].sort((a, b) => a.elapsedMsTotal - b.elapsedMsTotal)
})

// ============================================================
// HELPERS
// ============================================================
function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function sortedScores(scores: Record<string, number>): Record<string, number> {
  if (!scores) return {}
  const entries = Object.entries(scores)
  entries.sort((a, b) => b[1] - a[1])
  return Object.fromEntries(entries)
}

function formatTimeMs(ms: number): string {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function getSentimentColor(label: string): string {
  const colors: Record<string, string> = {
    Confusión: 'orange',
    Frustración: 'red',
    Satisfacción: 'green',
    Desconfianza: 'grey',
    'Dificultad / esfuerzo': 'orange',
    Rechazo: 'red',
    'Interés / motivación': 'blue',
    Aburrimiento: 'grey',
    Sorpresa: 'yellow',
    Alivio: 'green',
    Neutral: 'grey',
  }
  return colors[label] || 'primary'
}
</script>

<style scoped>
.sentiment-card {
  transition: all 0.15s ease-in-out;
}

.sentiment-card:hover {
  border-color: var(--q-primary);
  box-shadow: 0 2px 8px rgba(30, 58, 138, 0.1);
}
</style>