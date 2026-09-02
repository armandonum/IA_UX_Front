<!-- views/roles/experto/heuristic/HeuristicEvaluationView.vue -->

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
      <!-- Prototipo de Figma -->
      <PrototypeStage
        ref="stageRef"
        :figma-embed-url="figmaEmbedUrl"
      />

      <!-- Video oculto para cámara -->
      <video ref="faceVideoEl" class="hidden" autoplay playsinline muted />
      <canvas ref="captureCanvas" class="hidden" width="320" height="240" />

      <!-- Barra de estado -->
      <HeuristicStatusBar
        :tiempo="tiempoFormateado"
        :emocion-emoji="emocionActualEmoji"
        :emocion-label="emocionActualLabel"
        :tarea-actual="currentTaskTitle"
        @finalizar="mostrarTareas"
      />

      <!-- Formulario flotante -->
      <HeuristicFloatingForm
        :observations="observations"
        :current-task-id="currentTaskId"
        :current-task-title="currentTaskTitle"
        @add-observation="addObservation"
        @delete-observation="deleteObservation"
        @clear-all="clearObservations"
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
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useFigmaSessionStore } from '@/stores/figmaSession.store'
import { useQuasar } from 'quasar'

import PrototypeStage from '@/components/estudiante/figma/PrototypeStage.vue'
import HeuristicConsentModal from '@/components/experto/heuristic/HeuristicConsentModal.vue'
import HeuristicTaskList from '@/components/experto/heuristic/HeuristicTaskList.vue'
import HeuristicFloatingForm from '@/components/experto/heuristic/HeuristicFloatingForm.vue'
import HeuristicStatusBar from '@/components/experto/heuristic/HeuristicStatusBar.vue'
import HeuristicFinishModal from '@/components/experto/heuristic/HeuristicFinishModal.vue'

// 🔥 Usar API real (no el mock)
// import { heuristicApi } from '@/api/heuristic.api'
import { heuristicMock as heuristicApi } from '@/api/heuristic.mock'

import type { HeuristicObservation } from '@/data/heuristicPrinciples'
import type { Task } from '@/types/usability'

// ============================================================
// CONFIGURACIÓN
// ============================================================
const NODE_ID = '1-759'
const EMOTION_SERVICE_URL = 'http://localhost:8000/analyze-frame'
const EMOTION_CAPTURE_INTERVAL_MS = 2000

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const figmaSession = useFigmaSessionStore()
const $q = useQuasar()

const fileKey = computed(() => route.params.fileKey as string || figmaSession.selectedProject?.fileKey || '')
const clientId = computed(() => figmaSession.clientId)
const projectId = computed(() => figmaSession.selectedProject?.projectId || '')

const figmaEmbedUrl = computed(() => {
  const params = new URLSearchParams({
    'node-id': NODE_ID,
    'embed-host': 'share',
    'client-id': clientId.value,
  })
  return `https://embed.figma.com/proto/${fileKey.value}?${params.toString()}`
})

// ============================================================
// ESTADO
// ============================================================
type Status = 'consent' | 'tasklist' | 'running' | 'finished'

const status = ref<Status>('consent')
const consentChecked = ref(false)
const loadingPermissions = ref(false)
const permissionsError = ref<string | null>(null)
const loadingTasks = ref(false)

const stageRef = ref<InstanceType<typeof PrototypeStage> | null>(null)
const faceVideoEl = ref<HTMLVideoElement | null>(null)
const captureCanvas = ref<HTMLCanvasElement | null>(null)

const sessionId = ref<string | null>(null)
const startTimestamp = ref<number | null>(null)
const elapsedMs = ref(0)
const eventosRegistrados = ref(0)
const lecturasEmocionRegistradas = ref(0)
const emocionActual = ref<string | null>(null)

const tasks = ref<Task[]>([])
const observations = ref<HeuristicObservation[]>([])
const currentTaskId = ref<string | null>(null)
const currentTaskTitle = ref<string | null>(null)

// ============================================================
// STREAMS Y GRABACIÓN
// ============================================================
const camaraLista = ref(false)
const pantallaLista = ref(false)

let faceStream: MediaStream | null = null
let screenStream: MediaStream | null = null
let faceRecorder: MediaRecorder | null = null
let screenRecorder: MediaRecorder | null = null
let faceChunks: Blob[] = []
let screenChunks: Blob[] = []

let timerInterval: ReturnType<typeof setInterval> | null = null
let emotionInterval: ReturnType<typeof setInterval> | null = null

