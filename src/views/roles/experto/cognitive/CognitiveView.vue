<template>
  <div class="q-pa-sm full-height">

    
    <!-- ============================================================
         ASIGNACIÓN DE EVALUACIÓN
    ============================================================= -->
    <CognitiveAssignModal
      v-if="status === 'assign'"
      :evaluations="evaluations"
      :loading="loadingEvaluations"
      @select="selectEvaluation"
    />

    <!-- ============================================================
         LISTA DE TAREAS
    ============================================================= -->
    <CognitiveTaskList
      v-else-if="status === 'tasklist'"
      :tasks="tasks"
      :completed-task-ids="completedTaskIds"
      :loading="loadingTasks"
      :evaluation-name="selectedEvaluation?.name"
      @select="selectTask"
    />

    <!-- ============================================================
         INICIO DE TAREA
    ============================================================= -->
    <CognitiveTaskStart
      v-else-if="status === 'idle'"
      :task="currentTask"
      :camara-lista="camaraLista"
      :pantalla-lista="pantallaLista"
      :flow-clicks="flowClicks"
      :loading="loadingStart"
      @iniciar="iniciarRecorrido"
    />
<!-- Estado: Recorrido en curso -->
    <template v-else-if="status === 'running'">
      <div class="row full-height no-wrap">
        <!-- Columna izquierda: Prototipo -->
        <div class="col-12 col-md-8 col-lg-9 q-pa-sm">
          <div class="full-height rounded-borders border border-grey-7 overflow-hidden">
            <CognitivePrototype
              ref="prototypeRef"
              :file-key="fileKey"
              :task-id="currentTask?.projectTaskId"
              :flow-clicks="flowClicks"
              :current-step-index="currentStepIndex"
              @event="onFigmaEvent"
              @next-step="nextStep"
            />
          </div>
        </div>

        <!-- Columna derecha: Preguntas -->
        <div class="col-12 col-md-4 col-lg-3 q-pa-sm">
          <div class="full-height rounded-borders border border-grey-7 overflow-y-auto">
            <CognitiveQuestions
              :task="currentTask"
              :flow-clicks="flowClicks"
              :current-step-index="currentStepIndex"
              :total-steps="flowClicks.length"
              :is-last-step="isLastStep"
              :is-completed="isTaskCompleted"
              @save="onResponseSaved"
              @skip="onResponseSkipped"
              @complete="onTaskComplete"
              @next-step="nextStep"
            />
          </div>
        </div>
      </div>

      <!-- Barra de estado -->
      <CognitiveStatusBar
        :tiempo="getTimeFormatted()"
        :emocion-emoji="emocionActualEmoji"
        :emocion-label="emocionActualLabel"
        :progress="progress"
        :task-name="currentTask?.title"
        @finalizar="finalizarRecorrido"
      />

      <!-- Barra de audio -->
      <CognitiveAudioBar
        :is-recording="isAudioRecording"
        :audio-level="audioLevel"
        :transcribed-text="transcribedText"
        :is-connected="isTextAIConnected"
        :last-sentiment="lastSentiment"
      />
    </template>

    <!-- Estado: Tarea completada -->
    <CognitiveTaskComplete
      v-else-if="status === 'task-finished'"
      :task="currentTask"
      :tiempo-formateado="getTimeFormatted()"
      :eventos-registrados="eventosRegistrados"
      :lecturas-emocion="lecturasEmocion"
      :quedan-tareas="tareasPendientes.length > 0"
      @continuar="volverALista"
    />

    <!-- Estado: Evaluación finalizada -->
    <CognitiveFinished
      v-else-if="status === 'finished'"
      :total-tareas="totalTareas"
      :tiempo-total="tiempoTotalFormateado"
      :eventos-totales="eventosTotales"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth.store'
import { useCognitiveApi } from '@/composables/useCognitiveApi'
import { useCognitiveSession } from '@/composables/useCognitiveSession'
import { useAudioRecorder } from '@/composables/useAudioRecorder'

