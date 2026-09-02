<!-- components/experto/heatmap/HeatmapViewer.vue -->

<template>
  <q-dialog v-model="localShow" full-width persistent>
    <q-card style="min-height: 80vh;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">🔥 Mapa de Calor</div>
        <q-space />
        <q-btn dense flat icon="close" @click="close" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <!-- Filtros -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-3">
            <q-select
              v-model="filters.eventType"
              :options="eventTypeOptions"
              label="Tipo de evento"
              dense
              filled
              emit-value
              map-options
            />
          </div>
          <div class="col-3">
            <q-select
              v-model="filters.deviceType"
              :options="deviceOptions"
              label="Dispositivo"
              dense
              filled
              emit-value
              map-options
            />
          </div>
          <div class="col-3">
            <div class="row q-col-gutter-xs">
              <div class="col-6">
                <q-input
                  v-model="filters.timeFrom"
                  label="Desde"
                  dense
                  filled
                  placeholder="00:00"
                  mask="##:##"
                  :rules="[
                    val => !val || validateTime(val) || 'Formato inválido (mm:ss)'
                  ]"
                  @update:model-value="onTimeInputChange"
                >
                  <template v-slot:prepend>
                    <q-icon name="play_arrow" size="xs" />
                  </template>
                </q-input>
              </div>
              <div class="col-6">
                <q-input
                  v-model="filters.timeTo"
                  label="Hasta"
                  dense
                  filled
                  placeholder="05:00"
                  mask="##:##"
                  :rules="[
                    val => !val || validateTime(val) || 'Formato inválido (mm:ss)'
                  ]"
                  @update:model-value="onTimeInputChange"
                >
                  <template v-slot:prepend>
                    <q-icon name="stop" size="xs" />
                  </template>
                </q-input>
              </div>
            </div>
            <div class="text-caption text-grey-6 q-mt-xs" v-if="showTimeHelp">
              <q-icon name="info" size="xs" />
              Formato: minutos:segundos (ej: 01:30, 00:45)
            </div>
          </div>
          <div class="col-3">
            <q-btn
              unelevated
              color="primary"
              label="Generar mapa de calor"
              :loading="loading"
              class="full-width"
              @click="generateHeatmap"
            />
          </div>
        </div>

        <!-- Sugerencias rápidas de tiempo - DINÁMICAS -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-12">
            <div class="text-caption text-grey-6 q-mb-xs">
              Atajos de tiempo 
              <span v-if="props.totalDurationSec && props.totalDurationSec > 0" class="text-grey-5">
                (Duración: {{ formatTimeDisplayMs(props.totalDurationSec * 1000) }})
              </span>
            </div>
            <div class="row q-gutter-sm">
              <q-btn
                v-for="preset in dynamicTimePresets"
                :key="preset.label"
                dense
                outline
                size="sm"
                :label="preset.label"
                :color="isPresetActive(preset) ? 'primary' : 'grey'"
                @click="applyTimePreset(preset)"
              />
              <q-btn
                v-if="hasTimeFilter"
                dense
                outline
                size="sm"
                color="negative"
                label="Limpiar"
                @click="clearTimeFilter"
              />
            </div>
          </div>
        </div>

        <!-- Resultado -->
        <div v-if="imageUrl" class="relative">
          <div class="row items-center q-mb-sm">
            <div class="text-caption text-grey-6">
              {{ eventCount }} eventos • {{ sessionCount }} sesiones
            </div>
            <q-space />
            <div class="text-caption text-grey-6">
              <q-chip size="sm" color="primary" text-color="white">
                {{ getEventTypeLabel(filters.eventType) }}
              </q-chip>
              <q-chip size="sm" color="info" text-color="white" v-if="filters.deviceType">
                {{ getDeviceLabel(filters.deviceType) }}
              </q-chip>
              <q-chip size="sm" color="warning" text-color="white" v-if="props.sessionId">
                Sesión específica
              </q-chip>
              <q-chip size="sm" color="orange" text-color="white" v-if="hasTimeFilter">
                ⏱ {{ formatTimeDisplay }}
              </q-chip>
            </div>
          </div>

          <div class="relative">
            <img
              :src="imageUrl"
              alt="Mapa de calor"
              class="w-full rounded border border-grey-3"
              style="max-height: 60vh; object-fit: contain;"
              @load="onImageLoaded"
              @error="onImageError"
            />
            
            <div class="absolute top-2 right-2 row q-gutter-sm">
              <q-btn
                dense
                flat
                color="white"
                icon="download"
                size="sm"
                class="bg-black/50"
                @click="downloadImage"
              >
                <q-tooltip>Descargar imagen</q-tooltip>
              </q-btn>
              <q-btn
                dense
                flat
                color="white"
                icon="zoom_in"
                size="sm"
                class="bg-black/50"
                @click="zoomImage"
              >
                <q-tooltip>Ampliar</q-tooltip>
              </q-btn>
              <q-btn
                dense
                flat
                color="white"
                icon="refresh"
                size="sm"
                class="bg-black/50"
                @click="generateHeatmap"
              >
                <q-tooltip>Regenerar</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- Leyenda de colores -->
          <div class="row items-center q-mt-sm q-gutter-sm">
            <div class="text-caption text-grey-6">Intensidad:</div>
            <div class="row q-gutter-xs items-center">
              <span class="inline-block" style="width:20px;height:12px;background:#0000ff;border-radius:2px;"></span>
              <span class="text-caption text-grey-6">Baja</span>
              <span class="inline-block" style="width:20px;height:12px;background:#00ff00;border-radius:2px;"></span>
              <span class="text-caption text-grey-6">Media</span>
              <span class="inline-block" style="width:20px;height:12px;background:#ffff00;border-radius:2px;"></span>
              <span class="text-caption text-grey-6">Alta</span>
              <span class="inline-block" style="width:20px;height:12px;background:#ff0000;border-radius:2px;"></span>
              <span class="text-caption text-grey-6">Máxima</span>
            </div>
          </div>
        </div>

        <div v-else-if="loading" class="flex flex-center q-py-xl">
          <q-spinner color="primary" size="48px" />
          <span class="q-ml-sm">Generando mapa de calor...</span>
        </div>

        <div v-else class="text-center q-py-xl text-grey-6">
          <q-icon name="heat_pump" size="48px" />
          <div class="text-h6 q-mt-sm">Sin datos</div>
          <div class="text-caption">
            Realiza clics en el prototipo para generar datos de mapa de calor
          </div>
          <q-btn
            unelevated
            color="primary"
            label="Intentar generar"
            class="q-mt-md"
            @click="generateHeatmap"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { heatmapApi } from '@/api/heatmap.api'

