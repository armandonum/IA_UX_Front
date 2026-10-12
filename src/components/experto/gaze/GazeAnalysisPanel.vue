<!-- components/experto/gaze/GazeAnalysisPanel.vue -->
<template>
  <q-dialog v-model="localShow" full-width persistent>
    <q-card style="min-height: 85vh;">
      <!-- Header -->
      <q-card-section class="bg-primary text-white">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h6">
              <q-icon name="visibility" size="sm" class="q-mr-sm" />
              Análisis de Eye Tracking
            </div>
            <div class="text-caption">
              Visualización de patrones de mirada del usuario
            </div>
          </div>
          <q-btn flat dense round icon="close" color="white" @click="close" />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="text-grey-7"
        narrow-indicator
        no-caps
      >
        <q-tab name="heatmap" icon="blur_on" label="Mapa de Calor" />
        <q-tab name="video" icon="play_circle" label="Video con Mirada" />
        <q-tab name="metrics" icon="analytics" label="Métricas AOI" />
      </q-tabs>

      <q-separator />

      <!-- Panels -->
      <q-tab-panels v-model="activeTab" animated class="bg-white">
        <!-- Heatmap estático -->
        <q-tab-panel name="heatmap" class="q-pa-md">
          <GazeHeatmapViewer
            :session-id="sessionId"
            :project-id="projectId"
            :thumbnail-url="thumbnailUrl"
            :node-cache="nodeCache"
          />
        </q-tab-panel>

        <!-- Video con overlay -->
        <q-tab-panel name="video" class="q-pa-md">
          <GazeVideoOverlay
            :session-id="sessionId"
            :video-url="videoUrl"
            :node-cache="nodeCache"
          />
        </q-tab-panel>

        <!-- Métricas AOI -->
        <q-tab-panel name="metrics" class="q-pa-md">
          <AoiMetricsViewer :session-id="sessionId" />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import GazeHeatmapViewer from './GazeHeatmapViewer.vue'
import GazeVideoOverlay from './GazeVideoOverlay.vue'
import AoiMetricsViewer from './AoiMetricsViewer.vue'

const props = defineProps<{
  show: boolean
  sessionId: string
  projectId: string
  thumbnailUrl: string | null
  videoUrl: string | null
  nodeCache?: Map<string, { name: string; type: string }>
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'close'): void
}>()

const localShow = ref(props.show)
const activeTab = ref('heatmap')

watch(() => props.show, (val) => {
  localShow.value = val
})

watch(localShow, (val) => {
  emit('update:show', val)
  if (!val) emit('close')
})

function close() {
  localShow.value = false
}
</script>