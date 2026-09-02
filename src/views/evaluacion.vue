<template>
<div class="w-full h-screen relative">

    <!-- ===================== PANTALLA 0: CONSENTIMIENTO ===================== -->
    <q-dialog
  :model-value="status === 'consent'"
  persistent
>
  <q-card>
    <q-card-section>

      <div class="text-overline text-primary">
        Antes de empezar
      </div>

      <div class="text-h5 text-weight-bold q-mt-sm">
        Esta prueba 
      </div>

      <div class="text-body2 text-thirth q-mt-md">

        Durante el recorrido se grabará tu pantalla,
        tu rostro mediante la cámara y se analizarán
        las expresiones faciales para inferir emociones.

        Toda la información será utilizada únicamente
        con fines de investigación de usabilidad.

      </div>

    </q-card-section>

    <q-separator dark />

    <q-card-section>

      <q-checkbox
        v-model="consentChecked"
        color="primary"
      >
        <div class="text-body2">
          Entiendo y autorizo la grabación de mi pantalla y cámara.
        </div>
      </q-checkbox>

      <q-banner
        v-if="permissionsError"
        dense
        rounded
        class="bg-negative text-white q-mt-md"
      >
        {{ permissionsError }}
      </q-banner>

    </q-card-section>

    <q-card-actions align="right">

      <q-btn
        color="primary"
        unelevated
        icon="arrow_forward"
        label="Continuar"
        :loading="loadingPermissions"
        :disable="!consentChecked"
        @click="pedirPermisosYContinuar"
      />

    </q-card-actions>

  </q-card>
</q-dialog>

    <!-- ===================== PANTALLA 1: TAREA / INICIO ===================== -->
 <q-dialog
  :model-value="status === 'idle'"
  persistent
>
  <q-card>

    <q-card-section>

      <div class="text-overline text-primary">
        Prueba de Usabilidad
      </div>

      <div class="text-h5 text-weight-bold q-mt-sm">
        Tu tarea
      </div>

      <div class="text-body1 q-mt-md">
        {{ taskDescription }}
      </div>

    </q-card-section>

    <q-separator dark />

    <q-card-section>

      <div class="row q-col-gutter-md">

        <div class="col">

          <q-chip
            :color="camaraLista ? 'positive' : 'grey-7'"
            text-color="white"
            icon="videocam"
          >
            Cámara
          </q-chip>

        </div>

        <div class="col">

          <q-chip
            :color="pantallaLista ? 'positive' : 'grey-7'"
            text-color="white"
            icon="desktop_windows"
          >
            Pantalla
          </q-chip>

        </div>

      </div>

    </q-card-section>

    <q-card-actions align="right">

      <q-btn
        color="primary"
        icon="play_arrow"
        unelevated
        label="Iniciar recorrido"
        :loading="loadingStart"
        @click="iniciarRecorrido"
      />

    </q-card-actions>

  </q-card>
</q-dialog>

    <!-- ===================== PANTALLA 2: PROTOTIPO EN CURSO ===================== -->
    <template v-if="status === 'running' || status === 'finished'">
     <iframe
    ref="figmaFrame"
    class="w-full h-full border-0"
    :src="figmaEmbedUrl"
    allowfullscreen
/>
      <!-- video oculto: fuente de la cámara para capturar frames -->
      <video ref="faceVideoEl" class="hidden" autoplay playsinline muted />
      <canvas ref="captureCanvas" class="hidden" width="320" height="240" />

      <!-- Barra flotante: timer + estado emocional + botón finalizar -->
  <q-card
  v-if="status==='running'"
  dark
  class="absolute-top bg-dark"
  style="
    left:50%;
    transform:translateX(-50%);
    margin-top:18px;
    border-radius:14px;
    z-index:50;
  "
>

  <q-card-section horizontal class="items-center">

    <q-chip
      color="negative"
      text-color="white"
      icon="fiber_manual_record"
    >
      {{ tiempoFormateado }}
    </q-chip>

    <q-separator vertical inset />

    <q-chip
      color="primary"
      text-color="white"
    >
      {{ emocionActualEmoji }}
      &nbsp;
      {{ emocionActualLabel }}
    </q-chip>

    <q-separator vertical inset />

    <q-btn
      color="negative"
      unelevated
      icon="stop"
      label="Finalizar"
      @click="finalizarRecorrido"
    />

  </q-card-section>