const $q = useQuasar()

interface Filters {
  eventType: 'click' | 'move' | 'scroll'
  deviceType: 'desktop' | 'mobile' | 'tablet' | null
  timeFrom: string
  timeTo: string
  timeFromMs?: number
  timeToMs?: number
}

interface TimePreset {
  label: string
  from: string  // Formato: "00:00" siempre con dos dígitos
  to: string    // Formato: "00:00" siempre con dos dígitos
}

const props = defineProps<{
  show: boolean
  projectId: string
  nodeId?: string
  sessionId?: string
  totalDurationSec?: number
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'close'): void
}>()

const localShow = ref(props.show)
const loading = ref(false)
const imageUrl = ref<string | null>(null)
const eventCount = ref(0)
const sessionCount = ref(0)
const showTimeHelp = ref(true)

const filters = ref<Filters>({
  eventType: 'click',
  deviceType: null,
  timeFrom: '',
  timeTo: '',
  timeFromMs: undefined,
  timeToMs: undefined,
})

const eventTypeOptions = [
  { label: 'Clics', value: 'click' },
  { label: 'Movimientos', value: 'move' },
  { label: 'Scroll', value: 'scroll' },
]

const deviceOptions = [
  { label: 'Todos los dispositivos', value: null },
  { label: 'Desktop', value: 'desktop' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Tablet', value: 'tablet' },
]

// ============================================================
// PRESETS DINÁMICOS BASADOS EN totalDurationSec
// ============================================================

const dynamicTimePresets = computed<TimePreset[]>(() => {
  const duration = props.totalDurationSec || 0
  
  // Si no hay duración, usar presets por defecto
  if (duration <= 0) {
    return [
      { label: 'Primeros 30s', from: '00:00', to: '00:30' },
      { label: 'Primer minuto', from: '00:00', to: '01:00' },
      { label: 'Todo', from: '00:00', to: '05:00' },
    ]
  }
  
  const presets: TimePreset[] = []
  const totalFormatted = formatTimeDisplayMs(duration * 1000)
  
  // 1. SIEMPRE incluir "Todo"
  presets.push({
    label: '📊 Todo',
    from: '00:00',
    to: totalFormatted
  })
  
  // 2. Dividir la sesión en segmentos según la duración
  if (duration <= 60) {
    // Menos de 1 minuto: segmentos de 10 segundos
    const segmentSize = Math.max(10, Math.floor(duration / 4))
    const segments = Math.ceil(duration / segmentSize)
    for (let i = 0; i < segments; i++) {
      const start = i * segmentSize
      const end = Math.min((i + 1) * segmentSize, duration)
      if (start < duration) {
        presets.push({
          label: `${start}s - ${end}s`,
          from: formatTimeDisplayMs(start * 1000),
          to: formatTimeDisplayMs(end * 1000)
        })
      }
    }
  } else if (duration <= 180) {
    // Entre 1 y 3 minutos: segmentos de 30 segundos
    const segments = Math.ceil(duration / 30)
    for (let i = 0; i < segments; i++) {
      const start = i * 30
      const end = Math.min((i + 1) * 30, duration)
      if (start < duration) {
        presets.push({
          label: `${formatTimeDisplayMs(start * 1000)} - ${formatTimeDisplayMs(end * 1000)}`,
          from: formatTimeDisplayMs(start * 1000),
          to: formatTimeDisplayMs(end * 1000)
        })
      }
    }
  } else if (duration <= 600) {
    // Entre 3 y 10 minutos: segmentos de 1 minuto
    const segments = Math.ceil(duration / 60)
    for (let i = 0; i < segments; i++) {
      const start = i * 60
      const end = Math.min((i + 1) * 60, duration)
      if (start < duration) {
        presets.push({
          label: `Min ${i + 1}`,
          from: formatTimeDisplayMs(start * 1000),
          to: formatTimeDisplayMs(end * 1000)
        })
      }
    }
  } else {
    // Más de 10 minutos: segmentos de 5 minutos
    const segments = Math.ceil(duration / 300)
    for (let i = 0; i < segments; i++) {
      const start = i * 300
      const end = Math.min((i + 1) * 300, duration)
      if (start < duration) {
        presets.push({
          label: `${formatTimeDisplayMs(start * 1000)} - ${formatTimeDisplayMs(end * 1000)}`,
          from: formatTimeDisplayMs(start * 1000),
          to: formatTimeDisplayMs(end * 1000)
        })
      }
    }
  }
  
  // 3. Agregar "Primeros 30s" si la duración es mayor a 30 segundos
  if (duration > 30) {
    presets.push({
      label: '⏩ Primeros 30s',
      from: '00:00',
      to: '00:30'
    })
  }
  
  // 4. Agregar "Últimos 30s" si la duración es mayor a 30 segundos
  if (duration > 30) {
    presets.push({
      label: '⏪ Últimos 30s',
      from: formatTimeDisplayMs((duration - 30) * 1000),
      to: totalFormatted
    })
  }
  
  // 5. Agregar "Mitad" si la duración es mayor a 1 minuto
  if (duration > 60) {
    const half = Math.floor(duration / 2)
    presets.push({
      label: '📍 Mitad',
      from: formatTimeDisplayMs((half - 15) * 1000),
      to: formatTimeDisplayMs((half + 15) * 1000)
    })
  }
  
  // Limitar a máximo 12 presets para no saturar
  return presets.slice(0, 12)
})

// ============================================================
// COMPUTED
// ============================================================

const hasTimeFilter = computed(() => {
  return filters.value.timeFromMs !== undefined || filters.value.timeToMs !== undefined
})

const formatTimeDisplay = computed(() => {
  const from = filters.value.timeFromMs !== undefined 
    ? formatTimeDisplayMs(filters.value.timeFromMs)
    : '00:00'
  const to = filters.value.timeToMs !== undefined
    ? formatTimeDisplayMs(filters.value.timeToMs)
    : '∞'
  return `${from} - ${to}`
})

// ============================================================
// FUNCIONES DE TIEMPO
// ============================================================

function formatTimeDisplayMs(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function parseTime(timeStr: string): number | null {
  if (!timeStr) return null
  
  timeStr = timeStr.trim()
  
  // Formato mm:ss (con o sin cero a la izquierda)
  const parts = timeStr.split(':')
  if (parts.length === 2) {
    const mins = parseInt(parts[0])
    const secs = parseInt(parts[1])
    if (!isNaN(mins) && !isNaN(secs) && mins >= 0 && secs >= 0 && secs < 60) {
      return (mins * 60 + secs) * 1000
    }
  }
  
  // Solo segundos
  const secs = parseInt(timeStr)
  if (!isNaN(secs) && secs >= 0) {
    return secs * 1000
  }
  
  return null
}

function validateTime(timeStr: string): boolean {
  if (!timeStr) return true
  return parseTime(timeStr) !== null
}

function isPresetActive(preset: TimePreset): boolean {
  return filters.value.timeFrom === preset.from && filters.value.timeTo === preset.to
}

function applyTimePreset(preset: TimePreset) {
  filters.value.timeFrom = preset.from
  filters.value.timeTo = preset.to
  filters.value.timeFromMs = parseTime(preset.from) || undefined
  filters.value.timeToMs = parseTime(preset.to) || undefined
  showTimeHelp.value = false
}

function onTimeInputChange() {
  if (filters.value.timeFrom) {
    const ms = parseTime(filters.value.timeFrom)
    filters.value.timeFromMs = ms || undefined
    if (ms === null && filters.value.timeFrom) {
      $q.notify({
        type: 'warning',
        message: 'Formato inválido. Usa mm:ss (ej: 01:30)'
      })
    }
  } else {
    filters.value.timeFromMs = undefined
  }
  
  if (filters.value.timeTo) {
    const ms = parseTime(filters.value.timeTo)
    filters.value.timeToMs = ms || undefined
    if (ms === null && filters.value.timeTo) {
      $q.notify({
        type: 'warning',
        message: 'Formato inválido. Usa mm:ss (ej: 02:45)'
      })
    }
  } else {
    filters.value.timeToMs = undefined
  }
}

function clearTimeFilter() {
  filters.value.timeFrom = ''
  filters.value.timeTo = ''
  filters.value.timeFromMs = undefined
  filters.value.timeToMs = undefined
  showTimeHelp.value = true
}

// ============================================================
// FUNCIONES DE LABEL
// ============================================================

function getEventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    click: 'Clics',
    move: 'Movimientos',
    scroll: 'Scroll'
  }
  return map[type] || type
}

