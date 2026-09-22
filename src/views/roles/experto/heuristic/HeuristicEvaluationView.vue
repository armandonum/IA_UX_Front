<template>
  <div class="w-full h-screen relative">
    <!-- ====== CONSENTIMIENTO ====== -->
    <HeuristicConsentModal
      :show="status === 'consent'"
      :checked="consentChecked"
      :loading="loadingPermissions"
      :error="permissionsError"
      @update:checked="consentChecked = $event"
      @continuar="pedirPermisosYContinuar"
    />

    <!-- ====== LISTA DE TAREAS ====== -->
    <HeuristicTaskList
      :show="status === 'tasklist'"
      :tasks="tasksWithStatus"
      :loading-tasks="loadingTasks"
      :session-id="sessionId"
      @select-task="seleccionarTarea"
      @close="cerrarEvaluacion"
      @finish-session="finalizarEvaluacion"
    />

    <!-- ====== EVALUACIÓN EN CURSO ====== -->
    <template v-if="status === 'running'">
      <PrototypeStage
        v-if="figmaEmbedUrl"
        ref="stageRef"
        :figma-embed-url="figmaEmbedUrl"
      />
      <div v-else class="flex flex-center full-height bg-grey-2">
        <div class="text-center">
          <q-icon name="warning" color="warning" size="64px" />
          <div class="text-h6 q-mt-md">No se pudo cargar el prototipo</div>
          <div class="text-caption text-grey-6">
            El proyecto no tiene un fileKey de Figma asociado
          </div>
        </div>
      </div>

      <video ref="faceVideoEl" class="hidden" autoplay playsinline muted />
      <video ref="screenVideoEl" class="hidden" autoplay playsinline muted />
      <canvas ref="captureCanvas" class="hidden" width="320" height="240" />

      <HeuristicStatusBar
        :tiempo="tiempoFormateado"
        :emocion-emoji="emocionActualEmoji"
        :emocion-label="emocionActualLabel"
        :tarea-actual="currentTaskTitle || '—'"
        @finalizar="finalizarRecorrido"
      />

      <HeuristicAudioBar
        :is-recording="isAudioRecording"
        :audio-level="audioLevel"
        :transcribed-text="transcribedText"
        :is-connected="isTextAIConnected"
        :last-sentiment="lastSentiment"
      />

      <HeuristicFloatingForm
        :observations="observationsMapped"
        :positive-aspects="positiveAspectsMapped"
        :current-task-id="currentTaskId"
        :current-task-title="currentTaskTitle"
        :principles="principles"
        :loading-principles="loading"
        :saving="saving"
        @add-observation="onAddObservation"
        @delete-observation="onDeleteObservation"
        @clear-all-observations="onClearAllObservations"
        @add-positive-aspect="onAddPositiveAspect"
        @delete-positive-aspect="onDeletePositiveAspect"
        @mark-task-complete="marcarTareaCompleta"
      />
    </template>

    <!-- ====== FINALIZACIÓN ====== -->
    <HeuristicFinishModal
      :show="status === 'finished'"
      :tiempo="tiempoFormateado"
      :eventos="eventosRegistrados"
      :lecturas="lecturasEmocionRegistradas"
      :observaciones="observations.length"
      @close="cerrarEvaluacion"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth.store'
import { useFigmaSessionStore } from '@/stores/figmaSession.store'
import { useHeuristicExpert } from '@/composables/expert/useHeuristicExpert'
import { useAudioRecorder } from '@/composables/useAudioRecorder'
import { useHeatmap } from '@/composables/useHeatmap'
import api from '@/api/axios'

import PrototypeStage from '@/components/estudiante/figma/PrototypeStage.vue'
import HeuristicConsentModal from '@/components/experto/heuristic/HeuristicConsentModal.vue'
import HeuristicTaskList from '@/components/experto/heuristic/HeuristicTaskList.vue'
import HeuristicFloatingForm from '@/components/experto/heuristic/HeuristicFloatingForm.vue'
import HeuristicStatusBar from '@/components/experto/heuristic/HeuristicStatusBar.vue'
import HeuristicAudioBar from '@/components/experto/heuristic/HeuristicAudioBar.vue'
import HeuristicFinishModal from '@/components/experto/heuristic/HeuristicFinishModal.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()
const figmaSession = useFigmaSessionStore()


