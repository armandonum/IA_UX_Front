<!-- components/coordinador/heuristic/detail/HeuristicInspector.vue -->
<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="text-subtitle2 text-dark q-mb-sm">
        📍 En este momento ({{ formatTimeMs(currentTime) }})
      </div>

      <div class="row q-col-gutter-sm">
        <!-- Evento -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-grey-1">
            <q-card-section class="q-pa-xs">
              <div class="text-caption text-grey-6 flex items-center">
                <q-icon name="event" size="12px" class="q-mr-xs" />
                Evento
              </div>
              <div class="text-caption text-dark">
                {{ eventLabel }}
              </div>
              <div
                v-if="nodeId"
                class="text-caption text-grey-6 flex items-center q-mt-xs"
                style="font-size: 10px"
              >
                <q-icon name="layers" size="10px" class="q-mr-xs" />
                {{ getNodeName(nodeId) }}
                <span
                  v-if="getNodeType(nodeId) !== '—'"
                  class="q-ml-xs text-grey-5"
                >
                  ({{ getNodeType(nodeId) }})
                </span>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Emoción -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-grey-1">
            <q-card-section class="q-pa-xs">
              <div class="text-caption text-grey-6 flex items-center">
                <q-icon name="sentiment_satisfied" size="12px" class="q-mr-xs" />
                Emoción
              </div>
              <div class="text-caption text-dark">
                {{ emotionLabel }}
              </div>
              <div v-if="emotionConfidence" class="text-caption text-grey-6">
                {{ (emotionConfidence * 100).toFixed(0) }}%
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Sentimiento -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-grey-1">
            <q-card-section class="q-pa-xs">
              <div class="text-caption text-grey-6 flex items-center">
                <q-icon name="psychology" size="12px" class="q-mr-xs" />
                Sentimiento
              </div>
              <div v-if="nearestSentiment" class="text-caption text-dark">
                <q-badge
                  :color="getSentimentColor(nearestSentiment.uxLabel)"
                  :label="nearestSentiment.uxLabel"
                  class="q-mr-xs"
                />
              </div>
              <div v-else class="text-caption text-grey-5">—</div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Observación -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-orange-1">
            <q-card-section class="q-pa-xs">
              <div class="text-caption text-grey-6 flex items-center">
                <q-icon name="report_problem" size="12px" class="q-mr-xs" />
                Observación
              </div>
              <div v-if="nearestObservation" class="text-caption text-dark">
                <q-badge
                  :color="getSeverityColor(nearestObservation.severity)"
                  :label="`Severidad ${nearestObservation.severity}`"
                  class="q-mr-xs"
                />
              </div>
              <div v-else class="text-caption text-grey-5">—</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Descripción de observación cercana -->
      <div
        v-if="nearestObservation"
        class="q-mt-sm q-pa-xs bg-orange-2 rounded-borders"
      >
        <div class="text-caption text-grey-7">
          <q-icon name="info" size="12px" />
          Observación cercana:
        </div>
        <div class="text-caption text-dark q-mt-xs">
          "{{ nearestObservation.description }}"
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  getEventTypeLabel,
  SEVERITY_COLORS,
} from '@/data/heuristicFindingsDictionary'

const props = defineProps<{
  currentTime: number
  nearestEvent: any | null
  nearestEmotion: any | null
  nearestSentiment: any | null
  nearestComment: any | null
  nearestObservation: any | null
  taskName?: string
  getNodeName: (id: string) => string
  getNodeType: (id: string) => string
  getNodeIdFromEvent: (ev: any) => string
}>()

const eventLabel = computed(() => {
  if (!props.nearestEvent) return '—'
  return getEventTypeLabel(props.nearestEvent.event_type)
})

const nodeId = computed(() => {
  if (!props.nearestEvent) return null
  return props.getNodeIdFromEvent(props.nearestEvent)
})

const emotionLabel = computed(() => {
  if (!props.nearestEmotion) return '—'
  const em = props.nearestEmotion
  const emotion = em.dominantEmotion || em.emotion || 'N/A'
  return emotion
})

const emotionConfidence = computed(() => {
  if (!props.nearestEmotion?.scoresJson) return null
  const scores = props.nearestEmotion.scoresJson
  const emotion = props.nearestEmotion.dominantEmotion
  return scores[emotion] ?? null
})

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

function getSeverityColor(severity: number): string {
  return SEVERITY_COLORS[
    (['low', 'low', 'medium', 'high', 'critical'][severity] || 'medium') as keyof typeof SEVERITY_COLORS
  ] || 'warning'
}
</script>

<style scoped>
.bg-orange-1 {
  background-color: #fff3e0;
}
.bg-orange-2 {
  background-color: #ffe0b2;
}
.bg-grey-1 {
  background-color: #f5f5f5;
}
</style>