<!-- views/roles/coordinador/heuristic/HeuristicSessionDetailView.vue -->
<template>
  <div class="q-pa-md">
    <!-- ========================================================== -->
    <!-- LOADING / ERROR                                            -->
    <!-- ========================================================== -->
    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <span class="q-ml-sm text-grey-7">Cargando sesión...</span>
    </div>

    <div v-else-if="error" class="text-center q-py-lg">
      <q-icon name="error_outline" color="negative" size="48px" />
      <div class="text-negative q-mt-sm">{{ error }}</div>
      <q-btn
        color="primary"
        label="Reintentar"
        @click="loadAll"
        class="q-mt-sm"
      />
    </div>

    <template v-else-if="session">
      <!-- ========================================================== -->
      <!-- HEADER                                                     -->
      <!-- ========================================================== -->
      <HeuristicSessionHeader
        :session="session"
        :evaluation="evaluation"
        :task="task"
        :evaluator="evaluator"
        :user-name="userName"
        @back="goBack"
      />

      <!-- ========================================================== -->
      <!-- VIDEOS                                                     -->
      <!-- ========================================================== -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-6">
          <VideoPlayer
            :video-url="screenVideoUrl"
            label="Pantalla"
            icon="desktop_windows"
            :error="videoErrors.screen"
            @loadedmetadata="onScreenMetadata"
            @timeupdate="onScreenTimeUpdate"
            @play="playing = true"
            @pause="playing = false"
            @ended="playing = false"
            @error="onVideoError('screen')"
            ref="screenVideoRef"
          />
        </div>

        <div class="col-12 col-md-6">
          <VideoPlayer
            :video-url="faceVideoUrl"
            label="Rostro"
            icon="face"
            :error="videoErrors.face"
            :muted="false"
            @timeupdate="onFaceTimeUpdate"
            @error="onVideoError('face')"
            ref="faceVideoRef"
          />
        </div>
      </div>

      <!-- ========================================================== -->
      <!-- CONTROLES                                                  -->
      <!-- ========================================================== -->
      <VideoControls
        :playing="playing"
        :current-time="currentTimeMs"
        :duration="durationMs"
        :speed="velocidad"
        :speed-options="speedOptions"
        @play="togglePlay"
        @seek="saltar"
        @speed-change="(v) => (velocidad = v)"
        @add-comment="() => abrirModalComentario(currentTimeMs)"
        @add-expert-comment="() => abrirModalExperto(currentTimeMs)"
      />

      <!-- ========================================================== -->
      <!-- TIMELINE                                                   -->
      <!-- ========================================================== -->
      <HeuristicTimeline
        :duration-ms="durationMs"
        :current-time-ms="currentTimeMs"
        :events="events"
        :emotion-changes="emotionChanges"
        :comments="comments"
        :sentiments="sentiments"
        :expert-comments="sessionExpertComments"
        :observations="sessionObservations"
        :positive-aspects="sessionPositiveAspects"
        :loading-nodes="loadingNodes"
        :progreso-pct="progresoPct"
        :get-node-name="getNodeName"
        :get-node-type="getNodeType"
        :get-node-id-from-event="getNodeIdFromEvent"
        :get-emotion-ms="getEmotionMs"
        :get-emotion-label="getEmotionLabel"
        @seek="seekAbsoluto"
        @edit-comment="abrirModalComentario"
        @edit-expert-comment="abrirModalExperto"
      />

      <!-- ========================================================== -->
      <!-- INSPECTOR                                                  -->
      <!-- ========================================================== -->
      <HeuristicInspector
        :current-time="currentTimeMs"
        :nearest-event="getNearestEvent(currentTimeMs)"
        :nearest-emotion="getNearestEmotion(currentTimeMs)"
        :nearest-sentiment="getNearestSentiment(currentTimeMs)"
        :nearest-comment="getNearestComment(currentTimeMs)"
        :nearest-observation="getNearestObservation(currentTimeMs)"
        :task-name="task?.title || session.taskDescription"
        :get-node-name="getNodeName"
        :get-node-type="getNodeType"
        :get-node-id-from-event="getNodeIdFromEvent"
      />

      <!-- ========================================================== -->
      <!-- TABS: Observaciones, Positivos, Sentimientos, Comentarios, Eventos -->
      <!-- ========================================================== -->
      <q-card flat bordered class="q-mt-md">
        <q-tabs
          v-model="activeTab"
          dense
          class="text-grey-7"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
          no-caps
        >
          <q-tab name="observations" icon="report_problem">
            <q-badge v-if="sessionObservations.length" color="orange" floating>
              {{ sessionObservations.length }}
            </q-badge>
            Observaciones
          </q-tab>
          <q-tab name="positives" icon="thumb_up">
            <q-badge v-if="sessionPositiveAspects.length" color="positive" floating>
              {{ sessionPositiveAspects.length }}
            </q-badge>
            Positivos
          </q-tab>
          <q-tab name="sentiments" icon="psychology">
            <q-badge v-if="sentiments.length" color="purple" floating>
              {{ sentiments.length }}
            </q-badge>
            Sentimientos
          </q-tab>
          <q-tab name="comments" icon="chat">
            <q-badge v-if="comments.length" color="green" floating>
              {{ comments.length }}
            </q-badge>
            Comentarios
          </q-tab>
          <q-tab name="events" icon="event">
            <q-badge v-if="events.length" color="blue" floating>
              {{ events.length }}
            </q-badge>
            Eventos
          </q-tab>
          <q-tab name="progress" icon="checklist">
            Progreso
          </q-tab>
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <!-- Observaciones -->
          <q-tab-panel name="observations">
            <HeuristicObservationList
              :observations="sessionObservations"
              :principles="principles"
              :tasks="tasks"
              @seek="seekAbsoluto"
            />
          </q-tab-panel>

          <!-- Aspectos positivos -->
          <q-tab-panel name="positives">
            <HeuristicPositiveAspectList
              :positive-aspects="sessionPositiveAspects"
              :tasks="tasks"
              @seek="seekAbsoluto"
            />
          </q-tab-panel>

          <!-- Sentimientos -->
          <q-tab-panel name="sentiments">
            <HeuristicSentimentList
              :sentiments="sentiments"
              @seek="seekAbsoluto"
            />
          </q-tab-panel>

          <!-- Comentarios -->
          <q-tab-panel name="comments">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <HeuristicCommentList
                  :comments="comments"
                  @edit="abrirModalComentario"
                  @delete="eliminarComentario"
                  @seek="seekAbsoluto"
                />
              </div>
              <div class="col-12 col-md-6">
                <ExpertCommentList
                  :comments="sessionExpertComments"
                  @edit="abrirModalExperto"
                  @delete="eliminarComentarioExperto"
                  @seek="seekAbsoluto"
                />
              </div>
            </div>
          </q-tab-panel>

          <!-- Eventos -->
          <q-tab-panel name="events">
            <HeuristicEventList
              :events="events"
              :current-time="currentTimeMs"
              :loading-nodes="loadingNodes"
              :expandidos="expandidos"
              :get-node-id-from-event="getNodeIdFromEvent"
              :get-node-name="getNodeName"
              :get-node-type="getNodeType"
              @seek="seekAbsoluto"
              @toggle-expand="(id) => (expandidos[id] = !expandidos[id])"
            />
          </q-tab-panel>

          <!-- Progreso -->
          <q-tab-panel name="progress">
            <HeuristicTaskProgressViewer
              :task="task"
              :evaluator="evaluator"
              :task-progress="taskProgress"
              :evaluation="evaluation"
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>

      <!-- ========================================================== -->
      <!-- GENERADOR DE HALLAZGOS                                     -->
      <!-- ========================================================== -->
      <div class="q-mt-md">
        <HeuristicFindingsGenerator
          :evaluation-id="evaluation?.evaluationId || ''"
          :session-id="session.sessionId"
          :task-id="task?.id || null"
          :timeline-data="timelineData"
          @findings-saved="onFindingsSaved"
        />
      </div>

      <!-- ========================================================== -->
      <!-- DASHBOARD DE HALLAZGOS                                     -->
      <!-- ========================================================== -->
      <div class="q-mt-md">
        <FindingsDashboard
          :evaluation-id="evaluation?.evaluationId || ''"
          :session-id="session.sessionId"
          :task-id="task?.id || undefined"
          evaluation-name="Hallazgos de la Sesión"
          :file-key="session.fileKey"
          :node-cache="nodeCache"
          :get-node-name="getNodeName"
          :get-node-type="getNodeType"
          :timeline-data="timelineData"
        />
      </div>
    </template>

    <!-- ========================================================== -->
    <!-- MODALES                                                    -->
    <!-- ========================================================== -->
    <CommentModal
      v-model="modal.open"
      :ms="modal.ms"
      :text="modal.text"
      :editing-id="modal.editingId"
      :nearest-event="getNearestEvent(modal.ms)"
      :nearest-emotion-label="getEmotionLabel(getNearestEmotion(modal.ms))"
      @close="cerrarModal"
    />

    <ExpertCommentModal
      v-model:show="expertModal.open"
      :ms="expertModal.ms"
      :emotion-label="getEmotionLabel(getNearestEmotion(expertModal.ms))"
      :project-id="session?.proyectId || ''"
      :session-id="session?.sessionId || ''"
      :task-id="task?.id || null"
      :author-id="auth.user?.user_id || ''"
      :editing-comment="expertModal.editingComment"
      @close="cerrarModalExperto"
      @save="guardarComentarioExperto"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth.store'