const {
  loading,
  currentEvaluation,
  principles,
  tasks,
  observations,
  positiveAspects,
  currentTaskId,
  currentTaskTitle,
  selectEvaluation,
  selectTask,
  clearTask,
  addObservation,
  deleteObservation,
  addPositiveAspect,
  markTaskCompleted,
  markEvaluatorCompleted,
  myEvaluatorId,
} = useHeuristicExpert()

const clientId = computed(() => figmaSession.clientId)
const evaluationId = computed(() => route.params.evaluationId as string)
const AI_URL = import.meta.env.VITE_IA_SERVICE
// ============================================================
// CONFIGURACIÓN
// ============================================================
const EMOTION_SERVICE_URL = `${AI_URL}/analyze-frame`
const EMOTION_CAPTURE_INTERVAL_MS = 2000
const TEXT_SERVICE_URL = `${AI_URL}/analyze-text`

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
// ESTADO
// ============================================================
type Status = 'consent' | 'tasklist' | 'running' | 'finished'

const status = ref<Status>('consent')
const consentChecked = ref(false)
const loadingPermissions = ref(false)
const loadingTasks = ref(false)
const saving = ref(false)
const permissionsError = ref<string | null>(null)

const stageRef = ref<InstanceType<typeof PrototypeStage> | null>(null)
const faceVideoEl = ref<HTMLVideoElement | null>(null)
const screenVideoEl = ref<HTMLVideoElement | null>(null)
const captureCanvas = ref<HTMLCanvasElement | null>(null)

const sessionId = ref<string | null>(null)
const startTimestamp = ref<number | null>(null)
const elapsedMs = ref(0)
const eventosRegistrados = ref(0)
const lecturasEmocionRegistradas = ref(0)
const emocionActual = ref<string | null>(null)

const projectFileKey = ref<string | null>(null)
const currentNodeId = ref<string | null>(null)

let faceStream: MediaStream | null = null
let screenStream: MediaStream | null = null
let faceRecorder: MediaRecorder | null = null
let screenRecorder: MediaRecorder | null = null
let faceChunks: Blob[] = []
let screenChunks: Blob[] = []

let timerInterval: ReturnType<typeof setInterval> | null = null
let emotionInterval: ReturnType<typeof setInterval> | null = null
let audioLevelInterval: ReturnType<typeof setInterval> | null = null

// ============================================================
// COMPUTED
// ============================================================
const tasksWithStatus = computed(() =>
  tasks.value.map(task => ({
    taskId: task.id,
    title: task.title,
    description: task.description || '',
    reviewed: task.status === 'completed',
    inProgress: currentTaskId.value === task.id,
  })),
)

const observationsMapped = computed(() =>
  observations.value.map(o => ({
    id: o.observationId,
    principleId: o.principleId,
    taskId: o.taskId || '',
    description: o.description,
    severity: o.severity as 1 | 2 | 3 | 4 | 5,
    frequency: o.frequency,
    timestampMs: new Date(o.createdAt).getTime(),
    createdAt: o.createdAt,
  })),
)

const positiveAspectsMapped = computed(() =>
  positiveAspects.value.map(a => ({
    id: a.aspectId,
    taskId: a.taskId || '',
    description: a.description,
    createdAt: a.createdAt,
  })),
)

