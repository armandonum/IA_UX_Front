<!-- components/experto/gaze/GazeVideoOverlay.vue -->
<template>
  <div class="gaze-video-overlay">
    <!-- ============================================================ -->
    <!-- CONTROLES                                                     -->
    <!-- ============================================================ -->
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

      <q-toggle
        v-model="showTrail"
        label="Rastro de mirada"
        dense
        color="primary"
        @update:model-value="redrawTrail"
      />

      <q-toggle
        v-model="showCurrentMarker"
        label="Punto actual"
        dense
        color="primary"
      />

      <q-space />

      <div class="text-caption text-grey-7">
        <q-icon name="timer" size="14px" />
        {{ formatTime(currentTimeMs) }} / {{ formatTime(durationMs) }}
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- LOADING                                                       -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando video y datos...</div>
    </div>

    <!-- ============================================================ -->
    <!-- SIN VIDEO                                                     -->
    <!-- ============================================================ -->
    <div v-else-if="!videoUrl" class="text-center q-py-xl text-grey-6">
      <q-icon name="videocam_off" size="64px" />
      <div class="text-h6 q-mt-md">No hay video de pantalla</div>
      <div class="text-caption">Esta sesión no tiene video grabado</div>
    </div>

    <!-- ============================================================ -->
    <!-- VIDEO + CANVAS                                                -->
    <!-- ============================================================ -->
    <div v-else class="video-container">
      <!-- Video -->
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

      <!-- Canvas con el rastro de mirada -->
      <canvas
        ref="canvasRef"
        class="gaze-canvas"
        :width="videoWidth"
        :height="videoHeight"
      />

      <!-- Punto actual (opcional, encima del canvas) -->
      <div
        v-if="showCurrentMarker && currentGaze"
        class="current-gaze-marker"
        :style="{
          left: (currentGaze.gazeX * 100) + '%',
          top: (currentGaze.gazeY * 100) + '%',
        }"
      >
        <div class="gaze-marker-inner" />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- BARRA DE PROGRESO                                             -->
    <!-- ============================================================ -->
    <q-slider
      v-if="videoReady"
      v-model="currentTimeMs"
      :min="0"
      :max="durationMs"
      :step="100"
      class="q-mt-md"
      color="primary"
      @update:model-value="onSliderChange"
      :label-value="formatTime(currentTimeMs)"
    />

    <!-- ============================================================ -->
    <!-- LEYENDA                                                       -->
    <!-- ============================================================ -->
    <div v-if="videoReady" class="row items-center q-gutter-md q-mt-md">
      <div class="text-caption text-grey-7 text-weight-medium">
        Intensidad de mirada acumulada:
      </div>
      <div class="heat-legend-bar" />
      <div class="text-caption text-grey-6">
        Menos mirado
        <q-icon name="arrow_right_alt" size="14px" />
        Más mirado
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- INFO ACTUAL                                                   -->
    <!-- ============================================================ -->
    <div
      v-if="currentGaze && videoReady"
      class="row items-center q-gutter-md q-mt-md"
    >
      <q-card flat bordered class="q-pa-sm">
        <div class="text-caption text-grey-7">Posición actual</div>
        <div class="text-body2 font-mono">
          X: {{ (currentGaze.gazeX * 100).toFixed(1) }}% |
          Y: {{ (currentGaze.gazeY * 100).toFixed(1) }}%
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
const showTrail = ref(true)
const showCurrentMarker = ref(true)

// Canvas persistente (para acumular densidad sin perder el rastro)
let trailCanvas: HTMLCanvasElement | null = null
let trailCtx: CanvasRenderingContext2D | null = null

// Eventos ya procesados (para no redibujar los mismos)
let processedEventIds = new Set<string>()

// ============================================================
// COMPUTED
// ============================================================
const currentGaze = computed(() => {
  if (!gazeEvents.value.length) return null

  const closest = gazeEvents.value.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.elapsedMsTotal - currentTimeMs.value)
    const currDiff = Math.abs(curr.elapsedMsTotal - currentTimeMs.value)
    return currDiff < prevDiff ? curr : prev
  })

  const diff = Math.abs(closest.elapsedMsTotal - currentTimeMs.value)
  if (diff > 300) return null

  return closest
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

  nextTick(() => {
    initTrailCanvas()
    redrawTrail()
  })
}

