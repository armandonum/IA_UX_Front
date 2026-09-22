<!-- components/figma/FigmaEmbed.vue - SOLO CLICS Y NAVEGACIÓN -->
<template>
  <div class="relative">
    <!-- 🔥 INFO: CLIENT ID solo para el embed -->
    <div class="q-mb-4 flex items-center gap-4">
      <q-input
        v-model="clientId"
        label="Client ID de Figma"
        filled
        dense
        class="flex-1"
        style="max-width: 420px"
        hint="Necesario para cargar el prototipo embebido"
      />
      <q-btn
        color="primary"
        icon="refresh"
        label="Cargar Prototipo"
        flat
        @click="reloadPrototype"
      />
      <q-btn
        color="info"
        icon="info"
        label="¿Cómo obtenerlo?"
        flat
        dense
        @click="showClientIdHelp"
      />
    </div>

    <!-- Controles de grabación -->
    <div v-if="isRecording" class="absolute top-4 left-4 z-10 flex items-center gap-3 bg-black/80 p-3 rounded-lg">
      <div class="flex items-center gap-2">
        <q-icon name="fiber_manual_record" color="negative" size="16px">
          <q-badge color="negative" class="q-ml-1 animate-pulse">REC</q-badge>
        </q-icon>
        <span class="text-white text-sm">Grabando... Paso {{ clicksCount + 1 }}</span>
      </div>
      <q-btn
        color="positive"
        icon="stop"
        label="Finalizar Grabación"
        size="sm"
        @click="stopRecording"
        :loading="saving"
      />
      <q-btn
        color="negative"
        icon="close"
        flat
        dense
        size="sm"
        @click="cancelRecording"
      />
    </div>

    <!-- Info del flujo -->
    <div v-if="flow" class="absolute top-4 right-4 z-10 bg-black/80 p-3 rounded-lg">
      <div class="text-white text-sm">
        <div class="font-semibold">{{ flow.name }}</div>
        <div class="text-xs text-slate-400">
          {{ flowClicks.length }} pasos grabados
        </div>
      </div>
    </div>

    <!-- 🔥 FIGMA PROTOTIPO EMBED -->
   <div class="w-full h-[600px] rounded-lg overflow-hidden border border-slate-700 bg-white">
      <iframe
        ref="figmaIframe"
        :src="prototypeUrl"
        width="100%"
        height="100%"
        allow="fullscreen"
        class="bg-white"
        @load="onIframeLoaded"
      />
    </div>

    <!-- 🔥 INPUT PARA REGISTRAR PASO MANUALMENTE -->
    <div v-if="isRecording" class="mt-4 flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/30">
      <div class="flex-1 flex items-center gap-3">
        <q-input
          v-model="stepDescription"
          label="Descripción del paso"
          dense
          filled
          class="flex-1"
          placeholder="Ej: Hacer clic en 'Registrarse'"
          @keyup.enter="addManualStep"
        />
        <q-btn
          v-if="selectedNodeId && getSelectedNodeName()"
          color="info"
          icon="check"
          label="Usar seleccionado"
          flat
          dense
          @click="useSelectedNode"
        />
      </div>
      <q-btn
        color="primary"
        icon="add"
        label="Registrar Paso"
        @click="addManualStep"
        :disable="!stepDescription"
      />
      <q-btn
        color="grey"
        icon="help"
        flat
        dense
        @click="showHelp"
      />
    </div>

    <!-- 📨 Último evento de Figma (debug) -->
    <div v-if="isRecording && lastFigmaEvent" class="mt-2 text-xs text-slate-400">
      <q-icon name="info" size="14px" />
      Último evento Figma: {{ lastFigmaEvent }}
    </div>

    <!-- Lista de pasos grabados -->
    <div v-if="flowClicks.length > 0" class="mt-4">
      <div class="flex justify-between items-center q-mb-2">
        <div class="text-sm font-semibold text-slate-300">Pasos Grabados ({{ flowClicks.length }})</div>
        <div class="text-sm text-slate-500">{{ flowClicks.length }} pasos</div>
      </div>
      <q-list bordered separator class="rounded-lg bg-slate-800 border-slate-700 max-h-40 overflow-auto">
        <q-item
          v-for="click in sortedClicks"
          :key="click.clickId"
          class="hover:bg-slate-700 transition-colors"
        >
          <q-item-section avatar>
            <div class="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">
              {{ click.orderIndex }}
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-slate-100">
              {{ click.nodeId }}
              <q-badge
                v-if="click.source === 'figma'"
                color="info"
                size="sm"
                class="q-ml-1"
              >
                ⚡ Auto
              </q-badge>
            </q-item-label>
            <q-item-label caption class="text-slate-500">
              {{ formatDate(click.clickedAt) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              v-if="!isRecording"
              icon="delete"
              flat
              dense
              size="sm"
              color="negative"
              @click="deleteClick(click.clickId)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useFlowApi } from '@/composables/useFlowApi'

const props = defineProps<{
  fileKey: string
  taskId: string
  projectId: string
  flowId?: string
  recording?: boolean
}>()

const emit = defineEmits<{
  (e: 'flow-created', flow: any): void
  (e: 'flow-finished', flow: any): void
  (e: 'click-added', click: any): void
  (e: 'recording-stopped'): void
}>()

const $q = useQuasar()
const flowApi = useFlowApi()

// ============================================================
// STATE
// ============================================================
const clientId = ref('')
const figmaIframe = ref<HTMLIFrameElement | null>(null)
const flow = ref<any>(null)
const flowClicks = ref<any[]>([])
const saving = ref(false)
const isRecording = ref(false)
const clicksCount = ref(0)
const currentOrderIndex = ref(0)
const stepDescription = ref('')
const selectedNodeId = ref<string | null>(null)
const lastFigmaEvent = ref<string | null>(null)
const isIframeReady = ref(false)

// ============================================================
// COMPUTED
// ============================================================
const prototypeUrl = computed(() => {
  const params = new URLSearchParams({
    'embed-host': 'share',
    'client-id': clientId.value,
    'node-id': '0-1',
  })
  return `https://embed.figma.com/proto/${props.fileKey}?${params.toString()}`
})

const sortedClicks = computed(() => {
  return [...flowClicks.value].sort((a, b) => a.orderIndex - b.orderIndex)
})

// ============================================================
// HELP
// ============================================================
const showClientIdHelp = () => {
  $q.dialog({
    title: '¿Cómo obtener tu Client ID de Figma?',
    message: `
      1. Ve a https://www.figma.com/developers/apps<br><br>
      2. Crea una nueva aplicación o selecciona una existente<br><br>
      3. Copia el "Client ID" de la sección "OAuth"<br><br>
      4. Pégalo en el campo de arriba<br><br>
      
      <strong>NOTA:</strong> Solo necesitas el Client ID para el embed, <strong>NO</strong> necesitas OAuth.
    `,
    html: true,
    ok: 'Entendido'
  })
}

const reloadPrototype = () => {
  if (figmaIframe.value) {
    figmaIframe.value.src = prototypeUrl.value
    $q.notify({
      type: 'info',
      message: '🔄 Recargando prototipo...'
    })
  }
}



// ============================================================
// REGISTRAR PASO MANUAL
// ============================================================
const getSelectedNodeName = () => {
  return stepDescription.value || ''
}

const useSelectedNode = () => {
  addManualStep()
}

const addManualStep = async () => {
  if (!flow.value || !isRecording.value) return
  if (!stepDescription.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Describe el paso'
    })
    return
  }

  currentOrderIndex.value += 1
  
  try {
    const click = await flowApi.createFlowClick({
      flowId: flow.value.flowId,
      orderIndex: currentOrderIndex.value,
      nodeId: stepDescription.value.trim(),
      presentedNodeId: null
    })
    
    flowClicks.value.push({ ...click, source: 'manual' })
    clicksCount.value = flowClicks.value.length
    
    emit('click-added', click)
    
    $q.notify({
      type: 'positive',
      message: `📍 Paso ${currentOrderIndex.value}: ${click.nodeId}`,
      timeout: 1500,
      position: 'bottom'
    })
    
    stepDescription.value = ''
  } catch (error) {
    console.error('Error:', error)
    $q.notify({ type: 'negative', message: 'Error al registrar paso' })
  }
}

