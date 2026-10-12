<!-- components/experto/gaze/GazeVideoOverlay.vue -->
<template>
  <div class="gaze-video-overlay">
    <!-- Controles superiores -->
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-btn
        color="primary"
        :icon="playing ? 'pause' : 'play_arrow'"
        :label="playing ? 'Pausar' : 'Reproducir'"
        unelevated
        @click="togglePlay"
        :disable="!videoReady"
      />

      <q-btn
        flat
        icon="replay"
        label="Reiniciar"
        @click="restart"
        :disable="!videoReady"
      />

      <q-select
        v-model="speed"
        :options="[0.5, 1, 1.5, 2]"
        dense
        outlined
        label="Velocidad"
        style="width: 100px;"
        @update:model-value="onSpeedChange"
      />

      <q-space />

      <!-- Toggle puntos -->
      <q-toggle
        v-model="showGazePoints"
        label="Mostrar puntos"
        dense
        color="primary"
      />

      <q-toggle
        v-model="showFixations"
        label="Mostrar fijaciones"
        dense
        color="primary"
      />

      <q-space />

      <div class="text-caption text-grey-7">
        <q-icon name="timer" size="14px" />
        {{ formatTime(currentTimeMs) }} / {{ formatTime(durationMs) }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando video y datos...</div>
    </div>

    <!-- Sin video -->
    <div v-else-if="!videoUrl" class="text-center q-py-xl text-grey-6">
      <q-icon name="videocam_off" size="64px" />
      <div class="text-h6 q-mt-md">No hay video de pantalla</div>
      <div class="text-caption">Esta sesión no tiene video grabado</div>
    </div>

    <!-- Video + Canvas overlay -->
    <div v-else class="video-container">
      <video
        ref="videoRef"
        :src="videoUrl"
        class="gaze-video"
        @loadedmetadata="onVideoLoaded"
        @timeupdate="onTimeUpdate"
        @play="playing = true"
        @pause="playing = false"
        @ended="playing = false"
        crossorigin="anonymous"
      />

      <!-- Canvas overlay con puntos de mirada -->
      <canvas
        ref="canvasRef"
        class="gaze-canvas"
        :width="videoWidth"
        :height="videoHeight"
      />

      <!-- Gaze actual destacado -->
      <div
        v-if="showGazePoints && currentGaze"
        class="current-gaze-marker"
        :style="{
          left: (currentGaze.x * 100) + '%',
          top: (currentGaze.y * 100) + '%',
        }"
      >
        <div class="gaze-marker-inner" />
      </div>

      <!-- Puntos cercanos al tiempo actual -->
      <div
        v-for="(point, idx) in nearbyGazePoints"
        :key="`nearby-${idx}`"
        class="nearby-gaze-marker"
        :style="{
          left: (point.gazeX * 100) + '%',
          top: (point.gazeY * 100) + '%',
          opacity: point.opacity,
        }"
      />
    </div>

    <!-- Barra de progreso interactiva -->
    <q-slider
      v-if="videoReady"
      v-model="currentTimeMs"
      :min="0"
      :max="durationMs"
      :step="100"
      class="q-mt-md"
      color="primary"
      @update:model-value="seekVideo"
      :label-value="formatTime(currentTimeMs)"
    />

    <!-- Info actual -->
    <div v-if="currentGaze && videoReady" class="row items-center q-gutter-md q-mt-md">
      <q-card flat bordered class="q-pa-sm">
        <div class="text-caption text-grey-7">Posición de mirada actual</div>
        <div class="text-body2 font-mono">
          X: {{ (currentGaze.x * 100).toFixed(1) }}% |
          Y: {{ (currentGaze.y * 100).toFixed(1) }}%
        </div>
      </q-card>

      <q-card flat bordered class="q-pa-sm">
        <div class="text-caption text-grey-7">Confianza</div>
        <div class="text-body2 text-weight-medium">
          {{ Math.round(currentGaze.confidence * 100) }}%
        </div>
      </q-card>

      <q-card v-if="currentGaze.nodeId" flat bordered class="q-pa-sm">
        <div class="text-caption text-grey-7">Nodo</div>
        <div class="text-body2">
          {{ getNodeName(currentGaze.nodeId) }}
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import { gazeEventsApi } from '@/api/coordinator/gaze-events.api'
import type { GazeEvent } from '@/api/coordinator/gaze-events.api'

const props = defineProps<{
  sessionId: string
  videoUrl: string | null
  nodeCache?: Map<string, { name: string; type: string }>
}>()

const $q = useQuasar()

// ============================================================
// STATE
// ============================================================
const loading = ref(false)
const playing = ref(false)
const videoReady = ref(false)
const speed = ref(1)

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const currentTimeMs = ref(0)
const durationMs = ref(0)
const videoWidth = ref(1280)
const videoHeight = ref(720)

const gazeEvents = ref<GazeEvent[]>([])

// Toggles
const showGazePoints = ref(true)
const showFixations = ref(true)

