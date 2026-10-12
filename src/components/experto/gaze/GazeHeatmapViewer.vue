<!-- components/experto/gaze/GazeHeatmapViewer.vue -->
<template>
  <div class="gaze-heatmap-viewer">
    <!-- ============================================================ -->
    <!-- CONTROLES                                                     -->
    <!-- ============================================================ -->
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-select
        v-model="selectedNodeId"
        :options="availableNodes"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        dense
        outlined
        label="Filtrar por pantalla"
        clearable
        style="min-width: 250px;"
        @update:model-value="loadHeatmap"
      />

      <q-btn
        color="primary"
        icon="refresh"
        label="Actualizar"
        unelevated
        dense
        :loading="loading"
        @click="loadHeatmap"
      />

      <q-space />

      <q-toggle
        v-model="showHeatmap"
        label="Heatmap"
        dense
        color="primary"
        @update:model-value="drawCanvas"
      />

      <q-toggle
        v-model="showAOIs"
        label="AOIs"
        dense
        color="primary"
        @update:model-value="drawCanvas"
      />

      <div class="text-caption text-grey-7 q-ml-md">
        <q-icon name="visibility" size="14px" />
        {{ events.length }} puntos
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- LOADING                                                       -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando datos de mirada...</div>
    </div>

    <!-- ============================================================ -->
    <!-- SIN DATOS                                                     -->
    <!-- ============================================================ -->
    <div v-else-if="!events.length" class="text-center q-py-xl text-grey-6">
      <q-icon name="visibility_off" size="64px" />
      <div class="text-h6 q-mt-md">Sin datos de mirada</div>
      <div class="text-caption">
        No hay eventos de eye tracking para esta sesión
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- HEATMAP                                                       -->
    <!-- ============================================================ -->
    <div v-else class="heatmap-container">
      <div class="heatmap-wrapper" :style="wrapperStyle">
        <!-- Imagen del prototipo (solo si existe) -->
        <img
          v-if="thumbnailUrl"
          :src="thumbnailUrl"
          class="prototype-image"
          @load="onImageLoaded"
          @error="onImageError"
          alt="Prototipo"
          crossorigin="anonymous"
        />

        <!-- Fondo neutro si no hay thumbnail -->
        <div v-else class="placeholder-background">
          <div class="placeholder-grid" />
          <div class="placeholder-label">
            <q-icon name="image_not_supported" size="48px" />
            <div class="text-caption q-mt-sm">
              Sin imagen de prototipo
            </div>
            <div class="text-caption text-grey-6" style="font-size: 11px;">
              El heatmap se muestra sobre un lienzo neutro
            </div>
          </div>
        </div>

        <!-- Canvas overlay con heatmap -->
        <canvas
          ref="canvasRef"
          class="gaze-canvas"
          :width="canvasWidth"
          :height="canvasHeight"
        />

        <!-- Loading del canvas -->
        <div
          v-if="isDrawing"
          class="absolute-full flex flex-center bg-black/30"
        >
          <q-spinner color="white" size="32px" />
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- LEYENDA DE COLORES                                            -->
      <!-- ============================================================ -->
      <q-card flat bordered class="q-mt-md">
        <q-card-section class="q-py-sm">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-md">
              <div class="text-caption text-grey-7 text-weight-medium">
                Intensidad de mirada:
              </div>

              <div class="row items-center q-gutter-xs">
                <div class="heat-legend-bar" />
                <div class="column" style="font-size: 11px;">
                  <div class="text-grey-7">Baja</div>
                  <div class="text-grey-7 text-right">Máxima</div>
                </div>
              </div>
            </div>

            <div class="text-caption text-grey-6">
              <q-icon name="info" size="14px" />
              Zonas más cálidas = mayor tiempo de fijación
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ============================================================ -->
      <!-- INFO ADICIONAL                                                -->
      <!-- ============================================================ -->
      <div v-if="stats" class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h5 text-primary text-weight-bold">
              {{ stats.totalEvents }}
            </div>
            <div class="text-caption text-grey-7">Puntos de mirada</div>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h5 text-info text-weight-bold">
              {{ stats.avgConfidence }}%
            </div>
            <div class="text-caption text-grey-7">Confianza promedio</div>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h5 text-warning text-weight-bold">
              {{ stats.durationSec }}s
            </div>
            <div class="text-caption text-grey-7">Duración analizada</div>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h5 text-purple text-weight-bold">
              {{ stats.hottestArea }}
            </div>
            <div class="text-caption text-grey-7">Zona más mirada</div>
          </q-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import {
  gazeEventsApi,
  aoiDefinitionsApi,
} from '@/api/coordinator/gaze-events.api'
import type { GazeEvent } from '@/api/coordinator/gaze-events.api'

