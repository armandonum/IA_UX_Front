<!-- components/experto/EventList.vue -->
<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle2 text-dark">
          <q-icon name="event" size="16px" class="q-mr-xs" />
          Eventos
        </div>
        <q-badge color="primary" rounded class="q-ml-sm">
          {{ events.length }}
        </q-badge>
        <q-badge
          v-if="loadingNodes"
          color="warning"
          rounded
          class="q-ml-sm"
          label="Cargando nodos..."
        />

        <q-space />

        <q-input
          v-model="searchQuery"
          dense
          outlined
          placeholder="Buscar..."
          style="max-width: 200px;"
        >
          <template v-slot:prepend>
            <q-icon name="search" size="sm" />
          </template>
        </q-input>
      </div>

      <div class="max-h-80 overflow-y-auto">
        <div
          v-for="ev in filteredEvents"
          :key="ev.event_id"
          class="q-px-sm q-py-xs rounded cursor-pointer q-mb-xs"
          :class="isEventCurrent(ev) ? 'bg-blue-1' : 'bg-grey-1'"
          @click="$emit('seek', Number(ev.elapsed_ms_total))"
        >
          <!-- Fila principal -->
          <div class="row items-center no-wrap q-gutter-sm">
            <!-- Tiempo -->
            <span
              class="font-mono text-caption text-grey-7"
              style="min-width: 50px; flex-shrink: 0;"
            >
              {{ formatTiempoS(Number(ev.elapsed_ms_total)) }}
            </span>

            <!-- Chip del tipo de evento traducido -->
            <q-chip
              :color="getEventChipColor(ev)"
              text-color="white"
              size="sm"
              dense
              :icon="getEventIcon(ev)"
            >
              {{ getEventTypeLabel(ev) }}
            </q-chip>

            <!-- Nodo destino (nombre + tipo) -->
            <div class="col ellipsis">
              <template v-if="getNodeInfoForEvent(ev)">
                <span class="text-caption text-primary font-mono q-mr-xs">
                  {{ getNodeInfoForEvent(ev)?.id }}
                </span>
                <span class="text-grey-5 q-mx-xs">→</span>
                <span class="text-caption text-dark">
                  {{ getNodeInfoForEvent(ev)?.name }}
                </span>
                <span
                  v-if="getNodeInfoForEvent(ev)?.type && getNodeInfoForEvent(ev)?.type !== '—'"
                  class="text-caption text-grey-5 q-ml-xs"
                >
                  ({{ getNodeInfoForEvent(ev)?.type }})
                </span>
              </template>
              <template v-else-if="ev.screen_name">
                <span class="text-caption text-grey-7">{{ ev.screen_name }}</span>
              </template>
              <template v-else>
                <span class="text-caption text-grey-5">—</span>
              </template>
            </div>

            <!-- Botón detalle -->
            <q-btn
              dense
              flat
              size="sm"
              :icon="expandidos[ev.event_id] ? 'expand_less' : 'expand_more'"
              @click.stop="$emit('toggle-expand', ev.event_id)"
            />
          </div>

          <!-- Detalle expandido -->
          <div
            v-if="expandidos[ev.event_id]"
            class="q-mt-sm q-pa-sm bg-white rounded border border-grey-3"
          >
            <!-- Info traducida -->
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-6">Tipo</div>
                <div class="text-caption text-dark">
                  {{ getEventTypeLabel(ev) }}
                  <span class="text-grey-5">({{ ev.event_type }})</span>
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-6">Hora exacta</div>
                <div class="text-caption text-dark">
                  {{ formatTiempoS(Number(ev.elapsed_ms_total)) }}
                  <span class="text-grey-5">({{ ev.elapsed_ms_total }}ms)</span>
                </div>
              </div>
              <div v-if="getNodeInfoForEvent(ev)" class="col-6">
                <div class="text-caption text-grey-6">Componente</div>
                <div class="text-caption text-dark">
                  {{ getNodeInfoForEvent(ev)?.name }}
                </div>
              </div>
              <div v-if="getNodeInfoForEvent(ev)" class="col-6">
                <div class="text-caption text-grey-6">Node ID</div>
                <div class="text-caption font-mono text-dark">
                  {{ getNodeInfoForEvent(ev)?.id }}
                </div>
              </div>
            </div>

            <!-- Payload traducido (no JSON crudo) -->
            <q-separator class="q-my-sm" />
            <div class="text-caption text-grey-6 q-mb-xs">
              <q-icon name="info" size="12px" />
              Detalles del evento
            </div>
            <div class="row q-col-gutter-xs">
              <div
                v-for="(val, key) in getReadablePayload(ev)"
                :key="key"
                class="col-12"
              >
                <div class="text-caption">
                  <span class="text-grey-6">{{ key }}:</span>
                  <span class="text-dark q-ml-xs">{{ val }}</span>
                </div>
              </div>
            </div>

            <!-- Info técnica colapsable -->
            <q-expansion-item
              dense
              switch-toggle-side
              label="Ver datos técnicos"
              class="q-mt-sm"
              header-class="text-caption text-grey-6"
            >
              <pre
                class="text-caption bg-grey-2 rounded q-pa-sm"
                style="font-size: 10px; overflow-x: auto; max-height: 200px;"
              >{{ JSON.stringify(ev, null, 2) }}</pre>
            </q-expansion-item>
          </div>
        </div>

        <p
          v-if="!filteredEvents.length"
          class="text-center text-caption text-grey-6 q-py-md"
        >
          {{ searchQuery ? 'Sin resultados' : 'Sin eventos registrados.' }}
        </p>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  events: any[]
  currentTime: number
  loadingNodes: boolean
  expandidos: Record<string, boolean>
  getNodeIdFromEvent: (ev: any) => string
  getNodeName: (id: string) => string
  getNodeType: (id: string) => string
}>()