const tiempoFormateado = computed(() => {
  const totalSeconds = Math.floor(elapsedMs.value / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
})

const emotionEmojis: Record<string, string> = {
  happy: '🙂', sad: '🙁', angry: '😠', surprise: '😮', disgust: '😖', fear: '😨',
}
const emotionLabelsEs: Record<string, string> = {
  happy: 'Felicidad', sad: 'Tristeza', angry: 'Enojo',
  surprise: 'Sorpresa', disgust: 'Asco', fear: 'Miedo',
}

const emocionActualEmoji = computed(() =>
  emocionActual.value ? emotionEmojis[emocionActual.value] ?? '—' : '—',
)
const emocionActualLabel = computed(() =>
  emocionActual.value ? emotionLabelsEs[emocionActual.value] ?? emocionActual.value : 'analizando…',
)


const figmaEmbedUrl = computed(() => {
  if (!projectFileKey.value) {
    return ''
  }

  const params = new URLSearchParams({
    'node-id': '0-1',
    'embed-host': 'share',
    'client-id': clientId.value,
  })
  const url = `https://embed.figma.com/proto/${projectFileKey.value}?${params.toString()}`
  return url
})

// ============================================================
// TIMER
// ============================================================
function tiempoActual() {
  const totalMs = startTimestamp.value ? Date.now() - startTimestamp.value : 0
  return {
    elapsed_ms_total: totalMs,
    elapsed_minute: Math.floor(totalMs / 60000),
    elapsed_second: Math.floor((totalMs % 60000) / 1000),
  }
}

// ============================================================
// MAPA DE CALOR
// ============================================================
const projectId = computed(() => currentEvaluation.value?.projectId || '')
const userId = computed(() => auth.user?.user_id || null)

const {
  isCapturing: isHeatmapCapturing,
  startCapturing: startHeatmap,
  stopCapturing: stopHeatmap,
} = useHeatmap({
  sessionId: sessionId,
  projectId: projectId,
  userId: userId,
  nodeId: currentNodeId,
  enabled: true,
  captureMove: true,
  captureScroll: true,
  debounceMs: 500,
  getElapsedMs: () => tiempoActual().elapsed_ms_total,
})

// ============================================================
// 🔥 LISTENER DE DEBUG GLOBAL (para ver TODOS los mensajes)
// ============================================================
function debugMessageListener(event: MessageEvent) {
  // Solo loguear si es de Figma
  if (event.origin.includes('figma')) {
    console.log('🔊 [DEBUG GLOBAL] Mensaje de Figma:', {
      origin: event.origin,
      type: event.data?.type,
      data: event.data,
      status: status.value,
      sessionId: sessionId.value,
    })
  }
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {

  // 🔥 Agregar listener de debug
  window.addEventListener('message', debugMessageListener)

  try {
    loadingTasks.value = true

    // 1. Cargar evaluación
    await selectEvaluation(evaluationId.value)

    // 2. Cargar el PROYECTO para obtener el fileKey
    if (currentEvaluation.value?.projectId) {
      try {
        const { data: project } = await api.get(
          `/figma-projects/${currentEvaluation.value.projectId}`,
        )
        projectFileKey.value = project.fileKey
      } catch (e) {
        console.error('❌ [onMounted] Error al cargar proyecto:', e)
        $q.notify({
          type: 'warning',
          message: 'No se pudo cargar el fileKey del proyecto',
        })
      }
    }
  } catch (e) {
    console.error('❌ [onMounted] Error:', e)
  } finally {
    loadingTasks.value = false
  }

  checkTextAIConnection()
})

// ============================================================
// PERMISOS
// ============================================================
async function pedirPermisosYContinuar() {
  loadingPermissions.value = true
  permissionsError.value = null

  try {
    const faceStreamWithAudio = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    faceStream = faceStreamWithAudio
  } catch (e) {
    console.error('❌ [Permisos] Error cámara/micrófono:', e)
    permissionsError.value = 'No se pudo acceder a la cámara o micrófono.'
    loadingPermissions.value = false
    return
  }

  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    })
  } catch (e) {
    console.error('❌ [Permisos] Error pantalla:', e)
    permissionsError.value = 'No se pudo acceder a la pantalla.'
    loadingPermissions.value = false
    return
  }

  loadingPermissions.value = false
  status.value = 'tasklist'
}

