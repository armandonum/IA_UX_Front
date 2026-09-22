<!-- components/coordinador/heuristic/detail/HeuristicEventList.vue -->
<template>
  <div>
    <!-- Header -->
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle2 text-dark">
        Eventos de navegación
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

      <!-- Filtro por tipo -->
      <q-select
        v-model="filterType"
        :options="eventTypeOptions"
        option-label="label"
        option-value="value"
        label="Filtrar por tipo"
        dense
        outlined
        clearable
        emit-value
        map-options
        style="min-width: 220px"
      />

      <q-input
        v-model="searchQuery"
        placeholder="Buscar..."
        dense
        outlined
        clearable
        style="min-width: 200px"
        class="q-ml-sm"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Sin eventos -->
    <div v-if="!filteredEvents.length" class="text-center q-py-lg text-grey-6">
      <q-icon name="event_busy" size="48px" />
      <div class="q-mt-sm">
        {{ events.length === 0 ? 'Sin eventos registrados' : 'No hay eventos que coincidan con los filtros' }}
      </div>
    </div>

   <!-- Lista de eventos -->
<div v-else class="events-list">
  <div
    v-for="ev in paginatedEvents"
    :key="ev.event_id"
    class="event-wrapper"
  >
    <!-- Evento (fila clickeable) -->
    <q-item
      clickable
      @click="toggleExpand(ev.event_id)"
      :class="{ 'bg-blue-1': isCurrent(ev) }"
    >
      <!-- Tiempo -->
      <q-item-section side style="min-width: 60px">
        <div class="text-caption font-mono text-primary">
          {{ formatTimeMs(ev.elapsed_ms_total) }}
        </div>
      </q-item-section>

      <!-- Icono del tipo -->
      <q-item-section avatar>
        <q-avatar
          :color="getEventColor(ev.event_type)"
          text-color="white"
          size="32px"
        >
          <q-icon :name="getEventIcon(ev.event_type)" size="18px" />
        </q-avatar>
      </q-item-section>

      <!-- Contenido -->
      <q-item-section>
        <q-item-label class="text-weight-medium">
          {{ getEventTypeLabel(ev.event_type) }}
        </q-item-label>
        <q-item-label caption>
          <template v-if="getNodeIdFromEvent(ev)">
            <span class="text-primary font-mono text-weight-medium">
              {{ getNodeIdFromEvent(ev) }}
            </span>
            <span class="text-grey-6 q-mx-xs">→</span>
            <span>{{ getNodeName(getNodeIdFromEvent(ev)) }}</span>
            <span
              v-if="getNodeType(getNodeIdFromEvent(ev)) !== '—'"
              class="text-grey-5 q-ml-xs"
            >
              ({{ getNodeType(getNodeIdFromEvent(ev)) }})
            </span>
          </template>
          <template v-else-if="ev.screen_name">
            {{ ev.screen_name }}
          </template>
        </q-item-label>
      </q-item-section>

      <!-- Botón expandir -->
      <q-item-section side>
        <q-btn
          flat
          dense
          round
          size="sm"
          :icon="expandidos[ev.event_id] ? 'expand_less' : 'expand_more'"
          @click.stop="toggleExpand(ev.event_id)"
        />
      </q-item-section>
    </q-item>

    <!-- 🔥 DETALLE: justo debajo de SU evento -->
    <div
      v-if="expandidos[ev.event_id]"
      class="event-detail-container"
    >
      <HeuristicEventDetail
        :event="ev"
        :get-node-name="getNodeName"
        :get-node-type="getNodeType"
        :get-node-id-from-event="getNodeIdFromEvent"
      />
      <div class="row justify-end q-mt-sm">
        <q-btn
          flat
          dense
          size="sm"
          color="primary"
          icon="play_arrow"
          label="Saltar a este momento"
          @click="$emit('seek', ev.elapsed_ms_total)"
        />
      </div>
    </div>
  </div>
