<!-- SessionDetailView.vue - LIMPIO FINAL -->
<template>
  <div class="q-pa-md">
    <!-- Header -->
    <SessionHeader :session="session" @back="router.back()" />

    <!-- Loading / Error -->
    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <span class="q-ml-sm" style="color: #334155">Cargando sesión…</span>
    </div>

    <div v-else-if="loadError" class="text-center q-py-lg">
      <q-icon name="error_outline" color="negative" size="48px" />
      <div class="text-negative q-mt-sm">{{ loadError }}</div>
      <q-btn color="primary" label="Reintentar" @click="cargarSesion" class="q-mt-sm" />
    </div>

    <template v-else-if="session">
      <!-- ========================================================== -->
      <!-- SECCIÓN: CUESTIONARIOS (PRE-TEST Y POST-TEST) -->
      <!-- ========================================================== -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6">
          <QuestionnaireResultCard
            type="pretest"
            :user-id="session?.userId"
            :project-id="session?.proyectId"
          />
        </div>
        <div class="col-6">
          <QuestionnaireResultCard
            type="posttest"
            :user-id="session?.userId"
            :project-id="session?.proyectId"
          />
        </div>
      </div>

      <!-- ========================================================== -->
      <!-- SECCIÓN: VIDEOS -->
      <!-- ========================================================== -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6">
          <VideoPlayer
            :video-url="screenUrl"
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

        <div class="col-6">
          <VideoPlayer
            :video-url="faceUrl"
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
      <!-- SECCIÓN: CONTROLES -->
      <!-- ========================================================== -->
      <VideoControls
        :playing="playing"
        :current-time="currentTimeMs"
        :duration="durationMs"
        :speed="velocidad"
        :speed-options="speedOptions"
        @play="togglePlay"
        @seek="saltar"
        @speed-change="(v) => { velocidad = v; }"
        @add-comment="() => abrirModalComentario(currentTimeMs)"
        @add-expert-comment="() => abrirModalExperto(currentTimeMs)"
      />

      <!-- ========================================================== -->
      <!-- SECCIÓN: TIMELINE -->
      <!-- ========================================================== -->
      <Timeline
        :duration-ms="durationMs"
        :current-time-ms="currentTimeMs"
        :events="events"
        :emotion-readings="emotionReadings"
        :comments="comments"
        :sentiments="sentiments"
        :expert-comments="expertComments"
        :loading-nodes="loadingNodes"
        :progreso-pct="progresoPct"
        :get-node-name="getNodeName"
        :get-node-type="getNodeType"
        :get-node-id-from-event="getNodeIdFromEvent"
        :get-emotion-ms="getEmotionMs"
        :get-emotion-label="getEmotionLabel"
        @seek="seekAbsoluto"
        @add-comment="abrirModalComentario"
        @edit-comment="abrirModalComentario"
        @add-expert-comment="abrirModalExperto"
        @edit-expert-comment="abrirModalExperto"
      />

      <!-- ========================================================== -->
      <!-- SECCIÓN: INSPECTOR -->
      <!-- ========================================================== -->
      <Inspector
        :current-time="currentTimeMs"
        :nearest-event="getNearestEvent(currentTimeMs)"
        :nearest-emotion-label="getNearestEmotion(currentTimeMs)?.dominantEmotion || '—'"
        :comments-near="comentariosCercanos(currentTimeMs).length"
        :nearest-comment="getNearestComment(currentTimeMs)"
        :nearest-sentiment="getNearestSentiment(currentTimeMs)"
        :task-name="session?.taskDescription"
        :evaluation-id="session?.proyectId || ''"
        :session-id="sessionId"
        :task-id="session?.taskId"
        :get-node-name="getNodeName"
        :get-node-type="getNodeType"
        :get-node-id-from-event="getNodeIdFromEvent"
        @create-finding="handleCreateFinding"
        @show-comment="openCommentModal"
      />

      <!-- ========================================================== -->
      <!-- SECCIÓN: MAPA DE CALOR -->
      <!-- ========================================================== -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col">
          <q-btn
            unelevated
            color="primary"
            icon="heat_pump"
            label="Ver mapa de calor"
            class="full-width"
            style="background: #1e3a8a; color: #ffffff"
            @click="showHeatmap = true"
          />
        </div>
        <div class="col-auto">
          <q-btn flat style="color: #3b82f6" icon="refresh" @click="refreshHeatmap" />
        </div>
      </div>

      <!-- ========================================================== -->
      <!-- SECCIÓN: SENTIMIENTOS -->
      <!-- ========================================================== -->
      <SentimentList
        :sentiments="sentiments"
        :task-name="session?.taskDescription"
        :evaluation-id="session?.proyectId || ''"
        :session-id="sessionId"
        :task-id="session?.taskId"
        :comments="comments"
        :get-nearest-comment="getNearestComment"
        @seek="seekAbsoluto"
        @create-finding="handleCreateFinding"
      />

      <!-- ========================================================== -->
      <!-- SECCIÓN: COMENTARIOS DE EXPERTOS -->
      <!-- ========================================================== -->
      <ExpertCommentList
        :comments="expertComments"
        @edit="abrirModalExperto"
        @delete="eliminarComentarioExperto"
        @seek="seekAbsoluto"
      />

      <!-- ========================================================== -->
      <!-- SECCIÓN: EVENTOS -->
      <!-- ========================================================== -->
      <EventList
        :events="events"
        :current-time="currentTimeMs"
        :loading-nodes="loadingNodes"
        :expandidos="expandidos"
        :get-node-id-from-event="getNodeIdFromEvent"
        :get-node-name="getNodeName"
        :get-node-type="getNodeType"
        @seek="seekAbsoluto"
        @toggle-expand="(id) => { expandidos[id] = !expandidos[id]; }"
      />

      <!-- ========================================================== -->
      <!-- SECCIÓN: COMENTARIOS DE USUARIO -->
      <!-- ========================================================== -->
      <CommentList
        :comments="comments"
        @edit="abrirModalComentario"
        @delete="eliminarComentario"
        @seek="seekAbsoluto"
      />

      <!-- ========================================================== -->
      <!-- SECCIÓN: METADATOS -->
      <!-- ========================================================== -->
      <MetadataExpansion :session="session" />

      <!-- ========================================================== -->
      <!-- SECCIÓN: REPORTE -->
      <!-- ========================================================== -->
      <div class="row q-mb-md">
        <div class="col">
          <SessionReportGenerator
            :session="session"
            :findings="findings"
            :events="events"
            :emotion-readings="emotionReadings"
            :sentiments="sentiments"
            :comments="comments"
            :expert-comments="expertComments"
            :task-name="session?.taskDescription"
            :project-name="session?.proyectId"
          />
        </div>
      </div>

      <!-- ========================================================== -->
      <!-- SECCIÓN: HALLAZGOS -->
      <!-- ========================================================== -->
      <q-card class="q-mt-md bg-slate-800 border-slate-700">
        <q-card-section>
      <FindingsDashboard
        :evaluation-id="session?.proyectId || ''"
        :session-id="sessionId"
        :task-id="session?.taskId"
        evaluation-name="Hallazgos de la Sesión"
        :file-key="session?.fileKey"
        :node-cache="nodeCache"  
        :get-node-name="getNodeName"  
        :get-node-type="getNodeType"  
        :timeline-data="timelineData"
      />
        </q-card-section>
      </q-card>
    </template>

    <!-- ========================================================== -->
    <!-- MODALES -->
    <!-- ========================================================== -->

    <!-- Modal de comentario de usuario -->
    <CommentModal
      v-model="modal.open"
      :ms="modal.ms"
      :text="modal.text"
      :editing-id="modal.editingId"
      :nearest-event="getNearestEvent(modal.ms)"
      :nearest-emotion-label="getNearestEmotion(modal.ms)?.dominantEmotion || '—'"
      @close="cerrarModal"
    />

    <!-- Modal de comentario de experto -->
    <ExpertCommentModal
      v-model:show="expertModal.open"
      :ms="expertModal.ms"
      :emotion-label="getNearestEmotion(expertModal.ms)?.dominantEmotion || '—'"
      :project-id="session?.proyectId || ''"
      :session-id="sessionId"
      :task-id="session?.taskId"
      :author-id="auth.user?.user_id || ''"
      :editing-comment="expertModal.editingComment"
      @close="cerrarModalExperto"
      @save="guardarComentarioExperto"
    />

    <!-- Mapa de calor -->
    <HeatmapViewer
      v-model:show="showHeatmap"
      :project-id="session?.proyectId || ''"
      :total-duration-sec="session?.durationSeconds"
      :node-id="currentNodeId || undefined"
      :session-id="sessionId"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  reactive,
  watch,
  nextTick,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "@/stores/auth.store";

