<!-- components/coordinador/heuristic/detail/HeuristicTimeline.vue -->
<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pa-sm">
      <!-- Leyenda -->
      <div class="row items-center q-mb-xs">
        <div class="text-subtitle2 text-dark">Línea de tiempo</div>
        <div class="col" />
        <div class="row q-gutter-x-sm text-caption text-grey-6">
          <span>
            <span class="legend-dot" style="background:#3B82F6"></span>
            Eventos
          </span>
          <span>
            <span class="legend-dot" style="background:#F59E0B"></span>
            Cambios de emoción  
          </span>
          <span>
            <span class="legend-square" style="background:#10B981"></span>
            Comentarios
          </span>
          <span>
            <span class="legend-square" style="background:#8B5CF6"></span>
            Sentimientos
          </span>
          <span>
            <span class="legend-square" style="background:#F472B6"></span>
            Experto
          </span>
          <span>
            <span class="legend-square" style="background:#F97316"></span>
            Observaciones
          </span>
          <span>
            <span class="legend-square" style="background:#22C55E"></span>
            Positivos
          </span>
        </div>
      </div>

      <!-- Barra del timeline -->
      <div
        ref="timelineBarEl"
        class="relative bg-grey-3 rounded cursor-pointer select-none"
        style="height: 100px"
        @click="onTimelineClick"
        @mousemove="onTimelineHover"
        @mouseleave="hoverMs = null"
      >
        <!-- Progreso -->
        <div
          class="absolute inset-y-0 left-0 bg-primary/20 rounded"
          :style="{ width: progresoPct + '%' }"
        />

        <!-- Playhead -->
        <div
          class="absolute inset-y-0 bg-primary"
          style="width: 2px; z-index: 10"
          :style="{ left: progresoPct + '%' }"
        />
        <div
          class="absolute w-3 h-3 rounded-full bg-primary -ml-1.5 -mt-1.5"
          style="top: 50%; z-index: 11"
          :style="{ left: progresoPct + '%' }"
        />

        <!-- EVENTOS -->
        <div
          v-for="ev in events"
          :key="'ev-' + ev.event_id"
          class="absolute top-1 cursor-pointer"
          style="z-index: 5"
          :style="{ left: pct(ev.elapsed_ms_total) + '%' }"
          @mouseenter="hoverMs = ev.elapsed_ms_total"
        >
          <div class="flex flex-col items-center">
            <div class="marker-dot" style="background: #3b82f6" />
            <span class="marker-label">E</span>
          </div>
        </div>

        <!-- CAMBIOS DE EMOCIÓN -->
        <div
          v-for="(em, i) in emotionChanges"
          :key="'em-' + i"
          class="absolute bottom-1 cursor-pointer"
          style="z-index: 5"
          :style="{ left: pct(getEmotionMs(em)) + '%' }"
          @mouseenter="hoverMs = getEmotionMs(em)"
        >
          <div class="flex flex-col items-center">
            <div class="marker-dot" style="background: #f59e0b" />
            <span class="marker-label">{{ getEmotionEmoji(em) }}</span>
          </div>
        </div>

        <!-- SENTIMIENTOS -->
        <div
          v-for="s in sentiments"
          :key="'s-' + s.sentimentId"
          class="absolute cursor-pointer"
          style="top: 35%; z-index: 5"
          :style="{ left: pct(s.elapsedMsTotal) + '%' }"
          @mouseenter="hoverMs = s.elapsedMsTotal"
        >
          <div class="flex flex-col items-center">
            <div class="marker-square" style="background: #8b5cf6" />
            <span class="marker-label">🧠</span>
          </div>
        </div>

        <!-- COMENTARIOS USUARIO -->
        <div
          v-for="c in comments"
          :key="'c-' + c.commentId"
          class="absolute cursor-pointer"
          style="top: 50%; z-index: 5"
          :style="{ left: pct(c.elapsedMsTotal) + '%' }"
          @mouseenter="hoverMs = c.elapsedMsTotal"
        >
          <div class="flex flex-col items-center">
            <div class="marker-square" style="background: #10b981" />
            <span class="marker-label">💬</span>
          </div>
        </div>

        <!-- COMENTARIOS EXPERTO -->
        <div
          v-for="ec in expertComments"
          :key="'ec-' + ec.commentId"
          class="absolute cursor-pointer"
          style="bottom: 33%; z-index: 5"
          :style="{ left: pct(ec.elapsedMsTotal) + '%' }"
          @mouseenter="hoverMs = ec.elapsedMsTotal"
        >
          <div class="flex flex-col items-center">
            <div class="marker-square" style="background: #f472b6" />
            <span class="marker-label">🔍</span>
          </div>
        </div>

        <!-- OBSERVACIONES HEURÍSTICAS -->
        <div
          v-for="(obs, i) in observationsWithMs"
          :key="'obs-' + i"
          class="absolute cursor-pointer"
          style="top: 20%; z-index: 5"
          :style="{ left: pct(obs.ms) + '%' }"
          @mouseenter="hoverMs = obs.ms"
        >
          <div class="flex flex-col items-center">
            <div
              class="marker-triangle"
              :style="{ borderBottomColor: getSeverityColor(obs.severity) }"
            />
            <span class="marker-label">⚠️</span>
          </div>
        </div>

        <!-- ASPECTOS POSITIVOS -->
        <div
          v-for="(pos, i) in positivesWithMs"
          :key="'pos-' + i"
          class="absolute cursor-pointer"
          style="bottom: 20%; z-index: 5"
          :style="{ left: pct(pos.ms) + '%' }"
          @mouseenter="hoverMs = pos.ms"
        >
          <div class="flex flex-col items-center">
            <div class="marker-square" style="background: #22c55e" />
            <span class="marker-label">✅</span>
          </div>
        </div>

        <!-- HOVER TOOLTIP -->
        <div
          v-if="hoverMs !== null"
          class="absolute -top-7 -translate-x-1/2 bg-dark text-white text-caption rounded px-2 py-0.5 shadow-lg"
          style="font-size: 10px; z-index: 20"
          :style="{ left: pct(hoverMs) + '%' }"
        >
          {{ formatTimeMs(hoverMs) }}
        </div>
      </div>

      <!-- Info: conteo por categoría -->
      <div class="row q-gutter-md q-mt-sm text-caption text-grey-6">
        <span>{{ events.length }} eventos</span>
        <span>{{ emotionChanges.length }} cambios de emoción</span>
        <span>{{ observations.length }} observaciones</span>
        <span>{{ sentiments.length }} sentimientos</span>
        <span>{{ comments.length }} comentarios</span>
        <span>{{ expertComments.length }} comentarios experto</span>
        <span>{{ positiveAspects.length }} positivos</span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  SEVERITY_COLORS,
  getEmotionLabel as getEmotionLabelDict,
  EMOTION_EMOJIS,
} from '@/data/heuristicFindingsDictionary'