// ============================================================
// SELECCIONAR TAREA
// ============================================================
async function seleccionarTarea(task: any) {
  console.log('🎯 [seleccionarTarea] Tarea seleccionada:', task)

  const originalTask = tasks.value.find(t => t.id === task.taskId)
  if (!originalTask) {
    console.error('❌ [seleccionarTarea] Tarea no encontrada:', task.taskId)
    return
  }

  selectTask(originalTask)
  status.value = 'running'
  console.log('✅ [seleccionarTarea] Status cambiado a running')

  await nextTick()

  if (faceVideoEl.value && faceStream) {
    faceVideoEl.value.srcObject = faceStream
  }
  if (screenVideoEl.value && screenStream) {
    screenVideoEl.value.srcObject = screenStream
  }
  if (stageRef.value?.faceVideoEl && faceStream) {
    stageRef.value.faceVideoEl.srcObject = faceStream
  }

  // 🔥 CRÍTICO: Esperar a que iniciarRecorrido termine
  await iniciarRecorrido()
}

// ============================================================
// INICIAR RECORRIDO
// ============================================================
async function iniciarRecorrido() {
  console.log('🚀 [iniciarRecorrido] INICIANDO...')

  try {
    // 1. Crear sesión
    console.log('📡 [iniciarRecorrido] Creando sesión...')
    sessionId.value = await crearSesion()
    console.log('✅ [iniciarRecorrido] SessionId asignado:', sessionId.value)

    if (!sessionId.value) {
      console.error('❌ [iniciarRecorrido] sessionId es null, abortando')
      return
    }

    startTimestamp.value = Date.now()
    elapsedMs.value = 0
    eventosRegistrados.value = 0
    lecturasEmocionRegistradas.value = 0

    await nextTick()

    if (stageRef.value?.faceVideoEl && faceStream) {
      stageRef.value.faceVideoEl.srcObject = faceStream
    }

    // 2. Grabación de cámara
    if (faceStream) {
      faceChunks = []
      faceRecorder = new MediaRecorder(faceStream, { mimeType: 'video/webm' })
      faceRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) faceChunks.push(e.data)
      }
      faceRecorder.start()
      console.log('🎥 [iniciarRecorrido] Grabación de cámara iniciada')
    }

    // 3. Grabación de pantalla
    if (screenStream) {
      screenChunks = []
      screenRecorder = new MediaRecorder(screenStream, { mimeType: 'video/webm' })
      screenRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) screenChunks.push(e.data)
      }
      screenRecorder.start()
      screenStream.getVideoTracks()[0]?.addEventListener('ended', finalizarRecorrido)
      console.log('🖥️ [iniciarRecorrido] Grabación de pantalla iniciada')
    }

    // 4. Audio
    if (!isAudioRecording.value) {
      const started = await startAudioRecording()
      if (started) {
        console.log('🎤 [iniciarRecorrido] Audio iniciado')
        audioLevelInterval = setInterval(() => {}, 50)
      }
    }

    // 5. Heatmap
    startHeatmap()
    console.log('🗺️ [iniciarRecorrido] Heatmap iniciado')

    // 6. 🔥 LISTENER DE FIGMA - CRÍTICO
    console.log('👂 [iniciarRecorrido] Registrando listener de Figma...')
    window.addEventListener('message', handleMessage)
    console.log('✅ [iniciarRecorrido] Listener de Figma registrado')

    window.addEventListener('beforeunload', handleBeforeUnload)

    // 7. Timer
    timerInterval = setInterval(() => {
      if (startTimestamp.value) elapsedMs.value = Date.now() - startTimestamp.value
    }, 250)
    console.log('⏱️ [iniciarRecorrido] Timer iniciado')

    // 8. Análisis de emociones
    emotionInterval = setInterval(analizarEmocionActual, EMOTION_CAPTURE_INTERVAL_MS)
    console.log('😊 [iniciarRecorrido] Análisis de emociones iniciado')

    console.log('🎉 [iniciarRecorrido] COMPLETADO')
  } catch (e) {
    console.error('❌ [iniciarRecorrido] Error:', e)
    $q.notify({ type: 'negative', message: 'Error al iniciar la tarea' })
  }
}

