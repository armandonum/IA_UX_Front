
<!-- components/experto/heuristic/HeuristicAudioBar.vue -->
<template>
  <div
    class="fixed bottom-16 left-0 right-0 z-10 q-pa-sm bg-dark border-top"
    style="border-top: 1px solid rgba(255, 255, 255, 0.12)"
  >
    <div class="row items-center q-gutter-x-md">
      <!-- Indicador de grabación -->
      <div class="row items-center q-gutter-x-sm">
        <q-icon
          :name="isRecording ? 'fiber_manual_record' : 'mic_off'"
          :color="isRecording ? 'negative' : 'grey-6'"
          size="16px"
        />
        <span
          class="text-caption"
          :class="isRecording ? 'text-negative' : 'text-grey-6'"
        >
          {{ isRecording ? 'Grabando' : 'Pausado' }}
        </span>
        <q-badge
          v-if="isRecording"
          color="negative"
          rounded
          label="REC"
          class="text-weight-bold"
        />
      </div>

      <!-- Nivel de audio -->
      <div style="width: 100px">
        <div class="text-caption text-grey-6 q-mb-xs">Nivel de audio</div>
        <q-linear-progress
          :value="audioLevel / 100"
          :color="audioLevel > 50 ? 'positive' : 'grey-6'"
          track-color="grey-8"
          rounded
          size="5px"
        />
      </div>

      <!-- Texto transcrito -->
      <div class="col ellipsis">
        <div v-if="transcribedText" class="text-caption text-grey-3 ellipsis">
          {{ transcribedText }}
        </div>
        <div v-else class="text-caption text-grey-6">Esperando audio...</div>
      </div>

      <!-- Estado de IA -->
      <div class="row items-center q-gutter-x-sm no-wrap">
        <q-icon
          :name="isConnected ? 'check_circle' : 'pending'"
          :color="isConnected ? 'positive' : 'warning'"
          size="17px"
        />
        <span class="text-caption text-grey-5">
          IA {{ isConnected ? 'conectada' : 'conectando' }}
        </span>
      </div>

      <!-- Último sentimiento -->
      <div v-if="lastSentiment" class="row items-center no-wrap">
        <q-badge :color="getSentimentColor(lastSentiment.uxLabel)" rounded>
          {{ lastSentiment.uxLabel }}
          <span class="q-ml-xs text-white">
            {{ Math.round(lastSentiment.confidence * 100) }}%
          </span>
        </q-badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isRecording: boolean
  audioLevel: number
  transcribedText: string
  isConnected: boolean
  lastSentiment: {
    uxLabel: string
    confidence: number
  } | null
}>()

const getSentimentColor = (label: string) => {
  const colors: Record<string, string> = {
    Positivo: 'positive',
    Negativo: 'negative',
    Neutral: 'grey',
    Satisfacción: 'positive',
    Frustración: 'negative',
    Confusión: 'warning',
  }
  return colors[label] || 'grey'
}
</script>

<style scoped>
.bg-dark {
  background-color: #1d1d1d;
}
</style>