// ============================================================
// 🔥 LISTENER DE FIGMA - SOLO CLICS Y NAVEGACIÓN
// ============================================================
const handleFigmaMessage = (event: MessageEvent) => {
  // Solo mensajes de Figma
  if (event.origin !== 'https://www.figma.com') return
  
  if (!isRecording.value || !flow.value) return
  
  const data = event.data
  if (!data?.type) return
  
  console.log('📨 Evento Figma:', data.type, data)
  lastFigmaEvent.value = data.type
  
  // 🔥 SOLO PROCESAR CLICS Y NAVEGACIÓN
  switch (data.type) {
    // ✅ CLIC EN EL PROTOTIPO
    case 'MOUSE_PRESS_OR_RELEASE':
      registerFigmaStep('interaction', '🖱️ Click en el prototipo')
      break
      
    // ✅ NAVEGACIÓN / CAMBIO DE PANTALLA
    case 'PRESENTED_NODE_CHANGED':
      const nodeId = data.data?.presentedNodeId || 'unknown'
      const nodeName = data.data?.presentedNodeName || `Pantalla ${nodeId}`
      registerFigmaStep(nodeId, nodeName)
      break
      
    // ❌ IGNORAR EL RESTO DE EVENTOS
    default:
      // No hacer nada con otros eventos
      break
  }
}

