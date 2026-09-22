<!-- components/estudiante/figma/AudioTranscriptionBar.vue -->

<template>
  <div
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700 shadow-xl"
    style="width: 90%; max-width: 600px;"
  >
    <!-- Barra de estado -->
    <div class="flex items-center gap-3 p-3">
      <!-- Indicador de grabación -->
      <div class="flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full"
          :class="isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'"
        />
        <span class="text-xs text-slate-400">
          {{ isRecording ? 'Grabando' : 'Inactivo' }}
        </span>
      </div>

      <!-- Nivel de audio -->
      <div class="flex-1 h-1 bg-slate-700 rounded overflow-hidden">
        <div
          class="h-full bg-blue-500 transition-all duration-100"
          :style="{ width: audioLevel * 100 + '%' }"
        />
      </div>

      <!-- Control de grabación -->
      <q-btn
        :color="isRecording ? 'negative' : 'primary'"
        :icon="isRecording ? 'stop' : 'mic'"
        round
        dense
        size="sm"
        @click="toggleRecording"
      />

      <!-- Texto transcrito -->
      <div class="flex-1 min-w-0">
        <div class="text-xs text-slate-300 truncate" :title="transcribedText || 'Esperando audio...'">
          {{ transcribedText || '🎤 Habla para transcribir...' }}
        </div>
        <div v-if="lastSentiment" class="text-[10px] text-slate-400 flex items-center gap-2">
          <span>🧠 {{ lastSentiment.uxLabel }}</span>
          <span class="text-slate-600">|</span>
          <span>🎯 {{ (lastSentiment.confidence * 100).toFixed(0) }}%</span>
        </div>
      </div>

      <!-- Estado de conexión con IA -->
      <div class="flex items-center gap-1">
        <q-icon
          :name="isConnected ? 'check_circle' : 'sync'"
          :color="isConnected ? 'positive' : 'warning'"
          size="16px"
        />
        <span class="text-[10px] text-slate-500">
          {{ isConnected ? 'IA lista' : 'Conectando...' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  isRecording: boolean
  audioLevel: number
  transcribedText: string
  isConnected: boolean
  lastSentiment: {
    uxLabel: string
    confidence: number
  } | null
}>()

const emit = defineEmits<{
  (e: 'toggle-recording'): void
}>()

function toggleRecording() {
  emit('toggle-recording')
}
</script>