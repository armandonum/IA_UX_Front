<!-- components/expert/cognitive/CognitivePrototype.vue -->
<template>
  <div class="flex flex-col h-full">
    <!-- Encabezado -->
    <div class="flex items-center justify-between q-mb-2">
      <div class="text-sm text-slate-400">
        <span class="font-semibold">Paso {{ currentStepIndex + 1 }} de {{ totalSteps }}</span>
        <span class="q-ml-2 text-slate-500">
          {{ currentStep?.nodeId || 'Esperando...' }}
        </span>
      </div>
      <div v-if="flowClicks.length > 0" class="text-xs text-slate-500">
        🔹 Flujo ideal: {{ flowClicks.length }} pasos
      </div>
    </div>

    <!-- Prototipo Figma -->
    <div class="flex-1 relative bg-white rounded-lg overflow-hidden border border-slate-700">
      <iframe
        ref="figmaIframe"
        :src="prototypeUrl"
        width="100%"
        height="100%"
        allow="fullscreen"
        class="bg-white"
        @load="onIframeLoaded"
      />
      
      <!-- Overlay de guía -->
      <div v-if="currentStep && !stepCompleted" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm max-w-md text-center">
        <q-icon name="info" class="q-mr-1" />
        <span class="font-semibold">Paso {{ currentStepIndex + 1 }}:</span>
        {{ currentStep.nodeId }}
        <span class="text-xs text-slate-400 q-ml-2">Realiza esta acción en el prototipo</span>
      </div>

      <!-- Controles de navegación -->
      <div v-if="flowClicks.length > 0" class="absolute top-4 left-4 z-10 flex gap-2">
        <q-btn
          flat
          dense
          round
          color="white"
          icon="chevron_left"
          size="sm"
          class="bg-black/50"
          :disable="currentStepIndex === 0"
          @click="$emit('prev-step')"
        />
        <q-btn
          flat
          dense
          round
          color="white"
          icon="chevron_right"
          size="sm"
          class="bg-black/50"
          :disable="currentStepIndex >= flowClicks.length - 1"
          @click="$emit('next-step')"
        />
      </div>
    </div>

    <!-- Video de cámara (mini) -->
    <video
      ref="faceVideoEl"
      autoplay
      playsinline
      muted
      class="absolute bottom-4 right-4 w-32 h-24 rounded-lg border-2 border-slate-600 object-cover"
      style="z-index: 10;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  fileKey: string
  taskId: string
  flowClicks: any[]
  currentStepIndex: number
}>()

const emit = defineEmits<{
  (e: 'event', data: any): void
  (e: 'prev-step'): void
  (e: 'next-step'): void
  (e: 'step-completed'): void
}>()

const figmaIframe = ref<HTMLIFrameElement | null>(null)
const faceVideoEl = ref<HTMLVideoElement | null>(null)
const stepCompleted = ref(false)

const currentStep = computed(() => {
  return props.flowClicks[props.currentStepIndex] || null
})

const totalSteps = computed(() => props.flowClicks.length)

const prototypeUrl = computed(() => {
  const params = new URLSearchParams({
    'embed-host': 'share',
    'node-id': '0-1',
  })
  return `https://embed.figma.com/proto/${props.fileKey}?${params.toString()}`
})

const onIframeLoaded = () => {
  console.log('✅ Prototipo Figma cargado')
}

const setFaceStream = (stream: MediaStream) => {
  if (faceVideoEl.value) {
    faceVideoEl.value.srcObject = stream
  }
}

const captureFrame = (): string | null => {
  const video = faceVideoEl.value
  if (!video || !video.videoWidth) return null

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(video, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.8)
}

// Listener de mensajes de Figma
const handleFigmaMessage = (event: MessageEvent) => {
  if (event.origin !== 'https://www.figma.com') return
  
  const data = event.data
  if (!data?.type) return

  // Emitir evento
  emit('event', {
    type: data.type,
    nodeId: data.data?.presentedNodeId,
    screenName: data.data?.presentedNodeName,
    payload: data.data,
  })

  // Si es un clic o navegación, marcar paso como completado
  if (data.type === 'MOUSE_PRESS_OR_RELEASE' || data.type === 'PRESENTED_NODE_CHANGED') {
    if (!stepCompleted.value && currentStep.value) {
      stepCompleted.value = true
      emit('step-completed')
    }
  }
}

// Resetear estado cuando cambia el paso
watch(() => props.currentStepIndex, () => {
  stepCompleted.value = false
})

// Lifecycle
onMounted(() => {
  window.addEventListener('message', handleFigmaMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleFigmaMessage)
})

// Exponer métodos
defineExpose({
  setFaceStream,
  captureFrame,
})
</script>