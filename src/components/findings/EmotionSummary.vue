<!-- components/findings/EmotionSummary.vue -->
<template>
  <div class="emotion-summary q-mb-md">
    <!-- Stats globales -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-orange text-weight-bold">
              {{ readings.length }}
            </div>
            <div class="text-caption text-grey-7">Lecturas totales</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-negative text-weight-bold">
              {{ negativePercent }}%
            </div>
            <div class="text-caption text-grey-7">Emociones negativas</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-positive text-weight-bold">
              {{ positivePercent }}%
            </div>
            <div class="text-caption text-grey-7">Emociones positivas</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h5 text-primary text-weight-bold">
              {{ dominantEmotion.emoji }} {{ dominantEmotion.label }}
            </div>
            <div class="text-caption text-grey-7">Emoción dominante</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Distribución completa -->
    <q-card bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">
          📊 Distribución de emociones detectadas
        </div>

        <div class="q-gutter-y-md">
          <div v-for="item in emotionDistribution" :key="item.emotion">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-grey-7">
                {{ item.emoji }} {{ item.label }}
              </div>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EmotionReading } from '@/types/evaluation'
import {
  getEmotionTemplate,
  isNegativeEmotion,
} from '@/types/expert/findings.dictionary'

const props = defineProps<{
  readings: EmotionReading[]
}>()

// ============================================================
// DISTRIBUCIÓN
// ============================================================
const emotionDistribution = computed(() => {
  if (!props.readings.length) return []

  const counts: Record<string, number> = {}
  props.readings.forEach((r) => {
    const emotion = (r.dominantEmotion || 'neutral').toLowerCase()
    counts[emotion] = (counts[emotion] || 0) + 1
  })

  return Object.entries(counts)
    .map(([emotion, count]) => {
      const tpl = getEmotionTemplate(emotion)
      return {
        emotion,
        count,
        percentage: Math.round((count / props.readings.length) * 100),
        label: tpl.labelEs,
        emoji: tpl.emoji,
        color: tpl.color,
      }
    })
    .sort((a, b) => b.count - a.count)
})

// ============================================================
// PORCENTAJES
// ============================================================
const negativePercent = computed(() => {
  if (!props.readings.length) return 0
  const negative = props.readings.filter((r) =>
    isNegativeEmotion(r.dominantEmotion || 'neutral'),
  ).length
  return Math.round((negative / props.readings.length) * 100)
})

const positivePercent = computed(() => {
  if (!props.readings.length) return 0
  const positive = props.readings.filter((r) => {
    const em = (r.dominantEmotion || 'neutral').toLowerCase()
    return ['happy', 'engagement', 'surprise'].includes(em)
  }).length
  return Math.round((positive / props.readings.length) * 100)
})

// ============================================================
// EMOCIÓN DOMINANTE
// ============================================================
const dominantEmotion = computed(() => {
  if (!emotionDistribution.value.length) {
    return { emoji: '😐', label: 'Neutral' }
  }
  return {
    emoji: emotionDistribution.value[0].emoji,
    label: emotionDistribution.value[0].label,
  }
})
</script>