// Componentes
import CognitiveAssignModal from '@/components/experto/cognitive/CognitiveAssignModal.vue'
import CognitiveTaskList from '@/components/experto/cognitive/CognitiveTaskList.vue'
import CognitiveTaskStart from '@/components/experto/cognitive/CognitiveTaskStart.vue'
import CognitivePrototype from '@/components/experto/cognitive/CognitivePrototype.vue'
import CognitiveQuestions from '@/components/experto/cognitive/CognitiveQuestions.vue'
import CognitiveStatusBar from '@/components/experto/cognitive/CognitiveStatusBar.vue'
import CognitiveAudioBar from '@/components/experto/cognitive/CognitiveAudioBar.vue'
import CognitiveTaskComplete from '@/components/experto/cognitive/CognitiveTaskComplete.vue'
import CognitiveFinished from '@/components/experto/cognitive/CognitiveFinished.vue'

const $q = useQuasar()
const auth = useAuthStore()
const api = useCognitiveApi()
const session = useCognitiveSession()

// ============================================================
// CONFIGURACIÓN
// ============================================================
const EMOTION_SERVICE_URL = 'http://localhost:8000/analyze-frame'
const EMOTION_CAPTURE_INTERVAL_MS = 2000
const TEXT_SERVICE_URL = 'http://localhost:8000/analyze-text'

// ============================================================
// AUDIO
// ============================================================
const {
  isRecording: isAudioRecording,
  transcribedText,
  isSupported: isAudioSupported,
  startRecording: startAudioRecording,
  stopRecording: stopAudioRecording,
  cleanup: cleanupAudio,
  setAudioLevelCallback,
} = useAudioRecorder()

const audioLevel = ref(0)
const isTextAIConnected = ref(false)
const lastSentiment = ref<{ uxLabel: string; confidence: number } | null>(null)

setAudioLevelCallback((level: number) => {
  audioLevel.value = level
})

// ============================================================
// STATE
// ============================================================
type Status = 'assign' | 'tasklist' | 'idle' | 'running' | 'task-finished' | 'finished'

const status = ref<Status>('assign')
const evaluations = ref<any[]>([])
const selectedEvaluation = ref<any>(null)
const tasks = ref<any[]>([])
const loadingEvaluations = ref(false)
const loadingTasks = ref(false)
const loadingStart = ref(false)
const camaraLista = ref(false)
const pantallaLista = ref(false)
const eventosRegistrados = ref(0)
const lecturasEmocion = ref(0)
const flowClicks = ref<any[]>([])
const currentResponse = ref<any>(null)
const isTaskCompleted = ref(false)
const fileKey = ref('')
const currentStepIndex = ref(0)
const prototypeRef = ref<InstanceType<typeof CognitivePrototype> | null>(null)

// Streams
let faceStream: MediaStream | null = null
let screenStream: MediaStream | null = null
let emotionInterval: ReturnType<typeof setInterval> | null = null
let timerInterval: ReturnType<typeof setInterval> | null = null

// Emoción actual
const emocionActual = ref<string | null>(null)

const emotionEmojis: Record<string, string> = {
  happy: '🙂', sad: '🙁', angry: '😠', surprise: '😮', disgust: '😖', fear: '😨',
}
const emotionLabelsEs: Record<string, string> = {
  happy: 'Felicidad', sad: 'Tristeza', angry: 'Enojo',
  surprise: 'Sorpresa', disgust: 'Asco', fear: 'Miedo',
}

const emocionActualEmoji = computed(() =>
  emocionActual.value ? emotionEmojis[emocionActual.value] ?? '—' : '—'
)
const emocionActualLabel = computed(() =>
  emocionActual.value ? emotionLabelsEs[emocionActual.value] ?? emocionActual.value : 'analizando…'
)

// ============================================================
// COMPUTED
// ============================================================
const currentTask = computed(() => session.currentTask.value)
const completedTaskIds = computed(() => session.completedTaskIds.value)
const isLastStep = computed(() => currentStepIndex.value >= flowClicks.value.length - 1)
const progress = computed(() => {
  if (flowClicks.value.length === 0) return 0
  return Math.round(((currentStepIndex.value + 1) / flowClicks.value.length) * 100)
})