// ============================================================
// COMPUTED
// ============================================================
const tasksWithStatus = computed(() => {
  return tasks.value.map(task => ({
    ...task,
    reviewed: task.reviewed || false,
    inProgress: currentTaskId.value === task.taskId
  }))
})

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
  emocionActual.value ? emotionEmojis[emocionActual.value] ?? '—' : '—'
)
const emocionActualLabel = computed(() =>
  emocionActual.value ? emotionLabelsEs[emocionActual.value] ?? emocionActual.value : 'analizando…'
)

// ============================================================
// MÉTODOS
// ============================================================
async function pedirPermisosYContinuar() {
  loadingPermissions.value = true
  permissionsError.value = null

  try {
    faceStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    camaraLista.value = true
  } catch (e) {
    permissionsError.value = 'No se pudo acceder a la cámara.'
    loadingPermissions.value = false
    return
  }

  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
    pantallaLista.value = true
  } catch (e) {
    permissionsError.value = 'No se pudo acceder a la pantalla.'
    loadingPermissions.value = false
    return
  }

  loadingPermissions.value = false
  
  // Crear sesión ÚNICA para todo el proyecto
  await crearSesionUnica()
  await cargarTareas()
}

async function crearSesionUnica() {
  try {
    const res = await heuristicApi.createSession({
      projectId: projectId.value,
      userId: auth.user?.user_id || '',
      fileKey: fileKey.value,
    })
    sessionId.value = res.data.sessionId
    startTimestamp.value = Date.now()
    iniciarGrabacionesYTimer()
    status.value = 'tasklist'
  } catch (e) {
    console.error('Error al iniciar la sesión:', e)
    $q.notify({ type: 'negative', message: 'Error al iniciar la sesión' })
  }
}

// 🔥 CORREGIDO: Cargar tareas desde la base de datos
async function cargarTareas() {
  loadingTasks.value = true
  try {
    // 🔥 OBTENER TAREAS DESDE LA BASE DE DATOS
    const res = await fetch(`/api/tasks/project/${projectId.value}`)
    
    if (res.ok) {
      const data = await res.json()
      tasks.value = data.map((t: Task) => ({
        ...t,
        reviewed: false,
        inProgress: false
      }))
    } else {
      // Si falla, intentar con el otro endpoint
      const res2 = await fetch(`/api/tasks/projectId/${projectId.value}`)
      if (res2.ok) {
        const data = await res2.json()
        tasks.value = data.map((t: Task) => ({
          ...t,
          reviewed: false,
          inProgress: false
        }))
      } else {
        console.error('Error al cargar tareas:', res.status)
        tasks.value = []
      }
    }
  } catch (e) {
    console.error('Error cargando tareas:', e)
    tasks.value = []
  } finally {
    loadingTasks.value = false
  }
}

function seleccionarTarea(task: any) {
  tasks.value = tasks.value.map(t => ({
    ...t,
    inProgress: t.taskId === task.taskId
  }))
  
  currentTaskId.value = task.taskId
  currentTaskTitle.value = task.title || task.description
  status.value = 'running'
}

function mostrarTareas() {
  status.value = 'tasklist'
}

async function marcarTareaCompleta() {
  if (!currentTaskId.value) return
  
  tasks.value = tasks.value.map(t => ({
    ...t,
    reviewed: t.taskId === currentTaskId.value ? true : t.reviewed,
    inProgress: false
  }))
  
  // Guardar observaciones de esta tarea
  const taskObservations = observations.value.filter(o => o.taskId === currentTaskId.value)
  
  $q.notify({
    type: 'positive',
    message: `✅ Tarea completada (${taskObservations.length} observaciones)`
  })
  
  currentTaskId.value = null
  currentTaskTitle.value = null
  
  // Verificar si quedan tareas pendientes
  const pendientes = tasks.value.filter(t => !t.reviewed)
  if (pendientes.length === 0) {
    $q.notify({
      type: 'info',
      message: '🎉 ¡Todas las tareas han sido completadas!'
    })
  }
  status.value = 'tasklist'
}

function addObservation(observation: HeuristicObservation) {
  observations.value.push(observation)
}

function deleteObservation(index: number) {
  observations.value.splice(index, 1)
}

function clearObservations() {
  observations.value = []
}

// ============================================================
// INICIALIZACIÓN DE GRABACIONES
// ============================================================
async function iniciarGrabacionesYTimer() {
  await nextTick()

  if (faceVideoEl.value && faceStream) {
    faceVideoEl.value.srcObject = faceStream
  }

  if (faceStream) {
    faceChunks = []
    faceRecorder = new MediaRecorder(faceStream, { mimeType: 'video/webm' })
    faceRecorder.ondataavailable = (e) => { if (e.data.size > 0) faceChunks.push(e.data) }
    faceRecorder.start()
  }

  if (screenStream) {
    screenChunks = []
    screenRecorder = new MediaRecorder(screenStream, { mimeType: 'video/webm' })
    screenRecorder.ondataavailable = (e) => { if (e.data.size > 0) screenChunks.push(e.data) }
    screenRecorder.start()
  }

  window.addEventListener('message', handleFigmaMessage)
  window.addEventListener('beforeunload', handleBeforeUnload)

  timerInterval = setInterval(() => {
    if (startTimestamp.value) elapsedMs.value = Date.now() - startTimestamp.value
  }, 250)

  emotionInterval = setInterval(analizarEmocionActual, EMOTION_CAPTURE_INTERVAL_MS)
}