// Composables
import { useHeuristicSessionDetail } from '@/composables/coordinator/heuristic/useHeuristicSessionDetail'
import { useFigmaNodes } from '@/composables/useFigmaNodes'
import { heuristicApi } from '@/api/heuristic.api'

// Componentes base (reutilizados del experto)
import VideoPlayer from '@/components/experto/VideoPlayer.vue'
import VideoControls from '@/components/experto/VideoControls.vue'
import CommentModal from '@/components/experto/CommentModal.vue'
import ExpertCommentModal from '@/components/experto/ExpertCommentModal.vue'
import ExpertCommentList from '@/components/experto/ExpertCommentList.vue'
import FindingsDashboard from '@/components/findings/FindingsDashboard.vue'

// Componentes específicos del coordinador heurístico
import HeuristicSessionHeader from '@/components/coordinator/heuristic/detail/HeuristicSessionHeader.vue'
import HeuristicTimeline from '@/components/coordinator/heuristic/detail/HeuristicTimeline.vue'
import HeuristicInspector from '@/components/coordinator/heuristic/detail/HeuristicInspector.vue'
import HeuristicEventList from '@/components/coordinator/heuristic/detail/HeuristicEventList.vue'
import HeuristicObservationList from '@/components/coordinator/heuristic/detail/HeuristicObservationList.vue'
import HeuristicPositiveAspectList from '@/components/coordinator/heuristic/detail/HeuristicPositiveAspectList.vue'
import HeuristicSentimentList from '@/components/coordinator/heuristic/detail/HeuristicSentimentList.vue'
import HeuristicCommentList from '@/components/coordinator/heuristic/detail/HeuristicCommentList.vue'
import HeuristicTaskProgressViewer from '@/components/coordinator/heuristic/detail/HeuristicTaskProgressViewer.vue'
import HeuristicFindingsGenerator from '@/components/coordinator/heuristic/detail/HeuristicFindingsGenerator.vue'