// ============================================================
// REGISTRAR PASO DESDE FIGMA
// ============================================================
const registerFigmaStep = async (nodeId: string, nodeName: string) => {
  if (!flow.value || !isRecording.value) return
  
  // Evitar duplicados consecutivos
  const lastClick = flowClicks.value[flowClicks.value.length - 1]
  if (lastClick && lastClick.presentedNodeId === nodeId && lastClick.source === 'figma') {
    return
  }

  currentOrderIndex.value += 1
  
  try {
    const click = await flowApi.createFlowClick({
      flowId: flow.value.flowId,
      orderIndex: currentOrderIndex.value,
      nodeId: nodeName,
      presentedNodeId: nodeId
    })
    
    flowClicks.value.push({ ...click, source: 'figma' })
    clicksCount.value = flowClicks.value.length
    
    emit('click-added', click)
    
    $q.notify({
      type: 'positive',
      message: `📍 Paso ${currentOrderIndex.value}: ${nodeName}`,
      timeout: 1500,
      position: 'bottom'
    })
  } catch (error) {
    console.error('Error al registrar paso automático:', error)
  }
}

// ============================================================
// RECORDING CONTROLS
// ============================================================
const onIframeLoaded = () => {
  isIframeReady.value = true
  console.log('✅ Figma prototype iframe cargado')
}

const startRecording = async () => {
  if (!clientId.value) {
    $q.notify({
      type: 'warning',
      message: 'Ingresa un Client ID de Figma para cargar el prototipo'
    })
    return
  }

  if (props.flowId) {
    flow.value = await flowApi.getFlowById(props.flowId)
    flowClicks.value = await flowApi.getFlowClicks(props.flowId)
    currentOrderIndex.value = flowClicks.value.length
  } else {
    const newFlow = await flowApi.createFlow({
      taskId: props.taskId,
      projectId: props.projectId,
      name: `Flujo - ${new Date().toLocaleString()}`
    })
    flow.value = newFlow
    emit('flow-created', newFlow)
  }

  isRecording.value = true
  clicksCount.value = flowClicks.value.length
  stepDescription.value = ''
  
  window.addEventListener('message', handleFigmaMessage)
  
  $q.notify({
    type: 'info',
    message: '🎬 Grabación iniciada. Haz clic en el prototipo o navega entre pantallas.',
    timeout: 3000
  })
}

const stopRecording = async () => {
  if (!flow.value) return

  saving.value = true
  try {
    await flowApi.finishFlow(flow.value.flowId)
    flow.value.status = 'completed'
    
    $q.notify({
      type: 'positive',
      message: `✅ Flujo grabado con ${flowClicks.value.length} pasos`
    })
    
    emit('flow-finished', flow.value)
    emit('recording-stopped')
  } finally {
    saving.value = false
    isRecording.value = false
    window.removeEventListener('message', handleFigmaMessage)
  }
}

const cancelRecording = () => {
  isRecording.value = false
  window.removeEventListener('message', handleFigmaMessage)
  emit('recording-stopped')
  $q.notify({
    type: 'warning',
    message: 'Grabación cancelada'
  })
}

const deleteClick = async (clickId: string) => {
  const confirm = await $q.dialog({
    title: 'Eliminar Paso',
    message: '¿Estás seguro de eliminar este paso?',
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: 'Cancelar'
  })

  if (confirm) {
    try {
      await flowApi.deleteFlowClick(clickId)
      flowClicks.value = flowClicks.value.filter(c => c.clickId !== clickId)
      
      const sorted = [...flowClicks.value].sort((a, b) => a.orderIndex - b.orderIndex)
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].orderIndex !== i + 1) {
          await flowApi.updateFlowClick(sorted[i].clickId, { orderIndex: i + 1 })
        }
      }
      
      $q.notify({ type: 'positive', message: 'Paso eliminado' })
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al eliminar paso' })
    }
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const showHelp = () => {
  $q.dialog({
    title: '📖 ¿Cómo grabar un flujo?',
    message: `
      🔹 Ingresa tu Client ID de Figma
      🔹 Haz clic en "Iniciar Grabación"
      🔹 Haz clic en el prototipo → se registra automáticamente 🖱️
      🔹 Cambia de pantalla → se registra automáticamente 📱
      🔹 O usa el registro manual para describir pasos específicos ✏️
      
      Los pasos automáticos se marcan con ⚡
      Los pasos manuales se marcan con ✏️
    `,
    ok: 'Entendido'
  })
}

// ============================================================
// LOAD EXISTING FLOW
// ============================================================
const loadExistingFlow = async () => {
  if (props.flowId) {
    try {
      flow.value = await flowApi.getFlowById(props.flowId)
      flowClicks.value = await flowApi.getFlowClicks(props.flowId)
      currentOrderIndex.value = flowClicks.value.length
    } catch (error) {
      console.error('Error al cargar flow:', error)
    }
  }
}

// ============================================================
// WATCHERS & LIFECYCLE
// ============================================================
watch(() => props.recording, (newVal) => {
  if (newVal && !isRecording.value) {
    startRecording()
  }
  if (!newVal && isRecording.value) {
    cancelRecording()
  }
})

onMounted(() => {
  loadExistingFlow()
  window.addEventListener('message', handleFigmaMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleFigmaMessage)
})

defineExpose({
  startRecording,
  stopRecording,
  cancelRecording,
  addManualStep,
  isRecording: () => isRecording.value,
  flow: () => flow.value,
  flowClicks: () => flowClicks.value
})
</script>

<style scoped>
.animate-pulse {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.z-10 {
  z-index: 10;
}
</style>