function onTimeUpdate() {
  const video = videoRef.value
  if (!video) return
  currentTimeMs.value = video.currentTime * 1000
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

  // Resetear rastro
  processedEventIds.clear()
  if (trailCanvas && trailCtx) {
    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height)
  }
  drawCanvas()
}

function onSpeedChange(value: number | null) {
  if (value === null) return
  const video = videoRef.value
  if (video) video.playbackRate = value
}

function onSliderChange(value: number | null) {
  if (value === null) return
  seekVideo(value)
}

function seekVideo(ms: number) {
  const video = videoRef.value
  if (!video) return
  video.currentTime = ms / 1000
  currentTimeMs.value = ms

  // Al hacer seek, reconstruir el rastro hasta este punto
  rebuildTrailUntil(ms)
}

// ============================================================
// TRAIL CANVAS (acumulativo y persistente)
// ============================================================
function initTrailCanvas() {
  // Crear canvas temporal (invisible en el DOM) para acumular
  trailCanvas = document.createElement('canvas')
  trailCanvas.width = videoWidth.value
  trailCanvas.height = videoHeight.value

  trailCtx = trailCanvas.getContext('2d')
  if (!trailCtx) return

  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height)
  processedEventIds.clear()
}

/**
 * Reconstruye el rastro desde 0 hasta el tiempo `untilMs`
 */
function rebuildTrailUntil(untilMs: number) {
  if (!trailCtx || !trailCanvas) return

  // Limpiar
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height)
  processedEventIds.clear()

  // Procesar eventos hasta el tiempo
  const eventsToProcess = gazeEvents.value.filter(
    (e) => e.elapsedMsTotal <= untilMs,
  )

  eventsToProcess.forEach((event) => {
    paintGazePoint(event)
    processedEventIds.add(event.eventId)
  })

  drawCanvas()
}

/**
 * Pinta un punto de mirada en el canvas de rastro
 * con acumulación de densidad
 */
function paintGazePoint(event: GazeEvent) {
  if (!trailCtx || !trailCanvas) return

  const x = event.gazeX * trailCanvas.width
  const y = event.gazeY * trailCanvas.height

  // Radio del "pincel" del rastro
  const radius = 50
  // Opacidad por punto (acumulativa → vuelve a pasar = más intenso)
  const opacity = 0.05

  // Blend mode 'lighter' = acumulación aditiva
  trailCtx.globalCompositeOperation = 'lighter'

  const gradient = trailCtx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`)
  gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.4})`)
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  trailCtx.fillStyle = gradient
  trailCtx.beginPath()
  trailCtx.arc(x, y, radius, 0, Math.PI * 2)
  trailCtx.fill()

  // Reset blend mode
  trailCtx.globalCompositeOperation = 'source-over'
}

/**
 * Cuando se reproduce el video, se van acumulando los eventos
 * que aún no han sido pintados
 */
function accumulateEventsUpTo(untilMs: number) {
  if (!trailCtx) return

  const newEvents = gazeEvents.value.filter(
    (e) =>
      e.elapsedMsTotal <= untilMs &&
      !processedEventIds.has(e.eventId),
  )

  newEvents.forEach((event) => {
    paintGazePoint(event)
    processedEventIds.add(event.eventId)
  })

  return newEvents.length > 0
}

// ============================================================
// CANVAS PRINCIPAL (compone el rastro con colormap)
// ============================================================
function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !trailCanvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 1. Acumular eventos nuevos hasta el tiempo actual
  accumulateEventsUpTo(currentTimeMs.value)

  // 2. Limpiar canvas principal
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 3. Si no se muestra el rastro, salir
  if (!showTrail.value) return

  // 4. Aplicar colormap al canvas de densidad y dibujarlo
  drawColormapFromTrail(ctx)
}

/**
 * Toma el canvas de densidad (trailCanvas, en escala de grises)
 * y lo pinta con la paleta de colores en el canvas principal.
 */