defineEmits<{
  (e: 'seek', ms: number): void
  (e: 'toggle-expand', id: string): void
}>()

const searchQuery = ref('')

const filteredEvents = computed(() => {
  if (!searchQuery.value.trim()) return props.events
  const q = searchQuery.value.toLowerCase()
  return props.events.filter((ev) => {
    const info = getNodeInfoForEvent(ev)
    const tipo = getEventTypeLabel(ev).toLowerCase()
    const screen = (ev.screen_name || '').toLowerCase()
    const nodeName = (info?.name || '').toLowerCase()
    const nodeId = (info?.id || '').toLowerCase()

    return (
      tipo.includes(q) ||
      screen.includes(q) ||
      nodeName.includes(q) ||
      nodeId.includes(q)
    )
  })
})

// ============================================================
// OBTENER INFO DEL NODO USANDO getNodeIdFromEvent
// ============================================================
function getNodeInfoForEvent(ev: any): { id: string; name: string; type: string } | null {
  const nodeId = props.getNodeIdFromEvent(ev)
  if (!nodeId) return null

  return {
    id: nodeId,
    name: props.getNodeName(nodeId) || nodeId,
    type: props.getNodeType(nodeId) || '—',
  }
}

// ============================================================
// TIPO DE EVENTO TRADUCIDO
// ============================================================
const EVENT_TYPE_LABELS: Record<string, string> = {
  INITIAL_LOAD: 'Carga inicial',
  PRESENTED_NODE_CHANGED: 'Cambio de pantalla',
  NEW_STATE: 'Nuevo estado',
  MOUSE_PRESS_OR_RELEASE: 'Click del mouse',
  MOUSE_PRESS: 'Presionar mouse',
  MOUSE_RELEASE: 'Soltar mouse',
  CLICK: 'Click',
  SCROLL: 'Desplazamiento',
  NAVIGATION: 'Navegación',
  WINDOW_RESIZE: 'Redimensionar ventana',
  KEY_PRESS: 'Tecla presionada',
  KEY_RELEASE: 'Tecla liberada',
  INPUT_CHANGE: 'Cambio en campo',
  FOCUS: 'Foco en elemento',
  BLUR: 'Pérdida de foco',
  HOVER: 'Hover',
  DRAG_START: 'Inicio de arrastre',
  DRAG_END: 'Fin de arrastre',
  DROP: 'Soltar elemento',
  ZOOM: 'Zoom',
  FORM_SUBMIT: 'Envío de formulario',
}

