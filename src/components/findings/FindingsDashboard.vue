<!-- components/findings/FindingsDashboard.vue - ACTUALIZADO -->
<template>
  <div class="findings-dashboard q-pa-md">
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">🔍 Dashboard de Hallazgos</div>
        <div class="text-body2 text-grey-7">
          {{ evaluationName || 'Evaluación seleccionada' }}
        </div>
        <div v-if="sessionId" class="text-caption text-grey-6 q-mt-xs">
          <q-icon name="event" size="12px" />
          Sesión: {{ shortSessionId }}
          <span v-if="timelineData" class="q-ml-sm">
            <q-icon name="timer" size="12px" />
            {{ formatDuration(timelineData.durationMs) }}
          </span>
        </div>
      </div>

      <div class="row q-gutter-sm items-center">
        <!-- Exportador MEJORADO -->
        <FindingsExporter
          :findings="findings"
          :file-key="fileKey"
          :project-name="evaluationName"
          :session-id="sessionId"
          :node-cache="nodeCache"
          :get-node-name="getNodeName"
          :get-node-type="getNodeType"
          :emotion-readings="emotionReadings"
          :sentiments="sentiments"
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

    <!-- ============================================================ -->
    <!-- GENERADOR AUTOMÁTICO                                          -->
    <!-- ============================================================ -->
    <FindingsGenerator
      v-if="hasTimelineData"
      :evaluation-id="evaluationId"
      :session-id="sessionId"
      :task-id="taskId"
      :timeline-data="timelineData"
      @findings-generated="onFindingsGenerated"
      @findings-saved="refresh"
    />

    <!-- ============================================================ -->
    <!-- TABS: HALLAZGOS | EMOCIONES | SENTIMIENTOS                    -->
    <!-- ============================================================ -->
    <q-card flat bordered class="q-mt-md">
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey-7"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="findings" icon="assignment">
          <div class="row items-center no-wrap q-gutter-xs">
            <span>Hallazgos</span>
            <q-badge color="primary" rounded>{{ findings.length }}</q-badge>
          </div>
        </q-tab>

        <q-tab name="emotions" icon="sentiment_satisfied">
          <div class="row items-center no-wrap q-gutter-xs">
            <span>Emociones</span>
            <q-badge color="orange" rounded>{{ emotionReadings.length }}</q-badge>
          </div>
        </q-tab>

        <q-tab name="sentiments" icon="psychology">
          <div class="row items-center no-wrap q-gutter-xs">
            <span>Sentimientos</span>
            <q-badge color="purple" rounded>{{ sentiments.length }}</q-badge>
          </div>
        </q-tab>
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <!-- ========================================================== -->
        <!-- TAB: HALLAZGOS                                             -->
        <!-- ========================================================== -->
        <q-tab-panel name="findings" class="q-pa-md">
          <!-- Loading -->
          <div
            v-if="loading && !summary"
            class="column items-center justify-center q-py-xl"
          >
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
              :findings-count="findings.length"
              @apply="applyFilters"
              @reset="resetFilters"
            />

            <!-- Lista -->
            <FindingsList
              :findings="findings"
              :loading="loading"
              @view="openDetailDialog"
              @edit="openEditDialog"
              @delete="deleteFinding"
              @status-change="updateFindingStatus"
            />
          </template>
        </q-tab-panel>

        <!-- ========================================================== -->
        <!-- TAB: EMOCIONES                                             -->
        <!-- ========================================================== -->
        <q-tab-panel name="emotions" class="q-pa-md">
          <div v-if="!emotionReadings.length" class="text-center q-py-xl">
            <q-icon name="sentiment_neutral" size="48px" color="grey-5" />
            <div class="text-grey-7 q-mt-sm">No hay lecturas de emociones</div>
            <div class="text-caption text-grey-6">
              Las emociones se registran durante la sesión
            </div>
          </div>

          <template v-else>
            <!-- Resumen de emociones -->
            <EmotionSummary :readings="emotionReadings" />

            <!-- Lista detallada -->
            <EmotionList
              :readings="emotionReadings"
              :evaluation-id="evaluationId"
              :session-id="sessionId"
              :task-id="taskId"
              :get-nearest-comment="getNearestComment"
              @seek="onSeekEmotion"
              @create-finding="handleCreateFinding"
            />
          </template>
        </q-tab-panel>

        <!-- ========================================================== -->
        <!-- TAB: SENTIMIENTOS                                          -->
        <!-- ========================================================== -->
        <q-tab-panel name="sentiments" class="q-pa-md">
          <div v-if="!sentiments.length" class="text-center q-py-xl">
            <q-icon name="psychology" size="48px" color="grey-5" />
            <div class="text-grey-7 q-mt-sm">No hay análisis de sentimientos</div>
            <div class="text-caption text-grey-6">
              Los sentimientos se analizan de los comentarios de la sesión
            </div>
          </div>

          <template v-else>
            <!-- Resumen de sentimientos -->
            <SentimentSummary :sentiments="sentiments" />

            <!-- Lista detallada -->
            <SentimentList
              :sentiments="sentiments"
              :task-name="evaluationName"
              :evaluation-id="evaluationId"
              :session-id="sessionId"
              :task-id="taskId"
              :comments="timelineData?.comments || []"
              :get-nearest-comment="getNearestComment"
              @seek="onSeekSentiment"
              @create-finding="handleCreateFinding"
            />
          </template>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- ============================================================ -->
    <!-- MODALES                                                       -->
    <!-- ============================================================ -->
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