</q-card>
    </template>

    <!-- ===================== PANTALLA 3: FIN ===================== -->

<q-dialog
  :model-value="status==='finished'"
  persistent
>

  <q-card
    dark
    class="bg-dark"
    style="width:450px;border-radius:18px;"
  >

    <q-card-section class="text-center">

      <q-spinner
        v-if="subiendoVideos"
        color="primary"
        size="48px"
      />

      <q-icon
        v-else
        name="check_circle"
        color="positive"
        size="54px"
      />

      <div class="text-h6 q-mt-lg">

        {{
          subiendoVideos
          ? 'Guardando grabaciones...'
          : 'Recorrido finalizado'
        }}

      </div>

      <div class="text-body2 text-grey-4 q-mt-sm">

        Tiempo:
        {{ tiempoFormateado }}

      </div>

      <div class="text-caption text-grey-5">

        {{ eventosRegistrados }}

        eventos

        •

        {{ lecturasEmocionRegistradas }}

        lecturas

      </div>

    </q-card-section>

  </q-card>

</q-dialog>
</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()

/* ============================================================
 * CONFIGURACIÓN DEL PROTOTIPO Y SERVICIOS
 * ==========================================================*/
const FILE_KEY = 'JgVFcd3J8KSUL6MMLlZ6YY'
const NODE_ID = '1-759'
const CLIENT_ID = 'ATBfU46hXxHKWnVxld4rL9'

// Servicio de IA de emociones (FastAPI, proyecto/servidor aparte)
const EMOTION_SERVICE_URL = 'http://localhost:8000/analyze-frame'
// Cada cuánto se manda un frame a analizar (ms)
const EMOTION_CAPTURE_INTERVAL_MS = 2000

const taskDescription = ref(
  'Encuentra la opción para crear un nuevo pedido y complétalo hasta la pantalla de confirmación.'
)

const figmaEmbedUrl = computed(() => {
  const params = new URLSearchParams({
    'node-id': NODE_ID,
    'embed-host': 'share',
    'client-id': CLIENT_ID,
  })
  return `https://embed.figma.com/proto/${FILE_KEY}?${params.toString()}`
})

const nodeNames: Record<string, string> = {
  '1:759': 'Pantalla inicial',
}

const emotionEmojis: Record<string, string> = {
  happy: '🙂', sad: '🙁', angry: '😠', surprise: '😮', disgust: '😖', fear: '😨',
}
const emotionLabelsEs: Record<string, string> = {
  happy: 'Felicidad', sad: 'Tristeza', angry: 'Enojo',
  surprise: 'Sorpresa', disgust: 'Asco', fear: 'Miedo',
}

/* ============================================================
 * ESTADO GENERAL
 * ==========================================================*/
type Status = 'consent' | 'idle' | 'running' | 'finished'
const status = ref<Status>('consent')
const consentChecked = ref(false)
const loadingPermissions = ref(false)
const permissionsError = ref<string | null>(null)
const loadingStart = ref(false)
const subiendoVideos = ref(false)

const figmaFrame = ref<HTMLIFrameElement | null>(null)
const faceVideoEl = ref<HTMLVideoElement | null>(null)
const captureCanvas = ref<HTMLCanvasElement | null>(null)
const figmaOrigin = 'https://www.figma.com'

const sessionId = ref<string | null>(null)
const startTimestamp = ref<number | null>(null)
const elapsedMs = ref(0)
const eventosRegistrados = ref(0)
const lecturasEmocionRegistradas = ref(0)
const emocionActual = ref<string | null>(null)

let timerInterval: ReturnType<typeof setInterval> | null = null
let emotionInterval: ReturnType<typeof setInterval> | null = null

/* ============================================================
 * STREAMS Y GRABACIÓN
 * ==========================================================*/
const camaraLista = ref(false)
const pantallaLista = ref(false)

let faceStream: MediaStream | null = null
let screenStream: MediaStream | null = null
let faceRecorder: MediaRecorder | null = null
let screenRecorder: MediaRecorder | null = null
let faceChunks: Blob[] = []
let screenChunks: Blob[] = []

/* ============================================================
 * TIMER
 * ==========================================================*/