function getEventTypeLabel(ev: any): string {
  const raw = ev.event_type || ev.event_type_normalizado || 'unknown'
  // Priorizar event_type (más específico) sobre event_type_normalizado
  if (ev.event_type && EVENT_TYPE_LABELS[ev.event_type]) {
    return EVENT_TYPE_LABELS[ev.event_type]
  }
  return EVENT_TYPE_LABELS[raw] || raw.replace(/_/g, ' ').toLowerCase()
}

// ============================================================
// COLOR Y ICONO SEGÚN TIPO DE EVENTO
// ============================================================
function getEventChipColor(ev: any): string {
  const type = (ev.event_type || ev.event_type_normalizado || '').toUpperCase()

  if (type.includes('CLICK') || type.includes('PRESS') || type.includes('RELEASE'))
    return 'primary'
  if (type.includes('NEW_STATE') || type.includes('CHANGED') || type.includes('NAVIGATION'))
    return 'info'
  if (type.includes('SCROLL')) return 'purple'
  if (type.includes('INITIAL') || type.includes('LOAD')) return 'teal'
  if (type.includes('KEY') || type.includes('INPUT')) return 'orange'
  if (type.includes('HOVER') || type.includes('FOCUS') || type.includes('BLUR'))
    return 'blue-grey'
  return 'grey-7'
}

function getEventIcon(ev: any): string {
  const type = (ev.event_type || ev.event_type_normalizado || '').toUpperCase()

  if (type.includes('CLICK') || type.includes('PRESS')) return 'touch_app'
  if (type.includes('NEW_STATE') || type.includes('CHANGED')) return 'swap_horiz'
  if (type.includes('NAVIGATION')) return 'navigation'
  if (type.includes('SCROLL')) return 'swipe_vertical'
  if (type.includes('INITIAL') || type.includes('LOAD')) return 'play_arrow'
  if (type.includes('KEY')) return 'keyboard'
  if (type.includes('INPUT')) return 'edit'
  if (type.includes('HOVER')) return 'mouse'
  if (type.includes('FOCUS') || type.includes('BLUR')) return 'visibility'
  return 'circle'
}

// ============================================================
// PAYLOAD LEGIBLE (traducido, no JSON crudo)
// ============================================================
const PAYLOAD_LABELS: Record<string, string> = {
  nodeId: 'Nodo',
  targetNodeId: 'Nodo destino',
  presentedNodeId: 'Nodo presentado',
  sourceNodeId: 'Nodo origen',
  currentNodeId: 'Nodo actual',
  newVariantId: 'Variante nueva',
  currentVariantId: 'Variante actual',
  isTimedChange: 'Cambio temporizado',
  isStoredInHistory: 'Guardado en historial',
  interactionType: 'Tipo de interacción',
  x: 'Posición X',
  y: 'Posición Y',
  key: 'Tecla',
  target: 'Elemento',
  url: 'URL',
  scrollX: 'Scroll X',
  scrollY: 'Scroll Y',
}

function getReadablePayload(ev: any): Record<string, string> {
  const result: Record<string, string> = {}
  const payload = ev.raw_payload

  if (!payload || typeof payload !== 'object') return result

  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) continue

    const label = PAYLOAD_LABELS[key] || key

    // Traducir booleanos
    if (typeof value === 'boolean') {
      result[label] = value ? 'Sí' : 'No'
      continue
    }

    // Traducir objetos (excluir null)
    if (typeof value === 'object') {
      result[label] = JSON.stringify(value)
      continue
    }

    // Valores primitivos
    result[label] = String(value)
  }

  return result
}

// ============================================================
// UTILIDADES
// ============================================================
function isEventCurrent(ev: any) {
  const evMs = Number(ev.elapsed_ms_total)
  return Math.abs(evMs - props.currentTime) < 500
}

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}
</script>

<style scoped>
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.max-h-80 {
  max-height: 320px;
}
</style>