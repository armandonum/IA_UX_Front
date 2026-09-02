<template>
  <div class="bg-dark border-top border-grey-7 q-pa-sm q-px-md row items-center q-gutter-x-md no-wrap">
    <!-- Indicador de grabación -->
    <div class="row items-center q-gutter-xs">
      <q-icon
        :name="isRecording ? 'mdi-record' : 'mdi-microphone-off'"
        :color="isRecording ? 'negative' : 'grey-6'"
        size="18px"
      />
      <span class="text-caption" :class="isRecording ? 'text-negative' : 'text-grey-6'">
        {{ isRecording ? 'Grabando' : 'Pausado' }}
      </span>
      <q-badge v-if="isRecording" color="negative" rounded label="REC" class="text-weight-bold" />
    </div>

    <!-- Nivel de audio -->
    <div style="width: 100px">
      <div class="text-caption text-grey-6 q-mb-xs">Nivel de audio</div>
      <q-linear-progress
        :value="audioLevel / 100"
        :color="audioLevel > 50 ? 'positive' : 'grey-6'"
        track-color="grey-8"
        rounded
        size="6px"
      />
    </div>

    <!-- Texto transcrito -->
    <div class="col-4 ellipsis text-caption text-grey-4">
      {{ transcribedText || 'Esperando audio...' }}
    </div>

    <!-- Estado de IA -->
    <div class="row items-center q-gutter-xs no-wrap">
      <q-icon
        :name="isConnected ? 'mdi-check-circle' : 'mdi-clock'"
        :color="isConnected ? 'positive' : 'warning'"
        size="18px"
      />
      <span class="text-caption text-grey-5">
        IA {{ isConnected ? 'conectada' : 'conectando' }}
      </span>
    </div>

    <!-- Último sentimiento -->
    <div v-if="lastSentiment" class="row items-center no-wrap">
      <q-badge :color="getSentimentColor(lastSentiment.uxLabel)" rounded>
        {{ lastSentiment.uxLabel }}
        <span class="q-ml-xs text-white">{{ Math.round(lastSentiment.confidence * 100) }}%</span>
      </q-badge>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isRecording: boolean
  audioLevel: number
  transcribedText: string
  isConnected: boolean
  lastSentiment: { uxLabel: string; confidence: number } | null
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