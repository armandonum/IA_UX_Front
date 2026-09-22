<!-- Inspector.vue - Actualizado con botón de hallazgo -->
<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="flex items-center justify-between q-mb-xs">
        <div class="text-subtitle2 text-dark">
          📍 En este momento ({{ formatTiempoS(currentTime) }})
        </div>
        <q-btn
          color="primary"
          icon="add_alert"
          label="Registrar Hallazgo"
          size="sm"
          @click="openFindingForm"
          :disable="!isFormReady"
          :loading="loading"
        />
      </div>

      <div class="row q-col-gutter-sm">
        <!-- Evento cercano -->
        <div class="col">
          <q-card flat bordered class="bg-grey-1">
            <q-card-section class="q-pa-xs">
              <div class="text-caption text-grey-6 flex items-center">
                <q-icon name="event" size="12px" class="q-mr-xs" />
                Evento cercano
              </div>
              <div class="text-caption text-dark">
                {{ traducirEvento(nearestEvent?.event_type) }}
              </div>
              <div v-if="nodeId" class="text-caption text-grey-6 text-[10px] flex items-center q-mt-xs">
                <q-icon name="layers" size="10px" class="q-mr-xs" />
                {{ getNodeName(nodeId) }}
                <span v-if="getNodeType(nodeId) !== '—'" class="q-ml-xs text-grey-5">
                  ({{ getNodeType(nodeId) }})
                </span>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Emoción cercana -->
        <div class="col">
          <q-card flat bordered class="bg-grey-1">
            <q-card-section class="q-pa-xs">
              <div class="text-caption text-grey-6 flex items-center">
                <q-icon name="sentiment_satisfied" size="12px" class="q-mr-xs" />
                Emoción cercana
              </div>
              <div class="text-body2 text-dark flex items-center">
                {{ traducirEmocion(nearestEmotionLabel) }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Comentarios cercanos -->
        <div class="col">
          <q-card flat bordered class="bg-grey-1">
            <q-card-section class="q-pa-xs">
              <div class="text-caption text-grey-6 flex items-center">
                <q-icon name="chat" size="12px" class="q-mr-xs" />
                Comentarios en ±2s
              </div>
              <div class="text-body2 text-dark">
                {{ commentsNear }}
                <span class="text-caption text-grey-6 q-ml-xs">
                  {{ commentsNear === 1 ? 'comentario' : 'comentarios' }}
                </span>
              </div>
              <!-- Botón para ver el comentario más cercano -->
              <q-btn
                v-if="nearestComment"
                flat
                dense
                size="xs"
                color="primary"
                label="Ver comentario"
                @click="$emit('show-comment', nearestComment)"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Sentimiento cercano (si existe) -->
      <div v-if="nearestSentiment" class="q-mt-xs q-pa-xs bg-purple-50 rounded border border-purple-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1">
            <q-icon name="psychology" size="14px" color="purple" />
            <span class="text-caption text-dark">Sentimiento:</span>
            <q-chip
              :color="getSentimentColor(nearestSentiment.uxLabel)"
              text-color="white"
              size="sm"
              dense
            >
              {{ nearestSentiment.uxLabel }}
            </q-chip>
            <span class="text-caption text-grey-6">
              {{ (nearestSentiment.confidence * 100).toFixed(0) }}% confianza
            </span>
          </div>
          <span class="text-caption text-grey-6 font-mono">
            "{{ truncateText(nearestSentiment.text, 50) }}"
          </span>
        </div>
      </div>

      <!-- 📌 Botón de hallazgo en el momento exacto -->
      <div class="q-mt-xs text-right">
        <q-btn
          color="primary"
          icon="add_alert"
          label="Registrar Hallazgo en este momento"
          size="sm"
          flat
          @click="openFindingForm"
          :disable="!isFormReady"
        />
        <span v-if="!isFormReady" class="text-caption text-grey-6 q-ml-sm">
          (No hay datos de contexto disponibles)
        </span>
      </div>
    </q-card-section>

    <!-- Formulario rápido de hallazgo -->
    <FindingsQuickForm
      v-model="showFindingForm"
      :ms="currentTime"
      :task-name="taskName"
      :evaluation-id="evaluationId"
      :session-id="sessionId"
      :task-id="taskId"
      :nearest-event="nearestEvent"
      :emotion-label="nearestEmotionLabel"
      :sentiment-label="nearestSentiment?.uxLabel"
      :nearest-comment="nearestComment"
      @save="$emit('create-finding', $event)"
      @close="showFindingForm = false"
    />
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FindingsQuickForm from '@/components/findings/FindingsQuickForm.vue'

const props = defineProps<{
  currentTime: number
  nearestEvent: any | null
  nearestEmotionLabel: string
  commentsNear: number
  nearestComment?: any
  nearestSentiment?: any
  taskName?: string
  evaluationId: string
  sessionId: string
  taskId?: string
  getNodeName: (id: string) => string
  getNodeType: (id: string) => string
  getNodeIdFromEvent: (ev: any) => string
}>()

const emit = defineEmits<{
  (e: 'create-finding', data: any): void
  (e: 'show-comment', comment: any): void
}>()

const showFindingForm = ref(false)
const loading = ref(false)

const isFormReady = computed(() => {
  return !!(props.evaluationId && props.sessionId)
})

const nodeId = computed(() => {
  if (!props.nearestEvent) return null
  return props.getNodeIdFromEvent(props.nearestEvent)
})

const openFindingForm = () => {
  if (isFormReady.value) {
    showFindingForm.value = true
  }
}

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function truncateText(text: string, maxLength: number) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const traduccionesEventos: Record<string, string> = {
  'INITIAL_LOAD': 'Carga inicial',
  'PRESENTED_NODE_CHANGED': 'Cambio de pantalla',
  'NEW_STATE': 'Nuevo estado',
  'MOUSE_PRESS_OR_RELEASE': 'Click del mouse',
  'CLICK': 'Click',
  'SCROLL': 'Desplazamiento',
  'NAVIGATION': 'Navegación',
}

function traducirEvento(eventType: string | undefined): string {
  if (!eventType) return '—'
  return traduccionesEventos[eventType] || eventType.replace(/_/g, ' ').toLowerCase()
}

const emotionLabelsEs: Record<string, string> = {
  happy: '🙂 Felicidad',
  sad: '🙁 Tristeza',
  angry: '😠 Enojo',
  surprise: '😮 Sorpresa',
  disgust: '😖 Asco',
  fear: '😨 Miedo',
  neutral: '😐 Neutral',
}

function traducirEmocion(emocion: string): string {
  if (!emocion || emocion === '—') return '—'
  return emotionLabelsEs[emocion.toLowerCase()] || emocion
}

function getSentimentColor(label: string): string {
  const colors: Record<string, string> = {
    'Confusión': 'orange',
    'Frustración': 'red',
    'Satisfacción': 'green',
    'Desconfianza': 'grey',
    'Dificultad / esfuerzo': 'orange',
    'Rechazo': 'red',
    'Interés / motivación': 'blue',
    'Aburrimiento': 'grey',
    'Sorpresa': 'yellow',
    'Alivio': 'green',
    'Neutral': 'grey',
  }
  return colors[label] || 'primary'
}
</script>