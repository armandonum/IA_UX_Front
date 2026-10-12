<!-- components/experto/gaze/GazeHeatmapViewer.vue -->
<template>
  <div class="gaze-heatmap-viewer">
    <!-- Controles -->
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

      <div class="text-caption text-grey-7">
        <q-icon name="visibility" size="14px" />
        {{ points.length }} puntos de mirada
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando datos de mirada...</div>
    </div>

    <!-- Error / Sin datos -->
    <div v-else-if="!thumbnailUrl || !points.length" class="text-center q-py-xl text-grey-6">
      <q-icon name="visibility_off" size="64px" />
      <div class="text-h6 q-mt-md">
        {{ !thumbnailUrl ? 'No hay imagen de prototipo' : 'Sin datos de mirada' }}
      </div>
      <div class="text-caption">
        {{
          !thumbnailUrl
            ? 'Este proyecto no tiene thumbnail disponible'
            : 'No hay eventos de eye tracking para esta sesión'
        }}
      </div>
    </div>

    <!-- Heatmap -->
    <div v-else class="heatmap-container">
      <div class="heatmap-wrapper">
        <!-- Imagen del prototipo -->
        <img
          :src="thumbnailUrl"
          class="prototype-image"
          @load="onImageLoaded"
          @error="onImageError"
          alt="Prototipo"
        />

        <!-- Canvas overlay con puntos de mirada -->
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

      <!-- Controles de visualización -->
      <q-card flat bordered class="q-mt-md">
        <q-card-section class="q-py-sm">
          <div class="row items-center q-gutter-md">
            <div class="text-caption text-grey-7">Visualización:</div>

            <q-toggle
              v-model="showHeatmap"
              label="Mapa de calor"
              dense
              color="primary"
              @update:model-value="drawCanvas"
            />

            <q-toggle
              v-model="showPoints"
              label="Puntos individuales"
              dense
              color="primary"
              @update:model-value="drawCanvas"
            />

            <q-toggle
              v-model="showAOIs"
              label="Áreas de interés"
              dense
              color="primary"
              @update:model-value="drawCanvas"
            />

            <q-space />

            <div class="row items-center q-gutter-xs">
              <span class="text-caption text-grey-7">Intensidad:</span>
              <div class="row q-gutter-xs items-center">
                <span class="legend-dot" style="background:#3B82F6;"></span>
                <span class="text-caption text-grey-6">Baja</span>
                <span class="legend-dot" style="background:#10B981;"></span>
                <span class="text-caption text-grey-6">Media</span>
                <span class="legend-dot" style="background:#F59E0B;"></span>
                <span class="text-caption text-grey-6">Alta</span>
                <span class="legend-dot" style="background:#EF4444;"></span>
                <span class="text-caption text-grey-6">Máxima</span>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Info adicional -->
      <div v-if="stats" class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h5 text-primary text-weight-bold">
              {{ stats.totalEvents }}
            </div>
            <div class="text-caption text-grey-7">Eventos totales</div>
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
import { gazeEventsApi, aoiMetricsApi, aoiDefinitionsApi } from '@/api/coordinator/gaze-events.api'
import type { GazeEvent, GazeHeatmapPoint } from '@/api/coordinator/gaze-events.api'

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
const points = ref<GazeHeatmapPoint[]>([])
const aois = ref<any[]>([])
const selectedNodeId = ref<string | null>(null)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(1200)
const canvasHeight = ref(800)
const imageLoaded = ref(false)

// Toggles
const showHeatmap = ref(true)
const showPoints = ref(false)
const showAOIs = ref(true)

// ============================================================
// COMPUTED
// ============================================================
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

  // Zona más mirada (cuadrante)
  const quadrants = { 'Sup-Izq': 0, 'Sup-Der': 0, 'Inf-Izq': 0, 'Inf-Der': 0, Centro: 0 }
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
  const hottestArea = Object.entries(quadrants).sort((a, b) => b[1] - a[1])[0][0]

  return { totalEvents, avgConfidence, durationSec, hottestArea }
})