const tareasPendientes = computed(() =>
  tasks.value.filter((t) => !completedTaskIds.value.has(t.id))
)

const totalTareas = computed(() => tasks.value.length)
const eventosTotales = computed(() => eventosRegistrados.value)
const tiempoTotalFormateado = computed(() => session.getTimeFormatted())

const getTimeFormatted = () => {
  return session.getTimeFormatted()
}

// ============================================================
// MÉTODOS
// ============================================================
const loadMyEvaluations = async () => {
  loadingEvaluations.value = true
  const user_id = auth.user?.user_id
  try {
    const data = await api.getMyEvaluations(user_id)
    evaluations.value = data
    if (evaluations.value.length === 0) {
      $q.notify({
        type: 'info',
        message: 'No tienes evaluaciones cognitivas asignadas'
      })
    }
  } catch (error) {
    console.error('Error al cargar evaluaciones:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar evaluaciones asignadas'
    })
  } finally {
    loadingEvaluations.value = false
  }
}

const selectEvaluation = async (evaluation: any) => {
  selectedEvaluation.value = evaluation
  // Obtener el file_key desde el proyecto
  try {
    fileKey.value = await api.getProjectFileKey(evaluation.projectId)
  } catch (error) {
    console.error('Error al obtener file_key:', error)
    $q.notify({
      type: 'warning',
      message: 'No se pudo obtener el prototipo Figma'
    })
  }
  await loadTasks(evaluation.cognitiveEvaluationId)
}

const loadTasks = async (evaluationId: string) => {
  loadingTasks.value = true
  try {
    const data = await api.getEvaluationTasks(evaluationId)
    tasks.value = data
    status.value = 'tasklist'
  } catch (error) {
    console.error('Error al cargar tareas:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar tareas de la evaluación'
    })
  } finally {
    loadingTasks.value = false
  }
}



const selectTask = async (task: any) => {
  await session.loadTask(task)
  currentStepIndex.value = 0
  
  // Cargar el flujo ideal
  try {
    const flow = await api.getTaskFlow(task.projectTaskId)
    console.log('📦 Flow recibido:', flow)
    
    if (flow && flow.length > 0) {
      // 🔥 CORREGIDO: flow[0] existe y tiene flowId
      const flowId = flow[0]?.flowId
      if (flowId) {
        const clicks = await api.getFlowClicks(flowId)
        await session.setFlowClicks(clicks)
        flowClicks.value = clicks
        console.log('✅ Flujo cargado:', flowClicks.value.length, 'pasos')
      } else {
        console.warn('⚠️ El flujo no tiene flowId')
        flowClicks.value = []
      }
    } else {
      console.warn('⚠️ No hay flujo ideal para esta tarea')
      flowClicks.value = []
      $q.notify({
        type: 'info',
        message: 'Esta tarea no tiene un flujo ideal definido. Responde según tu criterio.',
        timeout: 5000
      })
    }
  } catch (error) {
    console.warn('Error al cargar flujo:', error)
    flowClicks.value = []
  }
  
  status.value = 'idle'
  await solicitarPermisos()
}

// 🔥 CORREGIR: Función para solicitar permisos
const solicitarPermisos = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    
    faceStream = stream
    camaraLista.value = true
    
    if (prototypeRef.value) {
      prototypeRef.value.setFaceStream(stream)
    }
    
    $q.notify({
      type: 'positive',
      message: '✅ Cámara y micrófono conectados'
    })
  } catch (e) {
    console.error('Error al acceder a cámara/micrófono:', e)
    camaraLista.value = false
    $q.notify({
      type: 'warning',
      message: 'No se pudo acceder a la cámara o micrófono. Las emociones y audio no se registrarán.'
    })
  }

  try {
    // 🔥 CORREGIDO: Asignar correctamente screenStream
    const screenStreamResult = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    })
    screenStream = screenStreamResult  // ← CORREGIDO: asignar a la variable global
    pantallaLista.value = true
    screenStream.getVideoTracks()[0]?.addEventListener('ended', finalizarRecorrido)
    
    $q.notify({
      type: 'positive',
      message: '✅ Pantalla conectada'
    })
  } catch (e) {
    console.error('Error al acceder a pantalla:', e)
    pantallaLista.value = false
    $q.notify({
      type: 'warning',
      message: 'No se pudo acceder a la pantalla.'
    })
  }
}