// Componentes
import SessionHeader from "@/components/experto/SessionHeader.vue";
import VideoPlayer from "@/components/experto/VideoPlayer.vue";
import VideoControls from "@/components/experto/VideoControls.vue";
import Timeline from "@/components/experto/Timeline.vue";
import Inspector from "@/components/experto/Inspector.vue";
import EventList from "@/components/experto/EventList.vue";
import CommentList from "@/components/experto/CommentList.vue";
import CommentModal from "@/components/experto/CommentModal.vue";
import MetadataExpansion from "@/components/experto/MetadataExpansion.vue";
import FindingsDashboard from "@/components/findings/FindingsDashboard.vue";
import SessionReportGenerator from "@/components/experto/SessionReportGenerator.vue";
import HeatmapViewer from "@/components/experto/HeatmapViewer.vue";
import SentimentList from "@/components/experto/SentimentList.vue";
import ExpertCommentModal from "@/components/experto/ExpertCommentModal.vue";
import ExpertCommentList from "@/components/experto/ExpertCommentList.vue";
import QuestionnaireResultCard from "@/components/experto/QuestionnaireResultCard.vue";

// Composables
import { useFigmaNodes } from "@/composables/useFigmaNodes";

// APIs
import { textSentimentsApi } from "@/api/text-sentiments.api";
import { commentExpertsApi } from "@/api/comment-experts.api";

