<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle2 text-dark">Eventos</div>
        <q-badge color="primary" rounded class="q-ml-sm">{{ events.length }}</q-badge>
        <q-badge
          v-if="loadingNodes"
          color="warning"
          rounded
          class="q-ml-sm"
          label="Cargando nodos..."
        />
      </div>

      <div class="max-h-56 overflow-y-auto">
        <div
          v-for="ev in events"
          :key="ev.event_id"
          class="q-px-sm q-py-xs rounded cursor-pointer q-mb-xs"
          :class="isEventCurrent(ev) ? 'bg-accent' : 'bg-slate-800/30'"
          @click="$emit('seek', ev.elapsed_ms_total)"
        >
          <div class="flex items-center gap-2 text-caption">
            <span class="font-mono text-grey-7" style="min-width:50px; flex-shrink:0;">
              {{ formatTiempoS(ev.elapsed_ms_total) }}
            </span>
            <span class="text-dark truncate">{{ ev.event_type }}</span>

            <span class="text-grey-6 truncate" style="max-width:150px;">
              <template v-if="getNodeIdFromEvent(ev)">
                <span class="text-primary font-mono text-[9px]">{{ getNodeIdFromEvent(ev) }}</span>
                <span class="text-grey-5 q-mx-xs">→</span>
                <span class="text-dark">{{ getNodeName(getNodeIdFromEvent(ev)) }}</span>
                <span v-if="getNodeType(getNodeIdFromEvent(ev)) !== '—'" class="text-grey-5 text-[9px] q-ml-xs">
                  ({{ getNodeType(getNodeIdFromEvent(ev)) }})
                </span>
              </template>
              <template v-else>
                {{ ev.screen_name || '—' }}
              </template>
            </span>

            <button
              class="q-ml-auto text-grey-6 hover:text-grey-8"
              @click.stop="$emit('toggle-expand', ev.event_id)"
            >
              {{ expandidos[ev.event_id] ? 'ocultar' : 'detalle' }}
            </button>
          </div>
          <pre
            v-if="expandidos[ev.event_id]"
            class="text-caption bg-grey-2 rounded q-pa-sm q-mt-xs"
            style="font-size:9px;overflow-x:auto;"
          >{{ JSON.stringify(ev, null, 1) }}</pre>
        </div>
        <p v-if="!events.length" class="text-center text-caption text-grey-6 q-py-md">
          Sin eventos registrados.
        </p>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
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

function isEventCurrent(ev: any) {
  return Math.abs(ev.elapsed_ms_total - props.currentTime) < 500
}

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}
</script>