// ============================================================
// CREAR SESIÓN
// ============================================================
async function crearSesion(): Promise<string> {
  console.log('📡 [crearSesion] POST /usability-sessions')
  console.log('📦 [crearSesion] Payload:', {
    proyectId: currentEvaluation.value?.projectId,
    userId: auth.user?.user_id,
    fileKey: projectFileKey.value,
    taskId: currentTaskId.value,
    taskDescription: currentTaskTitle.value,
  })

  const res = await fetch('/api/usability-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proyectId: currentEvaluation.value?.projectId,
      userId: auth.user?.user_id,
      fileKey: projectFileKey.value,
      nodeIdInicial: '0-1',
      taskId: currentTaskId.value,
      taskDescription: currentTaskTitle.value ?? '',
      evaluationType: 'heuristic',
      deviceType: /Mobi/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent,
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('❌ [crearSesion] Error:', res.status, errorText)
    throw new Error('No se pudo crear la sesión')
  }

  const data = await res.json()
  console.log('📦 [crearSesion] Respuesta:', data)

  const id = data.sessionId || data.session_id
  if (!id) {
    console.error('❌ [crearSesion] No se recibió sessionId:', data)
    throw new Error('No se recibió el ID de sesión')
  }

  return id
}

// ============================================================
// CERRAR SESIÓN
// ============================================================
async function cerrarSesion(status: 'completed' | 'abandoned') {
  if (!sessionId.value) {
    console.log('⚠️ [cerrarSesion] No hay sessionId')
    return
  }
  console.log('📡 [cerrarSesion] PATCH /usability-sessions/' + sessionId.value + '/finish')
  await fetch(`/api/usability-sessions/${sessionId.value}/finish`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).catch((e) => console.error('❌ [cerrarSesion] Error:', e))
}

// ============================================================
// 🔥 REGISTRAR EVENTO - CRÍTICO
// ============================================================
async function registrarEvento(eventType: string, payload: unknown, nodeId?: string) {
  console.log('📝 [registrarEvento] Llamado:', {
    eventType,
    sessionId: sessionId.value,
    nodeId,
  })

  if (!sessionId.value) {
    console.error('❌ [registrarEvento] No hay sessionId, evento descartado')
    return
  }

  const tiempo = tiempoActual()
  eventosRegistrados.value++

  console.log('📤 [registrarEvento] Enviando POST /usability-events...')

  try {
    const res = await fetch('/api/usability-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId.value,
        event_type: eventType,
        event_type_normalizado: 'navegacion',
        node_id: nodeId ?? null,
        screen_name: nodeId ? 'Pantalla' : null,
        elapsed_minute: tiempo.elapsed_minute,
        elapsed_second: tiempo.elapsed_second,
        elapsed_ms_total: tiempo.elapsed_ms_total,
        timestamp_real: new Date().toISOString(),
        raw_payload: payload ?? null,
      }),
    })

    console.log('✅ [registrarEvento] Respuesta:', res.status)
  } catch (e) {
    console.error('❌ [registrarEvento] Error:', e)
  }
}

// ============================================================
// REGISTRAR LECTURA DE EMOCIÓN
// ============================================================
async function registrarLecturaEmocion(reading: {
  elapsed_ms_total: number
  dominant_emotion: string | null
  scores: Record<string, number> | null
  face_detected: boolean
}) {
  if (!sessionId.value) return
  lecturasEmocionRegistradas.value++

  console.log('😊 [registrarLecturaEmocion]', reading)

  fetch('/api/emotion-readings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId.value,
      elapsedMsTotal: reading.elapsed_ms_total,
      timestampReal: new Date().toISOString(),
      dominantEmotion: reading.dominant_emotion,
      scoresJson: reading.scores,
    }),
  }).catch((e) => console.error('❌ [registrarLecturaEmocion]:', e))
}