import type { UsabilitySession, UsabilityEvent, EmotionReading } from "@/types/evaluation";

const auth = useAuthStore();

const { getNodeName, getNodeType, loadFigmaNodes, loading: loadingNodes, nodeCache } = useFigmaNodes()

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const sessionId = route.params.sessionId as string;

const API_BASE_URL = "http://localhost:3000";
const STATIC_BASE_URL = `${API_BASE_URL}/storage/`;

const speedOptions = [0.5, 1, 1.5, 2];

// ============================================================
// STATE
// ============================================================
const loading = ref(true);
const loadError = ref<string | null>(null);
const session = ref<UsabilitySession | null>(null);
const events = ref<UsabilityEvent[]>([]);
const emotionReadings = ref<EmotionReading[]>([]);
const comments = ref<SessionComment[]>([]);
const sentiments = ref<any[]>([]);
const expertComments = ref<any[]>([]);
const expandidos = reactive<Record<string, boolean>>({});
const videoErrors = reactive<{ screen: string | null; face: string | null }>({
  screen: null,
  face: null,
});
const currentNodeId = ref<string | null>(null);
const showHeatmap = ref(false);

// Refs de video
const screenVideoRef = ref<InstanceType<typeof VideoPlayer> | null>(null);
const faceVideoRef = ref<InstanceType<typeof VideoPlayer> | null>(null);

// Estado de reproducción
const playing = ref(false);
const velocidad = ref(1);
const currentTimeMs = ref(0);
const durationMs = ref(0);

// ============================================================
// COMPUTED
// ============================================================
const screenUrl = computed(() => {
  const s = session.value as any;
  return buildVideoUrl(s?.screenVideoKey ?? s?.screenVideKey ?? null);
});

const faceUrl = computed(() => buildVideoUrl((session.value as any)?.faceVideoKey ?? null));

const progresoPct = computed(() =>
  durationMs.value > 0 ? (currentTimeMs.value / durationMs.value) * 100 : 0,
);