</div>

    <!-- Paginación simple -->
    <div v-if="filteredEvents.length > pageSize" class="row justify-center q-mt-md">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="5"
        boundary-numbers
        direction-links
        size="sm"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import HeuristicEventDetail from './HeuristicEventDetail.vue'
import { getEventTypeLabel } from '@/data/heuristicFindingsDictionary'

const props = defineProps<{
  events: any[]
  currentTime: number
  loadingNodes: boolean
  expandidos: Record<string, boolean>
  getNodeIdFromEvent: (ev: any) => string
  getNodeName: (id: string) => string
  getNodeType: (id: string) => string
}>()

const emit = defineEmits<{
  (e: 'seek', ms: number): void
  (e: 'toggle-expand', id: string): void
}>()

// ============================================================
// ESTADO
// ============================================================
const filterType = ref<string | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 20

// ============================================================
// COMPUTED
// ============================================================
const eventTypeOptions = computed(() => {
  const types = new Set(props.events.map(e => e.event_type))
  return Array.from(types).map(t => ({
    label: getEventTypeLabel(t),
    value: t,
  }))
})

const filteredEvents = computed(() => {
  let result = props.events

  if (filterType.value) {
    result = result.filter(e => e.event_type === filterType.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(e => {
      const nodeId = props.getNodeIdFromEvent(e) || ''
      const nodeName = nodeId ? props.getNodeName(nodeId) : ''
      const screenName = e.screen_name || ''
      const eventType = e.event_type || ''
      return (
        nodeId.toLowerCase().includes(query) ||
        nodeName.toLowerCase().includes(query) ||
        screenName.toLowerCase().includes(query) ||
        eventType.toLowerCase().includes(query)
      )
    })
  }

  return result
})

const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredEvents.value.slice(start, start + pageSize)
})

const totalPages = computed(() =>
  Math.ceil(filteredEvents.value.length / pageSize),
)

// ============================================================
// HELPERS
// ============================================================
function isCurrent(ev: any): boolean {
  return Math.abs(ev.elapsed_ms_total - props.currentTime) < 500
}

function toggleExpand(id: string) {
  emit('toggle-expand', id)
}

function formatTimeMs(ms: number): string {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    INITIAL_LOAD: 'rocket_launch',
    PRESENTED_NODE_CHANGED: 'swap_horiz',
    NEW_STATE: 'autorenew',
    MOUSE_PRESS_OR_RELEASE: 'touch_app',
    CLICK: 'ads_click',
    SCROLL: 'swipe_vertical',
    NAVIGATION: 'navigation',
    KEYDOWN: 'keyboard',
    KEYUP: 'keyboard',
    MOUSE_MOVE: 'mouse',
    MOUSE_ENTER: 'login',
    MOUSE_LEAVE: 'logout',
    FOCUS: 'center_focus_strong',
    BLUR: 'blur_on',
    CHANGE: 'edit',
    SUBMIT: 'send',
  }
  return icons[eventType] || 'event'
}

function getEventColor(eventType: string): string {
  const colors: Record<string, string> = {
    INITIAL_LOAD: 'info',
    PRESENTED_NODE_CHANGED: 'primary',
    NEW_STATE: 'deep-purple',
    MOUSE_PRESS_OR_RELEASE: 'positive',
    CLICK: 'positive',
    SCROLL: 'orange',
    NAVIGATION: 'primary',
    KEYDOWN: 'cyan',
    KEYUP: 'cyan',
    MOUSE_MOVE: 'grey',
    FOCUS: 'teal',
    BLUR: 'grey-7',
    CHANGE: 'amber',
    SUBMIT: 'green',
    ERROR: 'negative',
  }
  return colors[eventType] || 'grey'
}
</script>

<style scoped>
.events-list {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.event-detail-container {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 12px 16px;
}

.bg-blue-1 {
  background-color: #e3f2fd !important;
}
</style>