// ============================================================
// ANÁLISIS DE TEXTO
// ============================================================
watch(transcribedText, async (newText) => {
  if (newText && newText.trim().length > 0 && status.value === 'running') {
    await analyzeText(newText.trim())
  }
})

async function checkTextAIConnection() {
  try {
    const res = await fetch(`${AI_URL}/health`)
    isTextAIConnected.value = res.ok
    console.log('🔌 [TextAI] Conectado:', res.ok)
  } catch {
    isTextAIConnected.value = false
  }
}

async function analyzeText(text: string) {
  if (!text.trim() || !sessionId.value) return

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

      await saveTextSentiment(text, result)
    }
  } catch (error) {
    console.error('Error analizando texto:', error)
  }
}

async function saveTextSentiment(text: string, result: any) {
  try {
    const payload = {
      sessionId: sessionId.value,
      text: text,
      originalLabel: result.original_label || result.originalLabel || 'unknown',
      uxLabel: result.ux_label || result.uxLabel || 'Neutral',
      confidence: result.confidence || 0,
      scoresJson: result.scores || {},
      elapsedMsTotal: tiempoActual().elapsed_ms_total,
      timestampReal: new Date().toISOString(),
      authorId: auth.user?.user_id || null,
    }

    await fetch('/api/text-sentiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    console.log('✅ [TextSentiment] Guardado')
  } catch (error) {
    console.error('❌ [TextSentiment]:', error)
  }
}

// ============================================================
// EMOCIONES
// ============================================================
function capturarFrameBase64(): string | null {
  const video = stageRef.value?.faceVideoEl || faceVideoEl.value
  const canvas = stageRef.value?.captureCanvas || captureCanvas.value
  if (!video || !canvas) return null
  if (!video.videoWidth || !video.videoHeight) return null

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

async function analizarEmocionActual() {
  const imageBase64 = capturarFrameBase64()
  if (!imageBase64 || !sessionId.value) return

  const tiempo = tiempoActual()

  try {
    const res = await fetch(EMOTION_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId.value,
        elapsed_ms_total: tiempo.elapsed_ms_total,
        image_base64: imageBase64,
      }),
    })
    if (!res.ok) return
    const data = await res.json()

    emocionActual.value = data.face_detected ? data.dominant_emotion : null

    registrarLecturaEmocion({
      elapsed_ms_total: tiempo.elapsed_ms_total,
      dominant_emotion: data.dominant_emotion ?? null,
      scores: data.scores ?? null,
      face_detected: data.face_detected,
    })
  } catch (e) {
    console.warn('Servicio de emociones no disponible en este intervalo', e)
  }
}

// ============================================================
// 🔥 HANDLE MESSAGE - CRÍTICO
// ============================================================
function handleMessage(event: MessageEvent) {
  // 🔥 LOG DE CADA MENSAJE
  console.log('📨 [handleMessage] Mensaje recibido:', {
    origin: event.origin,
    type: event.data?.type,
    status: status.value,
    sessionId: sessionId.value,
  })

  const figmaOrigin = 'https://www.figma.com'
  if (event.origin !== figmaOrigin) {
    console.log('⚠️ [handleMessage] Origen no permitido:', event.origin)
    return
  }

  const data = event.data
  if (!data?.type) {
    console.log('⚠️ [handleMessage] Sin tipo de evento')
    return
  }

  if (status.value !== 'running') {
    console.log('⚠️ [handleMessage] Status no es running:', status.value)
    return
  }

  console.log('✅ [handleMessage] Procesando evento:', data.type)

  if (data.type === 'PRESENTED_NODE_CHANGED' && data.data?.presentedNodeId) {
    currentNodeId.value = data.data.presentedNodeId
  }

  switch (data.type) {
    case 'INITIAL_LOAD':
      registrarEvento('INITIAL_LOAD', data.data)
      break
    case 'PRESENTED_NODE_CHANGED':
      registrarEvento('PRESENTED_NODE_CHANGED', data.data, data.data?.presentedNodeId)
      break
    case 'NEW_STATE':
      registrarEvento('NEW_STATE', data.data)
      break
    case 'MOUSE_PRESS_OR_RELEASE':
      registrarEvento('MOUSE_PRESS_OR_RELEASE', data.data)
      break
    default:
      registrarEvento(data.type, data.data)
  }
}