const props = defineProps<{
  sessionId: string
  projectId: string
  thumbnailUrl: string | null
  nodeCache?: Map<string, { name: string; type: string }>
}>()

const $q = useQuasar()

// ============================================================
// STATE
// ============================================================
const loading = ref(false)
const isDrawing = ref(false)
const events = ref<GazeEvent[]>([])
const aois = ref<any[]>([])
const selectedNodeId = ref<string | null>(null)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(1200)
const canvasHeight = ref(800)
const imageLoaded = ref(false)

// Toggles
const showHeatmap = ref(true)
const showAOIs = ref(true)

// ============================================================
// COMPUTED
// ============================================================
const wrapperStyle = computed(() => {
  // Si no hay thumbnail, usar aspect ratio 16:9
  if (!props.thumbnailUrl) {
    return {
      width: '100%',
      aspectRatio: '16 / 9',
      maxHeight: '60vh',
    }
  }
  return {}
})

const availableNodes = computed(() => {
  const nodeSet = new Set<string>()
  events.value.forEach((e) => {
    if (e.nodeId) nodeSet.add(e.nodeId)
  })

  return Array.from(nodeSet).map((nodeId) => ({
    label: props.nodeCache?.get(nodeId)?.name || nodeId,
    value: nodeId,
  }))
})

const stats = computed(() => {
  if (!events.value.length) return null

  const totalEvents = events.value.length
  const avgConfidence = Math.round(
    (events.value.reduce((sum, e) => sum + e.confidence, 0) / totalEvents) * 100,
  )
  const firstMs = events.value[0]?.elapsedMsTotal || 0
  const lastMs = events.value[events.value.length - 1]?.elapsedMsTotal || 0
  const durationSec = Math.round((lastMs - firstMs) / 1000)

  // Zona más mirada
  const quadrants = {
    'Sup-Izq': 0,
    'Sup-Der': 0,
    'Inf-Izq': 0,
    'Inf-Der': 0,
    Centro: 0,
  }
  events.value.forEach((e) => {
    const x = e.gazeX
    const y = e.gazeY
    if (x >= 0.33 && x <= 0.66 && y >= 0.33 && y <= 0.66) {
      quadrants.Centro++
    } else if (x < 0.5 && y < 0.5) quadrants['Sup-Izq']++
    else if (x >= 0.5 && y < 0.5) quadrants['Sup-Der']++
    else if (x < 0.5 && y >= 0.5) quadrants['Inf-Izq']++
    else quadrants['Inf-Der']++
  })
  const hottestArea =
    Object.entries(quadrants).sort((a, b) => b[1] - a[1])[0][0]

  return { totalEvents, avgConfidence, durationSec, hottestArea }
})

// ============================================================
// LOAD
// ============================================================
async function loadHeatmap() {
  if (!props.sessionId) return

  loading.value = true
  try {
    const { data: eventsData } = await gazeEventsApi.getBySession(props.sessionId)

    // Filtrar por nodo si aplica
    let filteredEvents = eventsData
    if (selectedNodeId.value) {
      filteredEvents = eventsData.filter((e) => e.nodeId === selectedNodeId.value)
    }
    events.value = filteredEvents

    // Cargar AOIs
    if (props.projectId) {
      try {
        const { data: aoisData } = await aoiDefinitionsApi.getByProject(props.projectId)
        aois.value = aoisData
      } catch (e) {
        console.warn('No se pudieron cargar AOIs:', e)
      }
    }

    await nextTick()
    drawCanvas()
  } catch (e: any) {
    console.error('Error cargando heatmap de mirada:', e)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar datos de mirada',
    })
  } finally {
    loading.value = false
  }
}