const tiempoFormateado = computed(() => {
  const totalSeconds = Math.floor(elapsedMs.value / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
})

const emocionActualEmoji = computed(() =>
  emocionActual.value ? emotionEmojis[emocionActual.value] ?? '—' : '—'
)
const emocionActualLabel = computed(() =>
  emocionActual.value ? emotionLabelsEs[emocionActual.value] ?? emocionActual.value : 'analizando…'
)

function tiempoActual() {
  const totalMs = startTimestamp.value ? Date.now() - startTimestamp.value : 0
  return {
    elapsed_ms_total: totalMs,
    elapsed_minute: Math.floor(totalMs / 60000),
    elapsed_second: Math.floor((totalMs % 60000) / 1000),
  }
}

/* ============================================================
 * PASO 0: PERMISOS (cámara + pantalla)
 * ==========================================================*/
async function pedirPermisosYContinuar() {
  loadingPermissions.value = true
  permissionsError.value = null

  try {
    faceStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    camaraLista.value = true
  } catch (e) {
    permissionsError.value = 'No se pudo acceder a la cámara. Revisa los permisos del navegador.'
    loadingPermissions.value = false
    return
  }

  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
    pantallaLista.value = true
  } catch (e) {
    permissionsError.value = 'No se pudo acceder a la pantalla. Revisa los permisos del navegador.'
    loadingPermissions.value = false
    return
  }

  status.value = 'idle'
  loadingPermissions.value = false
}

/* ============================================================
 * LLAMADAS AL BACKEND DE LA APP
 * ==========================================================*/
async function crearSesion() {
  const res = await fetch('/api/usability-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proyectId: 'f6b509b0-64b8-48cf-a211-fef1f49f5a96',
      userId: auth.user?.user_id,
      fileKey: FILE_KEY,
      nodeIdInicial: NODE_ID,
      taskDescription: taskDescription.value,
      deviceType: /Mobi/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent,
    }),
  })
  if (!res.ok) throw new Error('No se pudo crear la sesión')
  const data = await res.json()
  return data.sessionId as string
}

async function cerrarSesion(status: 'completed' | 'abandoned') {
  if (!sessionId.value) return
  await fetch(`/api/usability-sessions/${sessionId.value}/finish`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      duration_seconds: Math.floor(elapsedMs.value / 1000),
      status,
    }),
  }).catch(() => {})
}

async function registrarEvento(eventType: string, payload: unknown, nodeId?: string) {
  if (!sessionId.value) return
  const tiempo = tiempoActual()
  eventosRegistrados.value++

  fetch('/api/usability-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId.value,
      event_type: eventType,
      event_type_normalizado: 'navegacion',
      node_id: nodeId ?? null,
      screen_name: nodeId
        ? nodeNames[nodeId] ?? '(sin nombre asignado)'
        : null,
      elapsed_minute: tiempo.elapsed_minute,
      elapsed_second: tiempo.elapsed_second,
      elapsed_ms_total: tiempo.elapsed_ms_total,
      timestamp_real: new Date().toISOString(),
      raw_payload: payload ?? null,
    }),
  }).catch(() => {})
}

async function registrarLecturaEmocion(reading: {
  elapsed_ms_total: number
  dominant_emotion: string | null
  scores: Record<string, number> | null
  face_detected: boolean
}) {
  if (!sessionId.value) return
  lecturasEmocionRegistradas.value++

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
  }).catch(() => {})
}