// ============================================================
// LOAD
// ============================================================
async function loadHeatmap() {
  if (!props.sessionId) return

  loading.value = true
  try {
    // Cargar eventos completos
    const { data: eventsData } = await gazeEventsApi.getBySession(props.sessionId)

    // Filtrar por nodo si aplica
    let filteredEvents = eventsData
    if (selectedNodeId.value) {
      filteredEvents = eventsData.filter((e) => e.nodeId === selectedNodeId.value)
    }
    events.value = filteredEvents

    // Cargar puntos de heatmap
    const { data: pointsData } = await gazeEventsApi.getHeatmapData(
      props.sessionId,
      {
        nodeId: selectedNodeId.value || undefined,
      },
    )
    points.value = pointsData

    // Cargar AOIs del proyecto
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
// CANVAS
// ============================================================
function onImageLoaded() {
  imageLoaded.value = true
  const img = document.querySelector('.prototype-image') as HTMLImageElement
  if (img) {
    canvasWidth.value = img.naturalWidth
    canvasHeight.value = img.naturalHeight
  }
  nextTick(() => drawCanvas())
}

function onImageError() {
  $q.notify({
    type: 'negative',
    message: 'Error al cargar la imagen del prototipo',
  })
}

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !imageLoaded.value) return

  isDrawing.value = true

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Limpiar
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 1. Heatmap (mapa de calor)
  if (showHeatmap.value && points.value.length > 0) {
    drawHeatmapLayer(ctx)
  }

  // 2. Puntos individuales
  if (showPoints.value && events.value.length > 0) {
    drawPointsLayer(ctx)
  }

  // 3. AOIs
  if (showAOIs.value && aois.value.length > 0) {
    drawAoisLayer(ctx)
  }

  isDrawing.value = false
}

function drawHeatmapLayer(ctx: CanvasRenderingContext2D) {
  const maxWeight = Math.max(...points.value.map((p) => p.weight), 1)
  const radius = 80

  points.value.forEach((point) => {
    const x = (point.xPct / 100) * canvasWidth.value
    const y = (point.yPct / 100) * canvasHeight.value
    const intensity = point.weight / maxWeight

    // Gradiente radial para efecto de calor
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)

    const color = getHeatColor(intensity)
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`)
    gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`)
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  })
}

function getHeatColor(intensity: number): { r: number; g: number; b: number } {
  // Escala: azul (bajo) → verde → amarillo → rojo (alto)
  if (intensity < 0.25) {
    return { r: 59, g: 130, b: 246 } // Azul
  } else if (intensity < 0.5) {
    return { r: 16, g: 185, b: 129 } // Verde
  } else if (intensity < 0.75) {
    return { r: 245, g: 158, b: 11 } // Naranja
  } else {
    return { r: 239, g: 68, b: 68 } // Rojo
  }
}

function drawPointsLayer(ctx: CanvasRenderingContext2D) {
  events.value.forEach((event) => {
    const x = event.gazeX * canvasWidth.value
    const y = event.gazeY * canvasHeight.value

    ctx.fillStyle = 'rgba(59, 130, 246, 0.6)'
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    // Borde blanco
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 1
    ctx.stroke()
  })
}

function drawAoisLayer(ctx: CanvasRenderingContext2D) {
  aois.value.forEach((aoi) => {
    const x1 = (aoi.x1 / 100) * canvasWidth.value
    const y1 = (aoi.y1 / 100) * canvasHeight.value
    const width = ((aoi.x2 - aoi.x1) / 100) * canvasWidth.value
    const height = ((aoi.y2 - aoi.y1) / 100) * canvasHeight.value

    // Borde
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(x1, y1, width, height)

    // Etiqueta
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(139, 92, 246, 0.9)'
    ctx.fillRect(x1, y1 - 20, 120, 20)

    ctx.fillStyle = 'white'
    ctx.font = 'bold 12px Arial'
    ctx.fillText(aoi.name, x1 + 5, y1 - 5)
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

watch(() => props.sessionId, () => {
  if (props.sessionId) {
    loadHeatmap()
  }
})
</script>

<style scoped>
.heatmap-container {
  position: relative;
}

.heatmap-wrapper {
  position: relative;
  display: inline-block;
  max-width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
}

.prototype-image {
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

.legend-dot {
  display: inline-block;
  width: 16px;
  height: 12px;
  border-radius: 3px;
}
</style>