// Types
import type { UsabilitySession } from '@/composables/coordinator/heuristic/useHeuristicSessionDetail'

// ============================================================
// ROUTER / STORE
// ============================================================
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()

const evaluationId = computed(() => route.params.evaluationId as string)
const sessionId = computed(() => route.params.sessionId as string)

// ============================================================
// COMPOSABLES
// ============================================================
const {
  loading,
  error,
  session,
  events,
  emotionChanges,
  sentiments,
  comments,
  evaluation,
  task,
  evaluator,
  observations,
  positiveAspects,
  taskProgress,
  sessionObservations,
  sessionPositiveAspects,
  sessionExpertComments,
  screenVideoUrl,
  faceVideoUrl,
  durationMs,
  timelineData,
  loadSession,
  // Helpers
  getNearestEvent,
  getNearestEmotion,
  getNearestSentiment,
  getNearestComment,
  getNearestObservation,
  getNodeIdFromEvent,
  getEmotionLabel,
  getEmotionMs,
} = useHeuristicSessionDetail()

const {
  nodeCache,
  loading: loadingNodes,
  loadFigmaNodes,
  getNodeName,
  getNodeType,
} = useFigmaNodes()

// ============================================================
// ESTADO LOCAL
// ============================================================
const activeTab = ref('observations')
const playing = ref(false)
const velocidad = ref(1)
const currentTimeMs = ref(0)
const speedOptions = [0.5, 1, 1.5, 2]