// ============================================================
// CANVAS - IMAGEN
// ============================================================
function onImageLoaded() {
  imageLoaded.value = true
  const img = document.querySelector('.prototype-image') as HTMLImageElement
  if (img) {
    canvasWidth.value = img.naturalWidth || 1200
    canvasHeight.value = img.naturalHeight || 800
  }
  nextTick(() => drawCanvas())
}

function onImageError() {
  console.warn('Error al cargar la imagen del prototipo, usando fondo neutro')
  imageLoaded.value = true
  canvasWidth.value = 1200
  canvasHeight.value = 800
  nextTick(() => drawCanvas())
}

// ============================================================
// CANVAS - HEATMAP CON GRADIENTE ACUMULATIVO
// ============================================================
function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  // Inicializar canvas si no hay imagen
  if (!props.thumbnailUrl && !imageLoaded.value) {
    imageLoaded.value = true
    canvasWidth.value = 1200
    canvasHeight.value = 800
  }

  if (!imageLoaded.value && props.thumbnailUrl) return

  isDrawing.value = true

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    isDrawing.value = false
    return
  }

  // Limpiar
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 1. Heatmap acumulativo
  if (showHeatmap.value && events.value.length > 0) {
    drawAccumulativeHeatmap(ctx)
  }

  // 2. AOIs (encima del heatmap)
  if (showAOIs.value && aois.value.length > 0) {
    drawAoisLayer(ctx)
  }

  isDrawing.value = false
}

/**
 * Dibuja el heatmap acumulativo usando un canvas temporal con
 * opacidades bajas y una capa de color intensificado.
 *
 * Este método crea un gradiente REAL donde las zonas con más
 * fijaciones se saturan hacia rojo, mientras que las zonas
 * con menos fijaciones permanecen azules/verdes.
 */
function drawAccumulativeHeatmap(ctx: CanvasRenderingContext2D) {
  const width = canvasWidth.value
  const height = canvasHeight.value

  // ============================================================
  // PASO 1: Crear canvas temporal para acumular densidades
  // ============================================================
  const densityCanvas = document.createElement('canvas')
  densityCanvas.width = width
  densityCanvas.height = height
  const densityCtx = densityCanvas.getContext('2d')
  if (!densityCtx) return

  // Fondo negro (densidad 0)
  densityCtx.fillStyle = 'black'
  densityCtx.fillRect(0, 0, width, height)

  // Radio de influencia de cada punto (píxeles)
  const RADIUS = 60
  // Opacidad de cada punto (acumulativa)
  const OPACITY_PER_POINT = 0.15

  // ============================================================
  // PASO 2: Pintar cada punto con opacidad baja para acumular
  // ============================================================
  densityCtx.globalCompositeOperation = 'lighter'

  events.value.forEach((event) => {
    const x = event.gazeX * width
    const y = event.gazeY * height

    // Gradiente radial: más intenso en el centro
    const gradient = densityCtx.createRadialGradient(x, y, 0, x, y, RADIUS)
    gradient.addColorStop(0, `rgba(255, 255, 255, ${OPACITY_PER_POINT})`)
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${OPACITY_PER_POINT * 0.5})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    densityCtx.fillStyle = gradient
    densityCtx.beginPath()
    densityCtx.arc(x, y, RADIUS, 0, Math.PI * 2)
    densityCtx.fill()
  })

  // ============================================================
  // PASO 3: Aplicar colormap al canvas de densidad
  // ============================================================
  const imageData = densityCtx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Encontrar la densidad máxima para normalizar
  let maxDensity = 0
  for (let i = 0; i < data.length; i += 4) {
    const density = data[i] // canal R (escala de grises)
    if (density > maxDensity) maxDensity = density
  }

  // Si no hay densidad, no dibujar nada
  if (maxDensity === 0) return

  // Aplicar el colormap
  for (let i = 0; i < data.length; i += 4) {
    const density = data[i] // 0-255

    // Normalizar 0-1
    const intensity = density / maxDensity

    // Solo pintar si hay algo de densidad
    if (intensity > 0.02) {
      const color = getHeatColor(intensity)
      data[i] = color.r
      data[i + 1] = color.g
      data[i + 2] = color.b
      // Alpha proporcional a la intensidad
      data[i + 3] = Math.min(255, intensity * 255 * 1.5)
    } else {
      data[i + 3] = 0
    }
  }

  densityCtx.putImageData(imageData, 0, 0)

  // ============================================================
  // PASO 4: Dibujar el heatmap sobre el canvas principal
  // ============================================================
  ctx.globalCompositeOperation = 'source-over'
  ctx.drawImage(densityCanvas, 0, 0)
}