const iniciarRecorrido = async () => {
  loadingStart.value = true
  try {
    console.log('🚀 Iniciando recorrido...')
    console.log('📋 Datos:', {
      evaluationId: selectedEvaluation.value?.cognitiveEvaluationId,
      taskId: currentTask.value?.id,
      fileKey: fileKey.value,
      userId: auth.user?.user_id,
    })

    const userId = auth.user?.user_id || ''
    await session.initSession(
      selectedEvaluation.value.cognitiveEvaluationId,
      currentTask.value.id,
      fileKey.value,
      userId
    )

    if (prototypeRef.value && faceStream) {
      prototypeRef.value.setFaceStream(faceStream)
    }

    if (isAudioSupported && !isAudioRecording.value) {
      await startAudioRecording()
    }

    iniciarTimers()

    status.value = 'running'
    isTaskCompleted.value = false
    currentStepIndex.value = 0
    
    console.log('✅ Recorrido cognitivo iniciado correctamente')
    $q.notify({
      type: 'positive',
      message: '🎬 Recorrido cognitivo iniciado'
    })
  } catch (error: any) {
    console.error('❌ Error detallado:', error)
    console.error('📋 Mensaje:', error.message)
    
    let errorMessage = 'Error al iniciar el recorrido'
    
    if (error.message?.includes('fileKey')) {
      errorMessage = 'Error: No se pudo cargar el prototipo Figma'
    } else if (error.message?.includes('session')) {
      errorMessage = 'Error: No se pudo crear la sesión de evaluación'
    } else if (error.message?.includes('network')) {
      errorMessage = 'Error de conexión con el servidor'
    }
    
    $q.notify({
      type: 'negative',
      message: errorMessage,
      actions: [
        { label: 'Ver detalles', handler: () => {
          $q.dialog({
            title: 'Error detallado',
            message: `Mensaje: ${error.message}\n\nStack: ${error.stack || 'No disponible'}`,
            ok: 'Cerrar'
          })
        }}
      ]
    })
  } finally {
    loadingStart.value = false
  }
}



const iniciarStreams = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    faceStream = stream
    camaraLista.value = true

    if (prototypeRef.value) {
      prototypeRef.value.setFaceStream(stream)
    }

    emotionInterval = setInterval(capturarEmocion, EMOTION_CAPTURE_INTERVAL_MS)
  } catch (e) {
    console.error('Error al acceder a cámara:', e)
    $q.notify({
      type: 'warning',
      message: 'No se pudo acceder a la cámara. Las emociones no se registrarán.'
    })
  }

  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    })
    pantallaLista.value = true
    screenStream.getVideoTracks()[0]?.addEventListener('ended', finalizarRecorrido)
  } catch (e) {
    console.error('Error al acceder a pantalla:', e)
    $q.notify({
      type: 'warning',
      message: 'No se pudo acceder a la pantalla.'
    })
  }
}

const iniciarTimers = () => {
  timerInterval = setInterval(() => {}, 250)

  if (emotionInterval) {
    clearInterval(emotionInterval)
  }
  emotionInterval = setInterval(capturarEmocion, EMOTION_CAPTURE_INTERVAL_MS)
}