const props = defineProps<{
  durationMs: number
  currentTimeMs: number
  events: any[]
  emotionChanges: any[]
  comments: any[]
  sentiments: any[]
  expertComments: any[]
  observations: any[]
  positiveAspects: any[]
  loadingNodes: boolean
  progresoPct: number
  getNodeName: (id: string) => string
  getNodeType: (id: string) => string
  getNodeIdFromEvent: (ev: any) => string
  getEmotionMs: (em: any) => number
  getEmotionLabel: (em: any) => string
}>()

const emit = defineEmits<{        
  (e: 'seek', ms: number): void
  (e: 'edit-comment', ms: number, comment: any): void
  (e: 'edit-expert-comment', ms: number, comment: any): void
}>()

// ============================================================
// ESTADO
// ============================================================
const timelineBarEl = ref<HTMLDivElement | null>(null)
const hoverMs = ref<number | null>(null)

// ============================================================
// COMPUTED: Observaciones y positivos con su ms aproximado
// ============================================================
const observationsWithMs = computed(() => {
  return props.observations.map(obs => ({
    ...obs,
    ms: estimateMsFromCreatedAt(obs.createdAt),
  }))
})

const positivesWithMs = computed(() => {
  return props.positiveAspects.map(pos => ({
    ...pos,
    ms: estimateMsFromCreatedAt(pos.createdAt),
  }))
})

// ============================================================
// HELPERS
// ============================================================
function pct(ms: number): number {
  if (!props.durationMs) return 0
  return Math.min(100, Math.max(0, (ms / props.durationMs) * 100))
}

function onTimelineClick(e: MouseEvent) {
  if (!timelineBarEl.value || !props.durationMs) return
  const rect = timelineBarEl.value.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  emit('seek', ratio * props.durationMs)
}

function onTimelineHover(e: MouseEvent) {
  if (!timelineBarEl.value || !props.durationMs) return
  const rect = timelineBarEl.value.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  hoverMs.value = ratio * props.durationMs
}

function formatTimeMs(ms: number): string {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function getEmotionEmoji(em: any): string {
  const emotion = em?.dominantEmotion || em?.emotion || 'neutral'
  return EMOTION_EMOJIS[emotion.toLowerCase()] || '😐'
}

function getSeverityColor(severity: number): string {
  const map: Record<number, string> = {
    1: '#4caf50',
    2: '#2196f3',
    3: '#ffc107',
    4: '#ff9800',
    5: '#f44336',
  }
  return map[severity] || '#ffc107'
}

/**
 * Estima el ms aproximado de una observación a partir de su createdAt.
 * Como las observaciones se crean "en vivo" durante la sesión, aproximamos
 * por la diferencia entre createdAt y startedAt de la sesión.
 */
function estimateMsFromCreatedAt(createdAt: string): number {
  // No tenemos startedAt aquí, así que devolvemos 0 si no podemos estimar
  // En el futuro: pasar startedAt al composable
  return 0
}

</script>

<style scoped>
.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 4px;
}

.legend-square {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 4px;
}

.marker-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.marker-square {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.marker-triangle {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 8px solid;
}

.marker-label {
  font-size: 6px;
  color: #94a3b8;
  margin-top: 1px;
  white-space: nowrap;
}

/* Necesitamos Tailwind aquí por las clases inline */
.relative {
  position: relative;
}
.absolute {
  position: absolute;
}
.inset-y-0 {
  top: 0;
  bottom: 0;
}
.left-0 {
  left: 0;
}
.top-1 {
  top: 0.25rem;
}
.bottom-1 {
  bottom: 0.25rem;
}
.bg-primary\/20 {
  background-color: rgba(30, 58, 138, 0.2);
}
.bg-primary {
  background-color: #1e3a8a;
}
.bg-grey-3 {
  background-color: #e5e7eb;
}
.bg-dark {
  background-color: #1f2937;
}
.text-white {
  color: #ffffff;
}
.text-caption {
  font-size: 0.75rem;
}
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
</style>