function buildVideoUrl(key: string | null | undefined) {
  if (!key) return null;
  const clean = key.replace(/^\/+/, "");
  return `${STATIC_BASE_URL}/${clean}`;
}
// ============================================================
// ✅ COMPUTED PARA TIMELINE DATA (AGREGAR ESTO)
// ============================================================
const timelineData = computed(() => ({
  events: events.value || [],
  emotionReadings: emotionReadings.value || [],
  sentiments: sentiments.value || [],
  comments: comments.value || [],
  expertComments: expertComments.value || [],
  durationMs: durationMs.value || 0,
  // ✅ TODOS LOS IDS NECESARIOS
  evaluationId: session.value?.proyectId || '',
  sessionId: sessionId || '',
  taskId: session.value?.taskId || null,
  // ✅ FUNCIONES DE CONTEXTO
  getNodeIdFromEvent,
  getEmotionLabel,
  getNearestEvent,
  getNearestEmotion,
  getNearestComment,
  getNearestSentiment,
}))

// ✅ LOG PARA VERIFICAR (OPCIONAL)
watch(timelineData, (data) => {
  console.log('📡 timelineData completo:', {
    evaluationId: data.evaluationId,
    sessionId: data.sessionId,
    taskId: data.taskId,
    events: data.events.length,
    emotions: data.emotionReadings.length,
    sentiments: data.sentiments.length,
    comments: data.comments.length,
    expertComments: data.expertComments.length,
  })
}, { immediate: true })
// ============================================================
// FUNCIONES DE CONTEXTO
// ============================================================
function getNearestComment(ms: number): any | null {
  if (!comments.value.length) return null;
  return comments.value.reduce((closest, c) => {
    const diff1 = Math.abs(c.elapsedMsTotal - ms);
    const diff2 = Math.abs(closest.elapsedMsTotal - ms);
    return diff1 < diff2 ? c : closest;
  });
}

function getNearestSentiment(ms: number): any | null {
  if (!sentiments.value.length) return null;
  return sentiments.value.reduce((closest, s) => {
    const diff1 = Math.abs(s.elapsedMsTotal - ms);
    const diff2 = Math.abs(closest.elapsedMsTotal - ms);
    return diff1 < diff2 ? s : closest;
  });
}

function getNearestEvent(ms: number): UsabilityEvent | null {
  if (!events.value.length) return null;
  return events.value.reduce((closest, ev) =>
    Math.abs(ev.elapsed_ms_total - ms) < Math.abs(closest.elapsed_ms_total - ms) ? ev : closest,
  );
}

function getNearestEmotion(ms: number): any | null {
  if (!emotionReadings.value.length) return null;
  return emotionReadings.value.reduce((closest, em) => {
    const ms1 = em.elapsedMsTotal ?? 0;
    const ms2 = closest.elapsedMsTotal ?? 0;
    return Math.abs(ms1 - ms) < Math.abs(ms2 - ms) ? em : closest;
  });
}

function comentariosCercanos(ms: number, ventanaMs = 2000) {
  return comments.value.filter((c) => Math.abs(c.elapsedMsTotal - ms) <= ventanaMs);
}

function getNodeIdFromEvent(ev: any): string {
  if (!ev) return "";
  if (ev.node_id) return ev.node_id;
  if (ev.raw_payload) {
    if (ev.raw_payload.targetNodeId) return ev.raw_payload.targetNodeId;
    if (ev.raw_payload.nodeId) return ev.raw_payload.nodeId;
    if (ev.raw_payload.presentedNodeId) return ev.raw_payload.presentedNodeId;
    if (ev.raw_payload.sourceNodeId) return ev.raw_payload.sourceNodeId;
    if (ev.raw_payload.currentNodeId) return ev.raw_payload.currentNodeId;
    if (typeof ev.raw_payload === "object") {
      for (const key of Object.keys(ev.raw_payload)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes("node") && typeof ev.raw_payload[key] === "string") {
          const value = ev.raw_payload[key];
          if (value.includes(":") || value.includes("-")) {
            return value;
          }
        }
      }
    }
  }
  if (ev.nodeId) return ev.nodeId;
  if (ev.targetNodeId) return ev.targetNodeId;
  if (ev.presentedNodeId) return ev.presentedNodeId;
  return "";
}

function getEmotionMs(em: any) {
  return em.elapsedMsTotal ?? em.elapsedMs ?? 0;
}

function getEmotionLabel(em: any) {
  return em.emotion ?? em.label ?? em.dominantEmotion ?? "N/A";
}