function drawColormapFromTrail(ctx: CanvasRenderingContext2D) {
  if (!trailCanvas || !trailCtx) return

  const width = trailCanvas.width
  const height = trailCanvas.height

  // Leer pixels del canvas de densidad
  const imageData = trailCtx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Encontrar densidad máxima (para normalizar)
  let maxDensity = 0
  for (let i = 0; i < data.length; i += 4) {
    const density = data[i]
    if (density > maxDensity) maxDensity = density
  }

  if (maxDensity === 0) return

  // Aplicar colormap pixel por pixel
  for (let i = 0; i < data.length; i += 4) {
    const density = data[i]

    if (density === 0) {
      data[i + 3] = 0
      continue
    }

    const intensity = density / maxDensity
    const color = getHeatColor(intensity)

    data[i] = color.r
    data[i + 1] = color.g
    data[i + 2] = color.b
    // Alpha proporcional (más intenso = más opaco)
    data[i + 3] = Math.min(220, Math.round(intensity * 220 + 40))
  }

  // Crear canvas temporal con el colormap aplicado
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = width
  colorCanvas.height = height
  const colorCtx = colorCanvas.getContext('2d')
  if (!colorCtx) return

  colorCtx.putImageData(imageData, 0, 0)

  // Dibujar en el canvas principal
  ctx.globalCompositeOperation = 'source-over'
  ctx.drawImage(colorCanvas, 0, 0)
}

/**
 * Paleta colormap tipo "inferno" para el heatmap
 */
function getHeatColor(intensity: number): { r: number; g: number; b: number } {
  const t = Math.max(0, Math.min(1, intensity))

  if (t < 0.15) {
    const f = t / 0.15
    return {
      r: Math.round(0 + f * 30),
      g: Math.round(50 + f * 80),
      b: Math.round(150 + f * 105),
    }
  } else if (t < 0.35) {
    const f = (t - 0.15) / 0.2
    return {
      r: Math.round(30 + f * 20),
      g: Math.round(130 + f * 100),
      b: Math.round(255 - f * 30),
    }
  } else if (t < 0.55) {
    const f = (t - 0.35) / 0.2
    return {
      r: Math.round(50 + f * 50),
      g: Math.round(230 - f * 10),
      b: Math.round(225 - f * 175),
    }
  } else if (t < 0.75) {
    const f = (t - 0.55) / 0.2
    return {
      r: Math.round(100 + f * 155),
      g: Math.round(220 + f * 25),
      b: Math.round(50 - f * 50),
    }
  } else if (t < 0.9) {
    const f = (t - 0.75) / 0.15
    return {
      r: 255,
      g: Math.round(245 - f * 100),
      b: Math.round(0 + f * 20),
    }
  } else {
    const f = (t - 0.9) / 0.1
    return {
      r: Math.round(255 - f * 40),
      g: Math.round(145 - f * 100),
      b: Math.round(20 - f * 20),
    }
  }
}

/**
 * Redibuja el rastro completo (útil cuando se cambia un toggle)
 */
function redrawTrail() {
  drawCanvas()
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
// WATCHERS
// ============================================================
// Cada vez que cambia el tiempo actual → redibujar canvas
watch(currentTimeMs, () => {
  drawCanvas()
})

// Si cambia el toggle de rastro → redibujar
watch(showTrail, () => {
  drawCanvas()
})

// Si cambia la sesión → recargar y resetear
watch(
  () => props.sessionId,
  async () => {
    processedEventIds.clear()
    if (trailCtx && trailCanvas) {
      trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height)
    }
    await loadGazeEvents()
  },
)

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  await loadGazeEvents()
})

onBeforeUnmount(() => {
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

/* ============================================================
   PUNTO ACTUAL (pequeño, sobre el rastro)
   ============================================================ */
.current-gaze-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.gaze-marker-inner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #EF4444;
  box-shadow:
    0 0 0 3px rgba(239, 68, 68, 0.4),
    0 0 12px rgba(239, 68, 68, 0.6);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow:
      0 0 0 3px rgba(239, 68, 68, 0.4),
      0 0 12px rgba(239, 68, 68, 0.6);
  }
  50% {
    box-shadow:
      0 0 0 8px rgba(239, 68, 68, 0.15),
      0 0 20px rgba(239, 68, 68, 0.8);
  }
}

/* ============================================================
   LEYENDA
   ============================================================ */
.heat-legend-bar {
  width: 180px;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    to right,
    #001866 0%,
    #1E82FF 15%,
    #32C8FF 35%,
    #64E6B4 55%,
    #FFFF00 75%,
    #FF9100 90%,
    #DC2626 100%
  );
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
</style>