const capturarEmocion = async () => {
  if (status.value !== 'running') return
  
  const frame = prototypeRef.value?.captureFrame()
  if (!frame) return

  try {
    const response = await fetch(EMOTION_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.sessionId.value,
        elapsed_ms_total: session.getElapsedMs(),
        image_base64: frame,
      }),
    })

    if (!response.ok) return
    const data = await response.json()

    emocionActual.value = data.face_detected ? data.dominant_emotion : null
    lecturasEmocion.value++

    await session.saveEmotion({
      elapsed_ms_total: session.getElapsedMs(),
      timestamp_real: new Date().toISOString(),
      dominant_emotion: data.dominant_emotion ?? null,
      face_detected: data.face_detected,
      scores_json: data.scores ?? null,
    })
  } catch (error) {
    console.warn('Error al analizar emoción:', error)
  }
}

const onFigmaEvent = async (eventData: any) => {
  eventosRegistrados.value++
  await session.saveEvent({
    event_type: eventData.type,
    event_type_normalizado: 'navegacion',
    node_id: eventData.nodeId || null,
    screen_name: eventData.screenName || null,
    elapsed_ms_total: session.getElapsedMs(),
    timestamp_real: new Date().toISOString(),
    raw_payload: eventData.payload || null,
  })
}

const nextStep = () => {
  if (currentStepIndex.value < flowClicks.value.length - 1) {
    currentStepIndex.value++
  }
}

const onResponseSaved = async (responseData: any) => {
  const saved = await session.saveResponse({
    ...responseData,
    stepIndex: currentStepIndex.value,
    flowClickId: flowClicks.value[currentStepIndex.value]?.clickId,
  })
  currentResponse.value = saved
  
  if (currentStepIndex.value < flowClicks.value.length - 1) {
    currentStepIndex.value++
  } else {
    isTaskCompleted.value = true
  }
}

const onResponseSkipped = () => {
  if (currentStepIndex.value < flowClicks.value.length - 1) {
    currentStepIndex.value++
  } else {
    isTaskCompleted.value = true
  }
}

const onTaskComplete = async () => {
  session.completedTaskIds.value.add(currentTask.value.id)
  await session.finishSession('completed')
  
  detenerTimers()
  status.value = 'task-finished'
}

const finalizarRecorrido = async () => {
  const confirm = await $q.dialog({
    title: 'Finalizar Recorrido',
    message: '¿Estás seguro de finalizar el recorrido de esta tarea?',
    ok: { label: 'Finalizar', color: 'warning' },
    cancel: 'Cancelar',
  })

  if (!confirm) return

  detenerTimers()
  await session.finishSession('abandoned')
  status.value = 'task-finished'
}

const volverALista = () => {
  if (tareasPendientes.value.length > 0) {
    status.value = 'tasklist'
  } else {
    status.value = 'finished'
  }
}

const detenerTimers = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  if (emotionInterval) {
    clearInterval(emotionInterval)
    emotionInterval = null
  }
  if (isAudioRecording.value) {
    stopAudioRecording()
  }
}

// ============================================================
// ANÁLISIS DE TEXTO
// ============================================================
watch(transcribedText, async (newText) => {
  if (newText && newText.trim().length > 0 && status.value === 'running') {
    await analyzeText(newText.trim())
  }
})

const analyzeText = async (text: string) => {
  try {
    const response = await fetch(TEXT_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (response.ok) {
      const result = await response.json()
      lastSentiment.value = {
        uxLabel: result.ux_label || result.uxLabel || 'Neutral',
        confidence: result.confidence || 0,
      }

      await session.saveTextSentiment({
        text,
        original_label: result.original_label || result.originalLabel || 'unknown',
        ux_label: result.ux_label || result.uxLabel || 'Neutral',
        confidence: result.confidence || 0,
        scores_json: result.scores || {},
        elapsed_ms_total: session.getElapsedMs(),
        timestamp_real: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Error al analizar texto:', error)
  }
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  await loadMyEvaluations()
})

onBeforeUnmount(() => {
  detenerTimers()
  faceStream?.getTracks().forEach(t => t.stop())
  screenStream?.getTracks().forEach(t => t.stop())
  cleanupAudio()
})
</script>