async function subirVideo(
  blob: Blob,
  tipo: 'screen' | 'face',
): Promise<string | null> {
  if (!sessionId.value) return null

  const formData = new FormData()

  formData.append(
    'file',
    blob,
    `${tipo}_${sessionId.value}.webm`,
  )
console.log("lo que se va a mandar es : ",  sessionId.value)
  formData.append('session_id', sessionId.value)
  formData.append('video_type', tipo)

  try {
    const response = await fetch('/api/usability-sessions/upload/video', {

      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('No se pudo subir el video')
    }

    const data = await response.json()

    // Se espera algo como:
    // {
    //   videoKey: "usability/xxxx/screen.webm"
    // }

    return data.videoKey
  } catch (error) {
    console.error(`Error subiendo video ${tipo}:`, error)
    return null
  }
}
/* ============================================================
 * ANÁLISIS DE EMOCIONES EN PARALELO
 * ==========================================================*/
function capturarFrameBase64(): string | null {

  const video = faceVideoEl.value
  const canvas = captureCanvas.value
  if (!video || !canvas) return null

  // Si el video todavía no tiene dimensiones reales (stream no conectado
  // o aún no cargó el primer frame), no hay nada válido que capturar.
  if (!video.videoWidth || !video.videoHeight) return null

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Igualar el canvas al tamaño real del video evita distorsión y
  // coincide con el comportamiento de la versión que sí funciona.
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

async function analizarEmocionActual() {
  console.log('[DEBUG] analizarEmocionActual() se ejecutó')
  console.log('[DEBUG] sessionId.value =', sessionId.value)
 
  const imageBase64 = capturarFrameBase64()
  console.log('[DEBUG] imageBase64 es null?', imageBase64 === null)
 
  if (!imageBase64 || !sessionId.value) {
    console.log('[DEBUG] se corta aquí por imageBase64 o sessionId vacíos')
    return
  }
 
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
     console.log("la respueta del servicio de IA es : ", data)

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
 

/* ============================================================
 * EVENTOS DE FIGMA
 * ==========================================================*/
function handleMessage(event: MessageEvent) {
  if (event.origin !== figmaOrigin) return
  const data = event.data
  if (!data?.type || status.value !== 'running') return

  switch (data.type) {
    case 'INITIAL_LOAD':
      registrarEvento('INITIAL_LOAD', data.data)
      break
    case 'PRESENTED_NODE_CHANGED': {
      registrarEvento('PRESENTED_NODE_CHANGED', data.data, data.data?.presentedNodeId)
      break
    }
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

/* ============================================================
 * ACCIONES PRINCIPALES
 * ==========================================================*/
async function iniciarRecorrido() {
  loadingStart.value = true
  try {
    sessionId.value = await crearSesion()
    startTimestamp.value = Date.now()
    elapsedMs.value = 0
    eventosRegistrados.value = 0
    lecturasEmocionRegistradas.value = 0
    status.value = 'running'

    // El <video> vive dentro de un v-if, así que hay que esperar a que
    // Vue termine de montarlo en el DOM antes de poder usar su ref.
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

      screenStream.getVideoTracks()[0]?.addEventListener('ended', finalizarRecorrido)
    }

    window.addEventListener('message', handleMessage)
    window.addEventListener('beforeunload', handleBeforeUnload)

    timerInterval = setInterval(() => {
      if (startTimestamp.value) {
        elapsedMs.value = Date.now() - startTimestamp.value
      }
    }, 250)

    emotionInterval = setInterval(analizarEmocionActual, EMOTION_CAPTURE_INTERVAL_MS)
  } catch (e) {
    console.error(e)
  } finally {
    loadingStart.value = false
  }
}

async function finalizarRecorrido() {
  if (timerInterval) clearInterval(timerInterval)
  if (emotionInterval) clearInterval(emotionInterval)
  window.removeEventListener('message', handleMessage)
  window.removeEventListener('beforeunload', handleBeforeUnload)

  status.value = 'finished'
  subiendoVideos.value = true

  await cerrarSesion('completed')
  await detenerYSubirGrabaciones()

  subiendoVideos.value = false
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

async function detenerYSubirGrabaciones() {
  const [faceBlob, screenBlob] = await Promise.all([
    detenerRecorder(faceRecorder),
    detenerRecorder(screenRecorder),
  ])

  if (faceBlob) await subirVideo(faceBlob, 'face')
  if (screenBlob) await subirVideo(screenBlob, 'screen')

  faceStream?.getTracks().forEach((t) => t.stop())
  screenStream?.getTracks().forEach((t) => t.stop())
}

function handleBeforeUnload() {
  if (status.value === 'running') {
    navigator.sendBeacon?.(
      `/api/usability-sessions/${sessionId.value}`,
      JSON.stringify({ status: 'abandoned', duration_seconds: Math.floor(elapsedMs.value / 1000) })
    )
  }
}

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (emotionInterval) clearInterval(emotionInterval)
  window.removeEventListener('message', handleMessage)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  faceStream?.getTracks().forEach((t) => t.stop())
  screenStream?.getTracks().forEach((t) => t.stop())
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>