/**
 * Paleta de colores tipo "inferno" / "jet" para el heatmap
 * Azul → Cian → Verde → Amarillo → Naranja → Rojo
 */
function getHeatColor(intensity: number): { r: number; g: number; b: number } {
  // Clamp
  const t = Math.max(0, Math.min(1, intensity))

  if (t < 0.15) {
    // Azul oscuro → Azul
    const f = t / 0.15
    return {
      r: Math.round(0 + f * 30),
      g: Math.round(50 + f * 80),
      b: Math.round(150 + f * 105),
    }
  } else if (t < 0.35) {
    // Azul → Cian
    const f = (t - 0.15) / 0.2
    return {
      r: Math.round(30 + f * 20),
      g: Math.round(130 + f * 100),
      b: Math.round(255 - f * 30),
    }
  } else if (t < 0.55) {
    // Cian → Verde
    const f = (t - 0.35) / 0.2
    return {
      r: Math.round(50 + f * 50),
      g: Math.round(230 - f * 10),
      b: Math.round(225 - f * 175),
    }
  } else if (t < 0.75) {
    // Verde → Amarillo
    const f = (t - 0.55) / 0.2
    return {
      r: Math.round(100 + f * 155),
      g: Math.round(220 + f * 25),
      b: Math.round(50 - f * 50),
    }
  } else if (t < 0.9) {
    // Amarillo → Naranja
    const f = (t - 0.75) / 0.15
    return {
      r: Math.round(255),
      g: Math.round(245 - f * 100),
      b: Math.round(0 + f * 20),
    }
  } else {
    // Naranja → Rojo
    const f = (t - 0.9) / 0.1
    return {
      r: Math.round(255 - f * 40),
      g: Math.round(145 - f * 100),
      b: Math.round(20 - f * 20),
    }
  }
}

// ============================================================
// CANVAS - AOIs
// ============================================================
function drawAoisLayer(ctx: CanvasRenderingContext2D) {
  aois.value.forEach((aoi) => {
    const x1 = (aoi.x1 / 100) * canvasWidth.value
    const y1 = (aoi.y1 / 100) * canvasHeight.value
    const width = ((aoi.x2 - aoi.x1) / 100) * canvasWidth.value
    const height = ((aoi.y2 - aoi.y1) / 100) * canvasHeight.value

    // Borde punteado
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.9)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(x1, y1, width, height)

    // Etiqueta
    ctx.setLineDash([])

    const label = aoi.name || 'AOI'
    ctx.font = 'bold 12px Arial'
    const labelWidth = ctx.measureText(label).width + 16

    // Fondo de la etiqueta
    ctx.fillStyle = 'rgba(139, 92, 246, 0.9)'
    ctx.fillRect(x1, y1 - 22, labelWidth, 22)

    // Texto
    ctx.fillStyle = 'white'
    ctx.fillText(label, x1 + 8, y1 - 6)
  })
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(() => {
  if (props.sessionId) {
    loadHeatmap()
  }
})

watch(
  () => props.sessionId,
  () => {
    if (props.sessionId) {
      loadHeatmap()
    }
  },
)
</script>

<style scoped>
.heatmap-container {
  position: relative;
}

.heatmap-wrapper {
  position: relative;
  display: block;
  width: 100%;
  max-width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
}

.prototype-image {
  display: block;
  width: 100%;
  height: auto;
}

/* ============================================================
   FONDO NEUTRO CUANDO NO HAY THUMBNAIL
   ============================================================ */
.placeholder-background {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, #e2e8f0 1px, transparent 1px),
    linear-gradient(to bottom, #e2e8f0 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.6;
  pointer-events: none;
}

.placeholder-label {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #94a3b8;
}

/* ============================================================
   CANVAS
   ============================================================ */
.gaze-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* ============================================================
   LEYENDA DE COLORES
   ============================================================ */
.heat-legend-bar {
  width: 200px;
  height: 14px;
  border-radius: 7px;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>