// ============================================================
// EMOCIONES
// ============================================================
function capturarFrameBase64(): string | null {
  const video = stageRef.value?.faceVideoEl
  const canvas = stageRef.value?.captureCanvas
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

  const tiempo = {
    elapsed_ms_total: startTimestamp.value ? Date.now() - startTimestamp.value : 0
  }

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

    await fetch('/api/emotion-readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.value,
        elapsedMsTotal: tiempo.elapsed_ms_total,
        timestampReal: new Date().toISOString(),
        dominantEmotion: data.dominant_emotion ?? null,
        scoresJson: data.scores ?? null,
      }),
    }).catch(() => {})
  } catch (e) {
    console.warn('Servicio de emociones no disponible', e)
  }
}

// ============================================================
// EVENTOS DE FIGMA
// ============================================================
function handleFigmaMessage(event: MessageEvent) {
  const figmaOrigin = 'https://www.figma.com'
  if (event.origin !== figmaOrigin) return
  const data = event.data
  if (!data?.type || status.value !== 'running') return

  eventosRegistrados.value++
  
  if (sessionId.value) {
    const tiempo = {
      elapsed_ms_total: startTimestamp.value ? Date.now() - startTimestamp.value : 0,
      elapsed_minute: Math.floor((startTimestamp.value ? Date.now() - startTimestamp.value : 0) / 60000),
      elapsed_second: Math.floor(((startTimestamp.value ? Date.now() - startTimestamp.value : 0) % 60000) / 1000),
    }

    fetch('/api/usability-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId.value,
        event_type: data.type,
        event_type_normalizado: 'navegacion',
        node_id: data.data?.presentedNodeId || null,
        elapsed_minute: tiempo.elapsed_minute,
        elapsed_second: tiempo.elapsed_second,
        elapsed_ms_total: tiempo.elapsed_ms_total,
        timestamp_real: new Date().toISOString(),
        raw_payload: data.data,
      }),
    }).catch(() => {})
  }
}

function handleBeforeUnload() {
  if (status.value === 'running' || status.value === 'tasklist') {
    navigator.sendBeacon?.(
      `/api/heuristic-sessions/${sessionId.value}`,
      JSON.stringify({ status: 'abandoned' })
    )
  }
}

async function finalizarEvaluacion() {
  if (timerInterval) clearInterval(timerInterval)
  if (emotionInterval) clearInterval(emotionInterval)
  window.removeEventListener('message', handleFigmaMessage)
  window.removeEventListener('beforeunload', handleBeforeUnload)

  await heuristicApi.finishSession(sessionId.value!, {
    status: 'completed',
    durationSeconds: Math.floor(elapsedMs.value / 1000)
  })

  await detenerYSubirGrabaciones()
  status.value = 'finished'
}

async function detenerYSubirGrabaciones() {
  const [faceBlob, screenBlob] = await Promise.all([
    detenerRecorder(faceRecorder),
    detenerRecorder(screenRecorder),
  ])

  if (faceBlob) await subirVideo(faceBlob, 'face')
  if (screenBlob) await subirVideo(screenBlob, 'screen')
}

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

async function subirVideo(blob: Blob, tipo: 'screen' | 'face'): Promise<string | null> {
  if (!sessionId.value) return null

  const formData = new FormData()
  formData.append('file', blob, `${tipo}_${sessionId.value}.webm`)
  formData.append('session_id', sessionId.value)
  formData.append('video_type', tipo)

  try {
    const response = await fetch('/api/usability-sessions/upload/video', {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) throw new Error('No se pudo subir el video')
    const data = await response.json()
    return data.videoKey
  } catch (error) {
    console.error(`Error subiendo video ${tipo}:`, error)
    return null
  }
}

function cerrarEvaluacion() {
  router.push({ name: 'experto-proyectos' })
}

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (emotionInterval) clearInterval(emotionInterval)
  window.removeEventListener('message', handleFigmaMessage)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  faceStream?.getTracks().forEach((t) => t.stop())
  screenStream?.getTracks().forEach((t) => t.stop())
})
</script>

<style scoped>
.hidden { display: none; }
</style>