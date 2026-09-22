<!-- CommentModal.vue - -->
<template>
  <q-dialog v-model="localShow" persistent>
    <q-card style="min-width:400px; max-width:500px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-dark">
          <q-icon name="comment" color="primary" class="q-mr-sm" />
          Detalle del comentario
        </div>
        <q-space />
        <q-btn dense flat icon="close" @click="closeModal" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-sm">
        <!-- Información del momento -->
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-6">
            <div class="text-caption text-grey-6">
              <q-icon name="schedule" size="14px" class="q-mr-xs" />
              Momento
            </div>
            <div class="text-caption text-dark font-mono">
              {{ formatTiempoS(ms) }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-6">
              <q-icon name="sentiment_satisfied" size="14px" class="q-mr-xs" />
              Emoción
            </div>
            <div class="text-caption text-dark">
              {{ traducirEmocion(nearestEmotionLabel) }}
            </div>
          </div>
        </div>

        <!-- Evento cercano -->
        <div class="q-mb-sm q-pa-xs bg-grey-1 rounded">
          <div class="text-caption text-grey-6">
            <q-icon name="event" size="14px" class="q-mr-xs" />
            Evento cercano
          </div>
          <div class="text-caption text-dark">
            {{ traducirEvento(nearestEvent?.event_type) }}
          </div>
          <div v-if="nearestEvent?.node_id" class="text-caption text-grey-6 text-[10px]">
            🏷️ Nodo: {{ nearestEvent.node_id }}
          </div>
        </div>

        <q-separator class="q-my-sm" />

        <!-- Contenido del comentario -->
        <div>
          <div class="text-caption text-grey-6">
            <q-icon name="chat" size="14px" class="q-mr-xs" />
            Comentario
          </div>
          <div class="text-body2 text-dark q-mt-xs q-pa-sm bg-grey-2 rounded" style="white-space: pre-wrap; word-break: break-word; max-height: 200px; overflow-y: auto;">
            {{ localText || '—' }}
          </div>
        </div>

        <!-- Metadatos del comentario -->
        <div v-if="editingId" class="text-caption text-grey-6 q-mt-sm">
          <q-icon name="info" size="14px" class="q-mr-xs" />
          Comentario registrado por el usuario
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md q-pt-none">
        <q-btn flat label="Cerrar" @click="closeModal" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  ms: number
  text: string
  editingId: string | null
  nearestEvent: any | null
  nearestEmotionLabel: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const localShow = ref(props.modelValue)
const localText = ref(props.text)

watch(() => props.modelValue, (val) => {
  localShow.value = val
  if (val) {
    localText.value = props.text
  }
})

watch(() => props.text, (val) => {
  localText.value = val
})

watch(localShow, (val) => {
  emit('update:modelValue', val)
})

function closeModal() {
  localShow.value = false
  emit('close')
}

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

// ============================================================
// TRADUCCIONES
// ============================================================

const traduccionesEventos: Record<string, string> = {
  'INITIAL_LOAD': 'Carga inicial',
  'PRESENTED_NODE_CHANGED': 'Cambio de pantalla',
  'NEW_STATE': 'Nuevo estado',
  'MOUSE_PRESS_OR_RELEASE': 'Click del mouse',
  'CLICK': 'Click',
  'SCROLL': 'Desplazamiento',
  'KEYDOWN': 'Tecla presionada',
  'KEYUP': 'Tecla liberada',
  'MOUSE_MOVE': 'Movimiento del mouse',
  'MOUSE_ENTER': 'Mouse entró',
  'MOUSE_LEAVE': 'Mouse salió',
  'FOCUS': 'Enfocado',
  'BLUR': 'Perdió foco',
  'CHANGE': 'Cambio de valor',
  'SUBMIT': 'Envío',
  'RESET': 'Reinicio',
  'SELECT': 'Selección',
  'INPUT': 'Entrada de texto',
  'DRAG': 'Arrastre',
  'DROP': 'Soltar',
  'LOAD': 'Carga',
  'ERROR': 'Error',
  'RESIZE': 'Redimensionado',
  'TOUCH_START': 'Inicio de toque',
  'TOUCH_END': 'Fin de toque',
  'TOUCH_MOVE': 'Movimiento táctil',
  'GESTURE': 'Gesto',
  'NAVIGATION': 'Navegación',
  'TRANSITION': 'Transición',
  'ANIMATION': 'Animación',
  'MEDIA_PLAY': 'Reproducción',
  'MEDIA_PAUSE': 'Pausa',
  'MEDIA_END': 'Fin de reproducción',
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
  confusion: '😕 Confusión',
  frustration: '😤 Frustración',
}

function traducirEmocion(emocion: string): string {
  if (!emocion || emocion === '—') return '—'
  return emotionLabelsEs[emocion.toLowerCase()] || emocion
}
</script>