// Animation frame
let animationFrameId: number | null = null

// ============================================================
// COMPUTED
// ============================================================
/**
 * Gaze point en el tiempo actual (interpolado)
 */
const currentGaze = computed(() => {
  if (!gazeEvents.value.length) return null

  // Buscar el evento más cercano al tiempo actual (±100ms)
  const closest = gazeEvents.value.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.elapsedMsTotal - currentTimeMs.value)
    const currDiff = Math.abs(curr.elapsedMsTotal - currentTimeMs.value)
    return currDiff < prevDiff ? curr : prev
  })

  const diff = Math.abs(closest.elapsedMsTotal - currentTimeMs.value)
  if (diff > 300) return null // No mostrar si está muy lejos

  return closest
})

/**
 * Puntos cercanos al tiempo actual (para efecto estela)
 */
const nearbyGazePoints = computed(() => {
  const WINDOW_MS = 500 // 500ms antes
  const current = currentTimeMs.value

  return gazeEvents.value
    .filter((e) => {
      const diff = current - e.elapsedMsTotal
      return diff >= 0 && diff <= WINDOW_MS
    })
    .map((e) => {
      const age = current - e.elapsedMsTotal
      const opacity = Math.max(0, 1 - age / WINDOW_MS) * 0.5
      return { ...e, opacity }
    })
})

// ============================================================
// LOAD
// ============================================================
async function loadGazeEvents() {
  if (!props.sessionId) return

  loading.value = true
  try {
    const { data } = await gazeEventsApi.getBySession(props.sessionId)
    gazeEvents.value = data.sort(
      (a, b) => a.elapsedMsTotal - b.elapsedMsTotal,
    )
    console.log(`👁️ ${gazeEvents.value.length} eventos de mirada cargados`)
  } catch (e: any) {
    console.error('Error cargando gaze events:', e)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar eventos de mirada',
    })
  } finally {
    loading.value = false
  }
}

// ============================================================
// VIDEO CONTROLS
// ============================================================
function onVideoLoaded() {
  const video = videoRef.value
  if (!video) return

  videoReady.value = true
  durationMs.value = video.duration * 1000
  videoWidth.value = video.videoWidth
  videoHeight.value = video.videoHeight

  // Ajustar canvas al tamaño real del video
  nextTick(() => {
    const canvas = canvasRef.value
    if (canvas) {
      canvas.width = videoWidth.value
      canvas.height = videoHeight.value
    }
  })
}

function onTimeUpdate() {
  const video = videoRef.value
  if (!video) return
  currentTimeMs.value = video.currentTime * 1000

  // Redibujar canvas
  drawCanvas()
}

function togglePlay() {
  const video = videoRef.value
  if (!video) return

  if (playing.value) {
    video.pause()
  } else {
    video.play().catch((err) => {
      console.error('Error al reproducir:', err)
    })
  }
}

function restart() {
  const video = videoRef.value
  if (!video) return
  video.currentTime = 0
  currentTimeMs.value = 0
  drawCanvas()
}

function onSpeedChange(value: number) {
  const video = videoRef.value
  if (video) video.playbackRate = value
}

function seekVideo(ms: number) {
  const video = videoRef.value
  if (!video) return
  video.currentTime = ms / 1000
  currentTimeMs.value = ms
  drawCanvas()
}

// ============================================================
// CANVAS DRAW
// ============================================================
function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Limpiar
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Dibujar puntos cercanos (estela)
  if (showGazePoints.value) {
    nearbyGazePoints.value.forEach((point) => {
      const x = point.gazeX * canvas.width
      const y = point.gazeY * canvas.height

      ctx.fillStyle = `rgba(59, 130, 246, ${point.opacity})`
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()
    })

    // Dibujar punto actual destacado
    if (currentGaze.value) {
      const x = currentGaze.value.gazeX * canvas.width
      const y = currentGaze.value.gazeY * canvas.height

      // Halo exterior
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
      ctx.beginPath()
      ctx.arc(x, y, 24, 0, Math.PI * 2)
      ctx.fill()

      // Círculo medio
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)'
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      ctx.fill()

      // Punto central
      ctx.fillStyle = '#EF4444'
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()

      // Borde blanco
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }
}

// ============================================================
// HELPERS
// ============================================================
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function getNodeName(nodeId: string): string {
  return props.nodeCache?.get(nodeId)?.name || nodeId
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  await loadGazeEvents()
  await nextTick()
  drawCanvas()
})

watch(() => props.sessionId, async () => {
  await loadGazeEvents()
})

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  const video = videoRef.value
  if (video) video.pause()
})
</script>

<style scoped>
.video-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.gaze-video {
  display: block;
  max-width: 100%;
  height: auto;
}

.gaze-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.current-gaze-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.gaze-marker-inner {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #EF4444;
  border: 3px solid white;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(239, 68, 68, 0.1);
  }
}

.nearby-gaze-marker {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3B82F6;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>