const screenVideoRef = ref<InstanceType<typeof VideoPlayer> | null>(null)
const faceVideoRef = ref<InstanceType<typeof VideoPlayer> | null>(null)

const videoErrors = reactive<{ screen: string | null; face: string | null }>({
  screen: null,
  face: null,
})

const expandidos = reactive<Record<string, boolean>>({})

const userName = computed(() => {
  if (!session.value) return ''
  return auth.user?.display_name || 'Evaluador'
})

const progresoPct = computed(() =>
  durationMs.value > 0 ? (currentTimeMs.value / durationMs.value) * 100 : 0,
)

// Lista de tareas y principios para los listados
const tasks = ref<any[]>([])
const principles = ref<any[]>([])

// ============================================================
// MÉTODOS DE CARGA
// ============================================================
async function loadAll() {
  try {
    await loadSession(sessionId.value)

    // Cargar nodos de Figma
    if (session.value?.fileKey) {
      await loadFigmaNodes(session.value.fileKey)
    }

    // Cargar tareas y principios de la evaluación
    if (evaluation.value?.evaluationId) {
      const [tasksRes, principlesRes] = await Promise.all([
        heuristicApi.getTasksByEvaluation(evaluation.value.evaluationId),
        heuristicApi.getPrinciplesByFramework(evaluation.value.frameworkId),
      ])
      tasks.value = tasksRes.data
      principles.value = principlesRes.data
    }

    // Duración inicial
    if (durationMs.value) {
      currentTimeMs.value = 0
    }
  } catch (e) {
    console.error('Error al cargar todo:', e)
  }
}

// ============================================================
// VIDEO
// ============================================================
function onScreenMetadata() {
  const video = screenVideoRef.value?.getVideoElement()
  if (video?.duration && isFinite(video.duration)) {
    // La duración real del video sobreescribe la de la BD
    // (opcional) durationMs.value = video.duration * 1000
  }
  if (video) video.playbackRate = velocidad.value
}

function onScreenTimeUpdate() {
  const video = screenVideoRef.value?.getVideoElement()
  if (!video) return
  currentTimeMs.value = video.currentTime * 1000

  // Sincronizar video de rostro
  const faceVideo = faceVideoRef.value?.getVideoElement()
  if (faceVideo) {
    const drift = Math.abs(faceVideo.currentTime - video.currentTime)
    if (drift > 0.35) faceVideo.currentTime = video.currentTime
  }
}

function onFaceTimeUpdate() {
  if (screenVideoRef.value?.getVideoElement()) return
  const video = faceVideoRef.value?.getVideoElement()
  if (!video) return
  currentTimeMs.value = video.currentTime * 1000
}

function onVideoError(cual: 'screen' | 'face') {
  videoErrors[cual] = 'No se pudo reproducir el archivo.'
}

async function togglePlay() {
  const screenVideo = screenVideoRef.value?.getVideoElement()
  const faceVideo = faceVideoRef.value?.getVideoElement()
  try {
    if (playing.value) {
      screenVideo?.pause()
      faceVideo?.pause()
    } else {
      await Promise.all([screenVideo?.play(), faceVideo?.play()])
    }
  } catch (err) {
    console.error('No se pudo reproducir el video:', err)
    playing.value = false
  }
}

function seekAbsoluto(ms: number) {
  const seconds = Math.max(0, ms) / 1000
  const screenVideo = screenVideoRef.value?.getVideoElement()
  const faceVideo = faceVideoRef.value?.getVideoElement()
  if (screenVideo) screenVideo.currentTime = seconds
  if (faceVideo) faceVideo.currentTime = seconds
  currentTimeMs.value = Math.max(0, ms)
}

function saltar(deltaMs: number) {
  seekAbsoluto(
    Math.max(0, Math.min(durationMs.value, currentTimeMs.value + deltaMs)),
  )
}

// ============================================================
// MODAL COMENTARIO USUARIO
// ============================================================
const modal = reactive<{
  open: boolean
  ms: number
  text: string
  editingId: string | null
}>({
  open: false,
  ms: 0,
  text: '',
  editingId: null,
})

