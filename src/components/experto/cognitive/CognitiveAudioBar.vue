<!-- components/experto/cognitive/CognitiveAudioBar.vue -->
<template>
  <div class="audio-bar q-px-md q-py-sm row items-center q-gutter-md no-wrap">
    <!-- Grabando -->
    <div class="row items-center q-gutter-xs no-wrap">
      <q-icon
        :name="isRecording ? 'fiber_manual_record' : 'mic_off'"
        :color="isRecording ? 'negative' : 'grey-5'"
        size="18px"
        :class="{ 'pulse': isRecording }"
      />
      <span
        class="text-caption"
        :class="isRecording ? 'text-negative text-weight-medium' : 'text-grey-6'"
      >
        {{ isRecording ? 'Grabando' : 'Pausado' }}
      </span>
      <q-badge
        v-if="isRecording"
        color="negative"
        text-color="white"
        label="REC"
        class="q-ml-xs"
      />
    </div>

    <!-- Nivel de audio -->
    <div style="width: 120px;">
      <q-linear-progress
        :value="audioLevel / 100"
        :color="audioLevel > 50 ? 'positive' : 'primary'"
        track-color="grey-3"
        rounded
        size="6px"
      />
    </div>

    <!-- Transcripción -->
    <div class="col ellipsis text-caption text-grey-7">
      <q-icon name="record_voice_over" size="14px" class="q-mr-xs" />
      {{ transcribedText || 'Esperando audio...' }}
    </div>

    <!-- Estado IA -->
    <div class="row items-center q-gutter-xs no-wrap">
      <q-icon
        :name="isConnected ? 'check_circle' : 'schedule'"
        :color="isConnected ? 'positive' : 'warning'"
        size="16px"
      />
      <span class="text-caption text-grey-6">
        IA {{ isConnected ? 'lista' : 'conectando' }}
      </span>
    </div>

    <!-- Último sentimiento -->
    <div v-if="lastSentiment" class="row items-center no-wrap">
      <q-chip
        :color="getSentimentColor(lastSentiment.uxLabel)"
        text-color="white"
        dense
        size="sm"
      >
        {{ lastSentiment.uxLabel }}
        <span class="q-ml-xs">
          {{ Math.round(lastSentiment.confidence * 100) }}%
        </span>
      </q-chip>
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

function getSentimentColor(label: string): string {
  const colors: Record<string, string> = {
    Positivo: 'positive',
    Satisfacción: 'positive',
    Alivio: 'positive',
    Negativo: 'negative',
    Frustración: 'negative',
    Rechazo: 'negative',
    Confusión: 'warning',
    'Dificultad / esfuerzo': 'warning',
    Neutral: 'grey-6',
  }
  return colors[label] || 'grey-6'
}
</script>

<style scoped>
.audio-bar {
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
  min-height: 48px;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pulse {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>