function handleBeforeUnload() {
  if (status.value === 'running') {
    navigator.sendBeacon?.(
      `/api/usability-sessions/${sessionId.value}`,
      JSON.stringify({
        status: 'abandoned',
        duration_seconds: Math.floor(elapsedMs.value / 1000),
      }),
    )
  }
}

// ============================================================
// OBSERVACIONES Y ASPECTOS
// ============================================================
async function onAddObservation(data: any) {
  if (!sessionId.value) {
    $q.notify({ type: 'warning', message: 'No hay sesión activa' })
    return
  }

  saving.value = true
  try {
    await addObservation({
      sessionId: sessionId.value,
      principleId: data.principleId,
      description: data.description,
      severity: data.severity,
      frequency: data.frequency,
      recommendation: data.recommendation,
    })
    $q.notify({ type: 'positive', message: 'Observación registrada' })
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function onDeleteObservation(index: number) {
  const obs = observations.value[index]
  if (!obs) return

  saving.value = true
  try {
    await deleteObservation(obs.observationId)
    $q.notify({ type: 'info', message: 'Observación eliminada' })
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function onClearAllObservations() {
  $q.dialog({
    title: 'Limpiar observaciones',
    message: '¿Eliminar todas las observaciones de esta tarea?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    saving.value = true
    try {
      for (const obs of [...observations.value]) {
        await deleteObservation(obs.observationId)
      }
      $q.notify({ type: 'info', message: 'Observaciones eliminadas' })
    } catch (e) {
      console.error(e)
    } finally {
      saving.value = false
    }
  })
}

async function onAddPositiveAspect(data: any) {
  if (!sessionId.value) {
    $q.notify({ type: 'warning', message: 'No hay sesión activa' })
    return
  }

  saving.value = true
  try {
    await addPositiveAspect({
      sessionId: sessionId.value,
      description: data.description,
    })
    $q.notify({ type: 'positive', message: 'Aspecto positivo registrado' })
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function onDeletePositiveAspect(index: number) {
  const aspect = positiveAspects.value[index]
  if (!aspect) return

  saving.value = true
  try {
    const { heuristicApi } = await import('@/api/heuristic.api')
    await heuristicApi.deletePositiveAspect(aspect.aspectId)
    positiveAspects.value.splice(index, 1)
    $q.notify({ type: 'info', message: 'Aspecto eliminado' })
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

// ============================================================
// MARCAR TAREA COMPLETADA
// ============================================================
async function marcarTareaCompleta() {
  if (!currentTaskId.value) return

  console.log('🏁 [marcarTareaCompleta] Iniciando...')
  saving.value = true

  try {
    const currentSessionId = sessionId.value
    const taskIdToComplete = currentTaskId.value
    console.log('📌 [marcarTareaCompleta] SessionId capturado:', currentSessionId)

    stopHeatmap()

    if (isAudioRecording.value) {
      const finalText = await stopAudioRecording()
      if (finalText) {
        await analyzeText(finalText)
      }
    }

    if (timerInterval) clearInterval(timerInterval)
    if (emotionInterval) clearInterval(emotionInterval)
    timerInterval = null
    emotionInterval = null

    await cerrarSesion('completed')

    await detenerYSubirGrabaciones()

    await markTaskCompleted(taskIdToComplete, currentSessionId)

    clearTask()
    sessionId.value = null
    status.value = 'tasklist'

    $q.notify({ type: 'positive', message: '✅ Tarea completada' })

    const pendientes = tasks.value.filter(t => t.status !== 'completed')
    if (pendientes.length === 0) {
      $q.notify({
        type: 'info',
        message: '🎉 ¡Todas las tareas han sido completadas!',
      })
    }
  } catch (e) {
    console.error('❌ [marcarTareaCompleta]:', e)
    $q.notify({ type: 'negative', message: 'Error al completar tarea' })
  } finally {
    saving.value = false
  }
}

// ============================================================
// FINALIZAR RECORRIDO
// ============================================================
async function finalizarRecorrido() {
  console.log('🛑 [finalizarRecorrido] Finalizando...')

  stopHeatmap()

  if (isAudioRecording.value) {
    const finalText = await stopAudioRecording()
    if (finalText) {
      await analyzeText(finalText)
    }
  }

  if (timerInterval) clearInterval(timerInterval)
  if (emotionInterval) clearInterval(emotionInterval)
  timerInterval = null
  emotionInterval = null

  window.removeEventListener('message', handleMessage)
  window.removeEventListener('beforeunload', handleBeforeUnload)

  await detenerYSubirGrabaciones()
  await cerrarSesion('abandoned')

  sessionId.value = null
  clearTask()
  status.value = 'tasklist'
}

// ============================================================
// FINALIZAR EVALUACIÓN
// ============================================================
async function finalizarEvaluacion() {
  console.log('🏁 [finalizarEvaluacion] Finalizando evaluación...')

  if (status.value === 'running' && sessionId.value) {
    await finalizarRecorrido()
  }

  await markEvaluatorCompleted()

  status.value = 'finished'
}

// ============================================================
// GRABACIONES
// ============================================================
function detenerRecorder(recorder: MediaRecorder | null): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!recorder || recorder.state === 'inactive') {
      resolve(null)
      return
    }
    recorder.onstop = () => {
      const chunks = recorder === faceRecorder ? faceChunks : screenChunks
      resolve(new Blob(chunks, { type: 'video/webm' }))
    }
    recorder.stop()
  })
}

async function detenerYSubirGrabaciones() {
  console.log('🎬 [detenerYSubirGrabaciones] Deteniendo...')

  const [faceBlob, screenBlob] = await Promise.all([
    detenerRecorder(faceRecorder),
    detenerRecorder(screenRecorder),
  ])

  console.log('📦 [detenerYSubirGrabaciones] Blobs:', {
    faceSize: faceBlob?.size,
    screenSize: screenBlob?.size,
  })

  if (faceBlob) await subirVideo(faceBlob, 'face')
  if (screenBlob) await subirVideo(screenBlob, 'screen')
}

async function subirVideo(blob: Blob, tipo: 'screen' | 'face'): Promise<string | null> {
  if (!sessionId.value) return null

  const formData = new FormData()
  formData.append('file', blob, `${tipo}_${sessionId.value}.webm`)
  formData.append('session_id', sessionId.value)
  formData.append('video_type', tipo)

  try {
    console.log('📤 [subirVideo] Subiendo:', tipo)
    const response = await fetch('/api/usability-sessions/upload/video', {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) throw new Error('No se pudo subir el video')
    const data = await response.json()
    console.log('✅ [subirVideo] Video subido:', data)
    return data.videoKey
  } catch (error) {
    console.error(`❌ [subirVideo] Error ${tipo}:`, error)
    return null
  }
}

// ============================================================
// NAVEGACIÓN
// ============================================================
function cerrarEvaluacion() {
  router.push({ name: 'experto-proyectos-heuristic' })
}

// ============================================================
// CLEANUP
// ============================================================
onBeforeUnmount(() => {
  console.log('🔴 [onBeforeUnmount] Limpiando...')
  window.removeEventListener('message', debugMessageListener)
  if (timerInterval) clearInterval(timerInterval)
  if (emotionInterval) clearInterval(emotionInterval)
  if (audioLevelInterval) clearInterval(audioLevelInterval)
  window.removeEventListener('message', handleMessage)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  faceStream?.getTracks().forEach(t => t.stop())
  screenStream?.getTracks().forEach(t => t.stop())
  cleanupAudio()
})
</script>

<style scoped>
.hidden {
  display: none;
}
</style>