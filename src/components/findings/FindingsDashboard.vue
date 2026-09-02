<!-- components/findings/FindingsDashboard.vue - ACTUALIZADO -->
<template>
  <div class="findings-dashboard q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">🔍 Dashboard de Hallazgos</div>
        <div class="text-body2 text-grey-7">
          {{ evaluationName || 'Evaluación seleccionada' }}
        </div>
      </div>


      <div class="row q-gutter-sm">
       <!-- ✅ Exportador -->
  <FindingsExporter
    :findings="findings"
    :file-key="fileKey"
    :project-name="evaluationName"
    :session-id="sessionId"
    :node-cache="nodeCache"      
    :get-node-name="getNodeName"  
    :get-node-type="getNodeType"  
  />
        <q-btn
          color="primary"
          icon="refresh"
          label="Actualizar"
          flat
          @click="refresh"
          :loading="loading"
        />
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Hallazgo"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Generador Automático -->
    <FindingsGenerator
      v-if="hasTimelineData"
      :evaluation-id="evaluationId"
      :session-id="sessionId"
      :task-id="taskId"
      :timeline-data="timelineData"
      @findings-generated="onFindingsGenerated"
      @findings-saved="refresh"
    />

    <!-- Loading / Error -->
    <div v-if="loading && !summary" class="column items-center justify-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <div class="q-mt-sm text-grey-7">Cargando hallazgos…</div>
    </div>

    <template v-else>
      <!-- Resumen -->
      <FindingsSummary
        :summary="summary"
        :findings="findings"
        :loading="loading"
        @refresh="refresh"
      />

      <!-- Filtros -->
      <FindingsFilters
        v-model:filters="filters"
        @apply="applyFilters"
        @reset="resetFilters"
      />

      <!-- Lista de Hallazgos -->
      <FindingsList
        :findings="findings"
        :loading="loading"
        @view="openDetailDialog"
        @edit="openEditDialog"
        @delete="deleteFinding"
        @status-change="updateFindingStatus"
      />
    </template>

    <!-- Modales -->
    <FindingsForm
      v-model="showFormDialog"
      :finding="editingFinding"
      :evaluation-id="evaluationId"
      :session-id="sessionId"
      :task-id="taskId"
      @save="handleSave"
    />

    <FindingDetailModal
      v-model="showDetailDialog"
      :finding="selectedFinding"
      @edit="openEditDialog"
      @status-change="updateFindingStatus"
      @close="showDetailDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useFindings } from '@/composables/useFindings'
import FindingsSummary from './FindingsSummary.vue'
import FindingsList from './FindingsList.vue'
import FindingsFilters from './FindingsFilters.vue'
import FindingsForm from './FindingsForm.vue'
import FindingDetailModal from './FindingDetailModal.vue'
import FindingsGenerator from '../experto/expFormales/findings/FindingsGenerator.vue'

import FindingsExporter from './FindingsExporter.vue'

const props = defineProps<{
  evaluationId: string
  evaluationName?: string
  sessionId?: string
  taskId?: string
    fileKey?: string  // ✅ NUEVO: Para el exportador
 nodeCache?: Map<string, { name: string; type: string; componentId?: string }>  // ✅ NUEVO
  getNodeName?: (id: string) => string  // ✅ NUEVO
  getNodeType?: (id: string) => string  // ✅ NUEVO
  timelineData?: {
    events: any[]
    emotionReadings: any[]
    sentiments: any[]
    comments: any[]
    expertComments: any[]
    durationMs: number
    getNodeIdFromEvent: (ev: any) => string
    getEmotionLabel: (em: any) => string
    getNearestEvent: (ms: number) => any
    getNearestEmotion: (ms: number) => any
    getNearestComment: (ms: number) => any
    getNearestSentiment: (ms: number) => any
  }
}>()

const {
  findings,
  summary,
  loading,
  filters,
  loadFindings,
  loadFindingsBySession,
  loadSummary,
  createFinding,
  updateFinding,
  updateFindingStatus,
  deleteFinding,
  applyFilters,
  resetFilters,
} = useFindings()

const showFormDialog = ref(false)
const showDetailDialog = ref(false)
const editingFinding = ref<any>(null)
const selectedFinding = ref<any>(null)

const hasTimelineData = computed(() => {
  return props.timelineData && props.timelineData.events?.length > 0
})

const loadData = async () => {
  if (props.sessionId) {
    await loadFindingsBySession(props.sessionId)
    if (props.evaluationId) {
      await loadSummary(props.evaluationId)
    }
  } else if (props.evaluationId) {
    await loadFindings(props.evaluationId)
    await loadSummary(props.evaluationId)
  }
}



function onFindingsGenerated(generatedFindings: any[]) {
  // Los hallazgos generados se pueden mostrar en la lista
  // Después de guardar, se recarga
}

// ... resto del código igual




const refresh = () => {
  loadData()
}

const openCreateDialog = () => {
  editingFinding.value = null
  showFormDialog.value = true
}

const openEditDialog = (finding: any) => {
  editingFinding.value = finding
  showFormDialog.value = true
}

const openDetailDialog = (finding: any) => {
  selectedFinding.value = finding
  showDetailDialog.value = true
}

const handleSave = async (data: any) => {
  try {
    if (editingFinding.value) {
      await updateFinding(
        editingFinding.value.findingId,
        data
      )
    } else {
      await createFinding({
        ...data,
        evaluationId: props.evaluationId,
        sessionId: props.sessionId || null,
        taskId: props.taskId || null,
      })
    }

    showFormDialog.value = false
    editingFinding.value = null

    await loadData()
  } catch (error) {
    // Error ya manejado en el composable
  }
}

// ============================================================
// WATCHERS
// ============================================================

watch(
  () => props.evaluationId,
  () => {
    if (props.evaluationId) {
      loadData()
    }
  },
  {
    immediate: true,
  }
)

// ============================================================
// LIFECYCLE
// ============================================================

onMounted(() => {
  if (props.evaluationId) {
    loadData()
  }
})

// ============================================================
// EXPOSE
// ============================================================

defineExpose({
  refresh,
  loadData,
})
</script>