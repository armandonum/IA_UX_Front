<!-- components/experto/cognitive/CognitivePrototype.vue -->
<template>
  <div class="prototype-wrapper">
    <!-- Header del paso actual -->
    <div class="prototype-header q-px-md q-py-sm row items-center q-gutter-md no-wrap">
      <q-chip
        color="primary"
        text-color="white"
        dense
        size="sm"
        icon="adjust"
      >
        Paso {{ currentStepIndex + 1 }} / {{ totalSteps || '?' }}
      </q-chip>

      <div class="col ellipsis text-body2 text-grey-8">
        <q-icon name="touch_app" size="16px" class="q-mr-xs text-primary" />
        {{ currentStep?.nodeId || 'Esperando acción...' }}
      </div>

      <q-badge
        v-if="stepCompleted"
        color="positive"
        text-color="white"
        class="q-mr-xs"
      >
        <q-icon name="check" size="12px" class="q-mr-xs" />
        Completado
      </q-badge>
    </div>

    <!-- Iframe de Figma -->
    <div class="prototype-iframe-container">
      <iframe
        ref="figmaIframe"
        :src="prototypeUrl"
        width="100%"
        height="100%"
        allow="fullscreen"
        class="prototype-iframe"
        @load="onIframeLoaded"
      />
    </div>

    <!-- Overlay de guía -->
    <transition name="fade">
      <div
        v-if="currentStep && !stepCompleted"
        class="step-guide"
      >
        <q-icon name="info" size="18px" class="q-mr-xs" />
        <span class="text-weight-medium">Paso {{ currentStepIndex + 1 }}:</span>
        <span class="q-ml-xs">{{ currentStep.nodeId }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  fileKey: string
  taskId?: string
  flowClicks: any[]
  currentStepIndex: number
}>()

const emit = defineEmits<{
  (e: 'event', data: any): void
  (e: 'step-completed'): void
}>()

const figmaIframe = ref<HTMLIFrameElement | null>(null)
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

function onIframeLoaded() {
  console.log('✅ Prototipo Figma cargado')
}

function handleFigmaMessage(event: MessageEvent) {
  if (event.origin !== 'https://www.figma.com') return

  const data = event.data
  if (!data?.type) return

  emit('event', {
    type: data.type,
    nodeId: data.data?.presentedNodeId,
    screenName: data.data?.presentedNodeName,
    payload: data.data,
  })

  if (
    data.type === 'MOUSE_PRESS_OR_RELEASE' ||
    data.type === 'PRESENTED_NODE_CHANGED'
  ) {
    if (!stepCompleted.value && currentStep.value) {
      stepCompleted.value = true
      emit('step-completed')
    }
  }
}

watch(
  () => props.currentStepIndex,
  () => {
    stepCompleted.value = false
  },
)

onMounted(() => {
  window.addEventListener('message', handleFigmaMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleFigmaMessage)
})

defineExpose({
  captureFrame: () => null,
})
</script>

<style scoped>
.prototype-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.prototype-header {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  min-height: 48px;
  flex-shrink: 0;
}

.prototype-iframe-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: white;
  min-height: 0;
}

.prototype-iframe {
  border: none;
  display: block;
  width: 100%;
  height: 100%;
}

.step-guide {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.9);
  color: white;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  pointer-events: none;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>