function getDeviceLabel(device: string): string {
  const map: Record<string, string> = {
    desktop: 'Desktop',
    mobile: 'Mobile',
    tablet: 'Tablet'
  }
  return map[device] || device
}

// ============================================================
// WATCHERS
// ============================================================

watch(() => props.show, (val) => {
  localShow.value = val
  if (val) {
    generateHeatmap()
  }
})

watch(localShow, (val) => {
  emit('update:show', val)
  if (!val) {
    if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl.value)
    }
    emit('close')
  }
})

// ============================================================
// FUNCIONES DE CONVERSIÓN
// ============================================================

function bufferToImageUrl(bufferData: any): string | null {
  if (!bufferData) return null
  
  if (bufferData.type === 'Buffer' && Array.isArray(bufferData.data)) {
    const uint8Array = new Uint8Array(bufferData.data)
    const blob = new Blob([uint8Array], { type: 'image/png' })
    return URL.createObjectURL(blob)
  }
  
  if (Array.isArray(bufferData)) {
    const uint8Array = new Uint8Array(bufferData)
    const blob = new Blob([uint8Array], { type: 'image/png' })
    return URL.createObjectURL(blob)
  }
  
  if (typeof bufferData === 'string') {
    return `data:image/png;base64,${bufferData}`
  }
  
  return null
}

