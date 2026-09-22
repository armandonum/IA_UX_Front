<!-- components/coordinador/heuristic/detail/HeuristicEventDetail.vue -->
<template>
  <div>
    <!-- Toggle: Legible / JSON -->
    <div class="row items-center q-mb-sm">
      <q-btn-toggle
        v-model="viewMode"
        dense
        unelevated
        toggle-color="primary"
        :options="[
          { label: 'Legible', value: 'human', icon: 'visibility' },
          { label: 'JSON', value: 'json', icon: 'code' },
        ]"
        size="sm"
      />
      <q-space />
      <q-btn
        dense
        flat
        size="sm"
        icon="content_copy"
        color="grey-7"
        @click="copyToClipboard"
      >
        <q-tooltip>Copiar JSON</q-tooltip>
      </q-btn>
    </div>

    <!-- MODO LEGIBLE -->
    <div v-if="viewMode === 'human'" class="q-gutter-y-xs">
      <!-- Tipo de evento -->
      <div class="detail-row">
        <div class="detail-label">Tipo</div>
        <div class="detail-value">
          <q-chip dense size="sm" color="primary" text-color="white">
            {{ getEventTypeLabel(event.event_type) }}
          </q-chip>
          <span class="text-caption text-grey-6 q-ml-sm font-mono">
            {{ event.event_type }}
          </span>
        </div>
      </div>

      <!-- Momento -->
      <div class="detail-row">
        <div class="detail-label">Momento</div>
        <div class="detail-value">
          <q-icon name="schedule" size="14px" class="q-mr-xs" />
          {{ formatTimeMs(event.elapsed_ms_total) }}
          <span class="text-caption text-grey-6 q-ml-sm">
            ({{ event.elapsed_ms_total }} ms)
          </span>
        </div>
      </div>

      <!-- Timestamp real -->
      <div class="detail-row">
        <div class="detail-label">Hora real</div>
        <div class="detail-value">
          {{ formatDate(event.timestamp_real) }}
        </div>
      </div>

      <!-- Nodo -->
      <div v-if="nodeId" class="detail-row">
        <div class="detail-label">Nodo</div>
        <div class="detail-value">
          <q-icon name="layers" size="14px" class="q-mr-xs" />
          <span class="font-mono text-primary">{{ nodeId }}</span>
          <q-icon name="arrow_forward" size="12px" class="q-mx-xs text-grey-6" />
          <span>{{ nodeName }}</span>
          <span v-if="nodeType && nodeType !== '—'" class="text-caption text-grey-6 q-ml-xs">
            ({{ nodeType }})
          </span>
        </div>
      </div>

      <!-- Pantalla -->
      <div v-if="event.screen_name" class="detail-row">
        <div class="detail-label">Pantalla</div>
        <div class="detail-value">{{ event.screen_name }}</div>
      </div>

      <!-- Tipo normalizado -->
      <div v-if="event.event_type_normalizado" class="detail-row">
        <div class="detail-label">Categoría</div>
        <div class="detail-value">
          <q-badge color="info" outline>
            {{ event.event_type_normalizado }}
          </q-badge>
        </div>
      </div>

      <!-- Payload crudo -->
      <div v-if="event.raw_payload" class="detail-row">
        <div class="detail-label">Payload</div>
        <div class="detail-value">
          <q-expansion-item
            dense
            switch-toggle-side
            icon="data_object"
            label="Ver payload del evento"
            class="bg-grey-2 rounded-borders"
          >
            <div class="q-pa-sm">
              <pre class="payload-pre">{{ JSON.stringify(event.raw_payload, null, 2) }}</pre>
            </div>
          </q-expansion-item>
        </div>
      </div>
    </div>

    <!-- MODO JSON CRUDO -->
    <div v-else class="bg-grey-2 rounded-borders q-pa-sm">
      <pre class="payload-pre">{{ JSON.stringify(event, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { getEventTypeLabel } from '@/data/heuristicFindingsDictionary'

const props = defineProps<{
  event: any
  getNodeName: (id: string) => string
  getNodeType: (id: string) => string
  getNodeIdFromEvent: (ev: any) => string
}>()

const $q = useQuasar()
const viewMode = ref<'human' | 'json'>('human')

const nodeId = computed(() => props.getNodeIdFromEvent(props.event))
const nodeName = computed(() =>
  nodeId.value ? props.getNodeName(nodeId.value) : '',
)
const nodeType = computed(() =>
  nodeId.value ? props.getNodeType(nodeId.value) : '—',
)

function formatTimeMs(ms: number): string {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })
}

function copyToClipboard() {
  const text = JSON.stringify(props.event, null, 2)
  navigator.clipboard.writeText(text)
  $q.notify({ type: 'positive', message: 'JSON copiado al portapapeles' })
}
</script>

<style scoped>
.detail-row {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  flex: 0 0 110px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.detail-value {
  flex: 1;
  font-size: 13px;
  color: #1e293b;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.payload-pre {
  font-size: 11px;
  font-family: 'Courier New', monospace;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: #334155;
  max-height: 300px;
  overflow-y: auto;
}
</style>