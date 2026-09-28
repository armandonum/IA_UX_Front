<!-- components/findings/SentimentSummary.vue -->
<template>
  <div class="sentiment-summary q-mb-md">
    <!-- Stats globales -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-purple text-weight-bold">
              {{ sentiments.length }}
            </div>
            <div class="text-caption text-grey-7">Comentarios analizados</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-negative text-weight-bold">
              {{ negativePercent }}%
            </div>
            <div class="text-caption text-grey-7">Sentimientos negativos</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-positive text-weight-bold">
              {{ positivePercent }}%
            </div>
            <div class="text-caption text-grey-7">Sentimientos positivos</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h6 text-primary text-weight-bold">
              {{ dominantSentiment }}
            </div>
            <div class="text-caption text-grey-7">Sentimiento dominante</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Distribución completa -->
    <q-card bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">
          📊 Distribución de sentimientos
        </div>

        <div class="q-gutter-y-md">
          <div v-for="item in sentimentDistribution" :key="item.sentiment">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-caption text-weight-bold">
                {{ item.count }} ({{ item.percentage }}%)
              </div>
            </div>
            <q-linear-progress
              :value="item.percentage / 100"
              :color="item.color"
              track-color="grey-3"
              size="8px"
              rounded
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Comentarios destacados -->
    <q-card
      v-if="relevantComments.length > 0"
      bordered
      class="q-mt-md"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">
          💬 Comentarios destacados
        </div>

        <div
          v-for="(c, i) in relevantComments"
          :key="i"
          class="q-mb-sm q-pa-sm bg-grey-1 rounded"
        >
          <div class="row items-start no-wrap q-gutter-sm">
            <q-badge :color="getSentimentColor(c.uxLabel)" class="q-mt-xs">
              {{ c.uxLabel }}
            </q-badge>
            <div class="col">
              <div class="text-body2">"{{ c.text }}"</div>
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ (c.confidence * 100).toFixed(0) }}% confianza
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TextSentiment } from '@/api/text-sentiments.api'
import { getSentimentColor as getColor } from '@/types/expert/findings.dictionary'

const props = defineProps<{
  sentiments: TextSentiment[]
}>()

// ============================================================
// DISTRIBUCIÓN
// ============================================================
const sentimentDistribution = computed(() => {
  if (!props.sentiments.length) return []

  const counts: Record<string, number> = {}
  props.sentiments.forEach((s) => {
    const label = s.uxLabel || 'Neutral'
    counts[label] = (counts[label] || 0) + 1
  })

  return Object.entries(counts)
    .map(([sentiment, count]) => ({
      sentiment,
      count,
      percentage: Math.round((count / props.sentiments.length) * 100),
      label: sentiment,
      color: getColor(sentiment),
    }))
    .sort((a, b) => b.count - a.count)
})

// ============================================================
// PORCENTAJES
// ============================================================
const NEGATIVE_SENTIMENTS = [
  'Frustración',
  'Confusión',
  'Dificultad / esfuerzo',
  'Rechazo',
  'Desconfianza',
  'Aburrimiento',
]

const POSITIVE_SENTIMENTS = [
  'Satisfacción',
  'Interés / motivación',
  'Alivio',
]

const negativePercent = computed(() => {
  if (!props.sentiments.length) return 0
  const negative = props.sentiments.filter((s) =>
    NEGATIVE_SENTIMENTS.includes(s.uxLabel),
  ).length
  return Math.round((negative / props.sentiments.length) * 100)
})

const positivePercent = computed(() => {
  if (!props.sentiments.length) return 0
  const positive = props.sentiments.filter((s) =>
    POSITIVE_SENTIMENTS.includes(s.uxLabel),
  ).length
  return Math.round((positive / props.sentiments.length) * 100)
})

// ============================================================
// SENTIMIENTO DOMINANTE
// ============================================================
const dominantSentiment = computed(() => {
  if (!sentimentDistribution.value.length) return 'Neutral'
  return sentimentDistribution.value[0].label
})

// ============================================================
// COMENTARIOS DESTACADOS
// ============================================================
const relevantComments = computed(() => {
  return props.sentiments
    .filter((s) => s.uxLabel && s.uxLabel !== 'Neutral' && s.text)
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, 5)
})

function getSentimentColor(label: string): string {
  return getColor(label)
}
</script>