// ============================================================
// HALLAZGOS
// ============================================================
async function handleCreateFinding(data: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/findings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error al crear el hallazgo");
    }

    $q.notify({
      type: "positive",
      message: "✅ Hallazgo registrado exitosamente",
    });
  } catch (error) {
    console.error("Error creando hallazgo:", error);
    $q.notify({
      type: "negative",
      message: "Error al registrar el hallazgo",
    });
  }
}

function openCommentModal(comment: any) {
  abrirModalComentario(comment.elapsedMsTotal, comment);
}

// ============================================================
// CARGA DE DATOS
// ============================================================
async function cargarSesion() {
  loading.value = true;
  loadError.value = null;
  try {
    const sessionRes = await fetch(`${API_BASE_URL}/api/usability-sessions/${sessionId}`);
    if (!sessionRes.ok) throw new Error(`No se pudo cargar la sesión (HTTP ${sessionRes.status})`);
    session.value = await sessionRes.json();

    if (session.value?.fileKey) {
      await loadFigmaNodes(session.value.fileKey);
    }

    const [eventsRes, emotionsRes, commentsRes, sentimentsRes, expertCommentsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/usability-events/session/${sessionId}`),
      fetch(`${API_BASE_URL}/api/emotion-readings/session/${sessionId}`),
      fetch(`${API_BASE_URL}/api/session-comments/session/${sessionId}`).catch(() => null),
      textSentimentsApi.getBySession(sessionId).catch(() => ({ data: [] })),
      commentExpertsApi.getBySession(sessionId).catch(() => ({ data: [] })),
    ]);

    if (eventsRes.ok) {
      const data = await eventsRes.json();
      events.value = data.sort((a: UsabilityEvent, b: UsabilityEvent) => a.elapsed_ms_total - b.elapsed_ms_total);
    }

    if (emotionsRes.ok) emotionReadings.value = await emotionsRes.json();

    if (commentsRes && commentsRes.ok) {
      comments.value = await commentsRes.json();
    }

    sentiments.value = sentimentsRes.data || [];
    expertComments.value = expertCommentsRes.data || [];

    durationMs.value = Number(session.value?.durationSeconds || 0) * 1000;
  } catch (err: any) {
    loadError.value = err?.message || "Error al cargar la sesión.";
  } finally {
    loading.value = false;
  }
}

// ============================================================
// MODALES
// ============================================================
const expertModal = reactive<{
  open: boolean;
  ms: number;
  editingComment: any | null;
}>({
  open: false,
  ms: 0,
  editingComment: null,
});

function abrirModalExperto(ms: number, existente?: any) {
  expertModal.open = true;
  expertModal.ms = existente ? existente.elapsedMsTotal : ms;
  expertModal.editingComment = existente || null;
}

function cerrarModalExperto() {
  expertModal.open = false;
  expertModal.editingComment = null;
}

async function guardarComentarioExperto(data: any) {
  try {
    if (expertModal.editingComment) {
      await commentExpertsApi.update(expertModal.editingComment.commentId, {
        comment: data.comment,
        commentType: data.commentType,
        severity: data.severity,
      });
    } else {
      await commentExpertsApi.create(data);
    }

    $q.notify({
      type: "positive",
      message: expertModal.editingComment ? "Comentario actualizado" : "Comentario guardado",
    });

    const res = await commentExpertsApi.getBySession(sessionId);
    expertComments.value = res.data;

    cerrarModalExperto();
  } catch (error) {
    console.error("Error guardando comentario de experto:", error);
    $q.notify({ type: "negative", message: "Error al guardar el comentario" });
  }
}

async function eliminarComentarioExperto(commentId: string) {
  const confirm = await new Promise((resolve) => {
    $q.dialog({
      title: "Eliminar comentario",
      message: "¿Estás seguro de que quieres eliminar este comentario?",
      cancel: true,
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });

  if (!confirm) return;

  try {
    await commentExpertsApi.delete(commentId);
    expertComments.value = expertComments.value.filter((c) => c.commentId !== commentId);
    $q.notify({ type: "positive", message: "Comentario eliminado" });
  } catch (error) {
    console.error("Error eliminando comentario:", error);
    $q.notify({ type: "negative", message: "Error al eliminar" });
  }
}

const modal = reactive<{
  open: boolean;
  ms: number;
  text: string;
  editingId: string | null;
}>({
  open: false,
  ms: 0,
  text: "",
  editingId: null,
});

function abrirModalComentario(ms: number, existente?: SessionComment) {
  modal.open = true;
  modal.ms = existente ? existente.elapsedMsTotal : ms;
  modal.text = existente?.text ?? "";
  modal.editingId = existente?.commentId ?? null;
}

function cerrarModal() {
  modal.open = false;
  modal.text = "";
  modal.editingId = null;
}

async function eliminarComentario(commentId: string) {
  const confirm = await new Promise((resolve) => {
    $q.dialog({
      title: "Eliminar comentario",
      message: "¿Estás seguro de que quieres eliminar este comentario?",
      cancel: true,
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });

  if (!confirm) return;

  comments.value = comments.value.filter((c) => c.commentId !== commentId);
  try {
    await fetch(`${API_BASE_URL}/api/session-comments/${commentId}`, { method: "DELETE" });
    $q.notify({ type: "positive", message: "Comentario eliminado" });
  } catch (err) {
    console.error("No se pudo borrar el comentario en el servidor:", err);
    $q.notify({ type: "negative", message: "Error al eliminar" });
  }
}

// ============================================================
// FUNCIONES DE VIDEO
// ============================================================
function onScreenMetadata() {
  const video = screenVideoRef.value?.getVideoElement();
  if (video?.duration && isFinite(video.duration)) {
    durationMs.value = video.duration * 1000;
  }
  if (video) video.playbackRate = velocidad.value;
}

function onScreenTimeUpdate() {
  const video = screenVideoRef.value?.getVideoElement();
  if (!video) return;
  currentTimeMs.value = video.currentTime * 1000;
  const faceVideo = faceVideoRef.value?.getVideoElement();
  if (faceVideo) {
    const drift = Math.abs(faceVideo.currentTime - video.currentTime);
    if (drift > 0.35) faceVideo.currentTime = video.currentTime;
  }
}

function onFaceTimeUpdate() {
  if (screenVideoRef.value?.getVideoElement()) return;
  const video = faceVideoRef.value?.getVideoElement();
  if (!video) return;
  currentTimeMs.value = video.currentTime * 1000;
}

function onVideoError(cual: "screen" | "face") {
  videoErrors[cual] = "no se pudo reproducir el archivo (revisa la URL o el formato).";
}

async function togglePlay() {
  const screenVideo = screenVideoRef.value?.getVideoElement();
  const faceVideo = faceVideoRef.value?.getVideoElement();
  try {
    if (playing.value) {
      screenVideo?.pause();
      faceVideo?.pause();
    } else {
      await Promise.all([screenVideo?.play(), faceVideo?.play()]);
    }
  } catch (err) {
    console.error("No se pudo reproducir el video:", err);
    playing.value = false;
  }
}

function seekAbsoluto(ms: number) {
  const seconds = Math.max(0, ms) / 1000;
  const screenVideo = screenVideoRef.value?.getVideoElement();
  const faceVideo = faceVideoRef.value?.getVideoElement();
  if (screenVideo) screenVideo.currentTime = seconds;
  if (faceVideo) faceVideo.currentTime = seconds;
  currentTimeMs.value = Math.max(0, ms);
}

function saltar(deltaMs: number) {
  seekAbsoluto(Math.max(0, Math.min(durationMs.value, currentTimeMs.value + deltaMs)));
}

// ============================================================
// UTILIDADES
// ============================================================
function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

// ============================================================
// HEATMAP
// ============================================================
async function refreshHeatmap() {
  if (!session.value?.proyectId) return;

  $q.notify({
    type: "info",
    message: "Actualizando mapa de calor...",
    timeout: 1500,
  });

  showHeatmap.value = false;
  await nextTick();
  showHeatmap.value = true;
}

// ============================================================
// WATCHERS
// ============================================================
watch(velocidad, (v) => {
  const screenVideo = screenVideoRef.value?.getVideoElement();
  const faceVideo = faceVideoRef.value?.getVideoElement();
  if (screenVideo) screenVideo.playbackRate = v;
  if (faceVideo) faceVideo.playbackRate = v;
});

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(cargarSesion);

onBeforeUnmount(() => {
  screenVideoRef.value?.getVideoElement()?.pause();
  faceVideoRef.value?.getVideoElement()?.pause();
});
</script>