// ============================================================
// GENERAR Y CARGAR IMAGEN
// ============================================================

async function generateHeatmap() {
  if (!props.projectId) {
    $q.notify({
      type: 'warning',
      message: 'No hay proyecto seleccionado',
    })
    return
  }

  // Validar rango de tiempo
  if (filters.value.timeFromMs !== undefined && filters.value.timeToMs !== undefined) {
    if (filters.value.timeFromMs >= filters.value.timeToMs) {
      $q.notify({
        type: 'negative',
        message: 'El tiempo "Desde" debe ser menor que "Hasta"'
      })
      return
    }
  }

  loading.value = true
  imageUrl.value = null

  try {
    const deviceType = filters.value.deviceType === null 
      ? undefined 
      : filters.value.deviceType

    const params: any = {
      projectId: props.projectId,
      nodeId: props.nodeId || '',
      eventType: filters.value.eventType,
      deviceType: deviceType,
      ...(props.sessionId && { sessionId: props.sessionId }),
    }

    if (filters.value.timeFromMs !== undefined) {
      params.timeRangeStartMs = filters.value.timeFromMs
    }
    if (filters.value.timeToMs !== undefined) {
      params.timeRangeEndMs = filters.value.timeToMs
    }

    console.log('🔍 Generando heatmap con params:', params)

    const response = await heatmapApi.getHeatmapImage(params)
    const result = response.data

    if (result.imageData) {
      imageUrl.value = bufferToImageUrl(result.imageData)
    } else if (result.imageUrl) {
      imageUrl.value = result.imageUrl
    }

    const summary = await heatmapApi.getSummary(props.projectId)
    eventCount.value = summary.data.totalEvents
    sessionCount.value = summary.data.uniqueSessions

    if (!imageUrl.value) {
      $q.notify({
        type: 'info',
        message: 'No se encontraron datos para el rango de tiempo seleccionado',
      })
    }

  } catch (error) {
    console.error('Error generando mapa de calor:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al generar el mapa de calor',
    })
  } finally {
    loading.value = false
  }
}

// ============================================================
// FUNCIONES DE IMAGEN
// ============================================================

function onImageLoaded() {
  console.log('✅ Imagen del mapa de calor cargada')
}

function onImageError() {
  $q.notify({
    type: 'negative',
    message: 'Error al cargar la imagen del mapa de calor',
  })
}

function downloadImage() {
  if (!imageUrl.value) return
  
  const link = document.createElement('a')
  link.href = imageUrl.value
  link.download = `heatmap_${filters.value.eventType}_${new Date().toISOString()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  $q.notify({
    type: 'positive',
    message: 'Imagen descargada',
  })
}

function zoomImage() {
  if (imageUrl.value) {
    window.open(imageUrl.value, '_blank')
  }
}

function close() {
  localShow.value = false
  emit('close')
}
</script>

<style scoped>
.q-input :deep(.q-field__control) {
  min-height: 40px;
}

.q-input :deep(.q-field__label) {
  font-size: 12px;
}
</style>