function abrirModalComentario(ms: number, existente?: any) {
  modal.open = true
  modal.ms = existente ? existente.elapsedMsTotal : ms
  modal.text = existente?.text ?? ''
  modal.editingId = existente?.commentId ?? null
}

function cerrarModal() {
  modal.open = false
  modal.text = ''
  modal.editingId = null
}

async function eliminarComentario(commentId: string) {
  const confirm = await $q.dialog({
    title: 'Eliminar comentario',
    message: '¿Estás seguro de que quieres eliminar este comentario?',
    cancel: true,
    persistent: true,
  })

  if (!confirm) return

  try {
    await fetch(
      `${import.meta.env.VITE_API_URL}/session-comments/${commentId}`,
      { method: 'DELETE' },
    )
    comments.value = comments.value.filter(c => c.commentId !== commentId)
    $q.notify({ type: 'positive', message: 'Comentario eliminado' })
  } catch (err) {
    console.error('Error al eliminar comentario:', err)
    $q.notify({ type: 'negative', message: 'Error al eliminar' })
  }
}

// ============================================================
// MODAL COMENTARIO EXPERTO
// ============================================================
const expertModal = reactive<{
  open: boolean
  ms: number
  editingComment: any | null
}>({
  open: false,
  ms: 0,
  editingComment: null,
})

function abrirModalExperto(ms: number, existente?: any) {
  expertModal.open = true
  expertModal.ms = existente ? existente.elapsedMsTotal : ms
  expertModal.editingComment = existente || null
}

function cerrarModalExperto() {
  expertModal.open = false
  expertModal.editingComment = null
}

async function guardarComentarioExperto(data: any) {
  try {
    const { commentExpertsApi } = await import('@/api/comment-experts.api')

    if (expertModal.editingComment) {
      await commentExpertsApi.update(expertModal.editingComment.commentId, {
        comment: data.comment,
        commentType: data.commentType,
        severity: data.severity,
      })
    } else {
      await commentExpertsApi.create(data)
    }

    $q.notify({
      type: 'positive',
      message: expertModal.editingComment
        ? 'Comentario actualizado'
        : 'Comentario guardado',
    })

    // Recargar comentarios de expertos
    if (session.value?.sessionId) {
      const res = await commentExpertsApi.getBySession(session.value.sessionId)
      sessionExpertComments.value = res.data
    }

    cerrarModalExperto()
  } catch (error) {
    console.error('Error guardando comentario de experto:', error)
    $q.notify({ type: 'negative', message: 'Error al guardar el comentario' })
  }
}

async function eliminarComentarioExperto(commentId: string) {
  const confirm = await $q.dialog({
    title: 'Eliminar comentario',
    message: '¿Eliminar este comentario de experto?',
    cancel: true,
    persistent: true,
  })

  if (!confirm) return

  try {
    const { commentExpertsApi } = await import('@/api/comment-experts.api')
    await commentExpertsApi.delete(commentId)
    sessionExpertComments.value = sessionExpertComments.value.filter(
      c => c.commentId !== commentId,
    )
    $q.notify({ type: 'positive', message: 'Comentario eliminado' })
  } catch (error) {
    console.error('Error eliminando comentario:', error)
    $q.notify({ type: 'negative', message: 'Error al eliminar' })
  }
}

// ============================================================
// HALLAZGOS
// ============================================================
function onFindingsSaved() {
  $q.notify({ type: 'positive', message: 'Hallazgos actualizados' })
}

// ============================================================
// NAVEGACIÓN
// ============================================================
function goBack() {
  router.push({
    name: 'CoordinadorHeuristicoDetail',
    params: { evaluationId: evaluationId.value },
  })
}

// ============================================================
// WATCHERS
// ============================================================
watch(velocidad, (v) => {
  const screenVideo = screenVideoRef.value?.getVideoElement()
  const faceVideo = faceVideoRef.value?.getVideoElement()
  if (screenVideo) screenVideo.playbackRate = v
  if (faceVideo) faceVideo.playbackRate = v
})

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(loadAll)

onBeforeUnmount(() => {
  screenVideoRef.value?.getVideoElement()?.pause()
  faceVideoRef.value?.getVideoElement()?.pause()
})
</script>

<style scoped>
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>