// NUEVOS componentes
import EmotionList from '@/components/experto/EmotionList.vue'
import SentimentList from '@/components/experto/SentimentList.vue'
import EmotionSummary from './EmotionSummary.vue'
import SentimentSummary from './SentimentSummary.vue'

const props = defineProps<{
  evaluationId: string
  evaluationName?: string
  sessionId?: string
  taskId?: string
  fileKey?: string
  nodeCache?: Map<string, { name: string; type: string; componentId?: string }>
  getNodeName?: (id: string) => string
  getNodeType?: (id: string) => string
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

const emit = defineEmits<{
  (e: 'seek', ms: number): void
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

// ============================================================
// ESTADO LOCAL
// ============================================================
const activeTab = ref<'findings' | 'emotions' | 'sentiments'>('findings')
const showFormDialog = ref(false)
const showDetailDialog = ref(false)
const editingFinding = ref<any>(null)
const selectedFinding = ref<any>(null)

// ============================================================
// COMPUTED
// ============================================================
const hasTimelineData = computed(() => {
  return props.timelineData && props.timelineData.events?.length > 0
})

const emotionReadings = computed(() => props.timelineData?.emotionReadings || [])
const sentiments = computed(() => props.timelineData?.sentiments || [])

const shortSessionId = computed(() => {
  if (!props.sessionId) return ''
  return props.sessionId.slice(0, 8) + '...'
})

// ============================================================
// HELPERS
// ============================================================
function formatDuration(ms: number): string {
  if (!ms) return '0s'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

function getNearestComment(ms: number): any {
  if (!props.timelineData?.getNearestComment) return null
  return props.timelineData.getNearestComment(ms)
}

// ============================================================
// CARGA DE DATOS
// ============================================================
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

// ============================================================
// HANDLERS
// ============================================================
function onFindingsGenerated(generatedFindings: any[]) {
  // Los hallazgos se guardan desde el modal de revisión
}

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
      await updateFinding(editingFinding.value.findingId, data)
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
    // Error manejado en el composable
  }
}

async function handleCreateFinding(data: any) {
  try {
    await createFinding({
      ...data,
      evaluationId: props.evaluationId,
      sessionId: props.sessionId || null,
      taskId: props.taskId || null,
    })
    await loadData()
  } catch (error) {
    // Error manejado
  }
}

// ============================================================
// SEEK / NAVEGACIÓN
// ============================================================
function onSeekEmotion(ms: number) {
  emit('seek', ms)
}

function onSeekSentiment(ms: number) {
  emit('seek', ms)
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
  { immediate: true },
)

watch(
  () => props.sessionId,
  () => {
    if (props.sessionId) {
      loadData()
    }
  },
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

<style scoped>
.findings-dashboard {
  max-width: 100%;
}

:deep(.q-tab) {
  min-height: 48px;
  text-transform: none;
  font-weight: 500;
}

:deep(.q-tab-panel) {
  padding: 16px;
}
</style>