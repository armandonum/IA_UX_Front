<!-- components/experto/Timeline.vue -->

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-mb-xs">
        <div class="text-subtitle2 text-dark">Línea de tiempo</div>
        <div class="col" />
        <div class="row q-gutter-x-sm text-caption text-grey-6">
          <span>
            <span class="inline-block" style="width:10px;height:10px;border-radius:50%;background:#3B82F6;vertical-align:middle;margin-right:4px;"></span>
            Eventos
          </span>
          <span>
            <span class="inline-block" style="width:10px;height:10px;border-radius:50%;background:#F59E0B;vertical-align:middle;margin-right:4px;"></span>
            Emociones
          </span>
          <span>
            <span class="inline-block" style="width:10px;height:10px;border-radius:2px;background:#10B981;vertical-align:middle;margin-right:4px;"></span>
            Comentarios
          </span>
          <span>
            <span class="inline-block" style="width:10px;height:10px;border-radius:2px;background:#8B5CF6;vertical-align:middle;margin-right:4px;"></span>
            Sentimientos
          </span>
          <span>
            <span class="inline-block" style="width:10px;height:10px;border-radius:2px;background:#F472B6;vertical-align:middle;margin-right:4px;"></span>
            Experto
          </span>
        </div>
      </div>

      <div
        ref="timelineBarEl"
        class="relative bg-grey-3 rounded cursor-pointer select-none"
        style="height:80px;"
        @click="onTimelineClick"
        @mousemove="onTimelineHover"
        @mouseleave="hoverMs = null; cerrarTodosTooltips()"
      >
        <!-- Progreso -->
        <div
          class="absolute inset-y-0 left-0 bg-primary/20 rounded"
          :style="{ width: progresoPct + '%' }"
        />

        <!-- Playhead -->
        <div
          class="absolute inset-y-0 bg-primary"
          style="width:2px; z-index:10;"
          :style="{ left: progresoPct + '%' }"
        />
        <div
          class="absolute w-3 h-3 rounded-full bg-primary -ml-1.5 -mt-1.5"
          style="top:50%; z-index:11;"
          :style="{ left: progresoPct + '%' }"
        />

        <!-- Eventos -->
        <div
          v-for="ev in events"
          :key="'ev-' + ev.event_id"
          class="absolute top-1 cursor-pointer group"
          style="z-index:5;"
          :style="{ left: pct(ev.elapsed_ms_total) + '%' }"
          @mouseenter="abrirTooltip('event', ev.event_id)"
          @mouseleave="cerrarTooltip('event', ev.event_id)"
        >
          <div class="flex flex-col items-center">
            <div 
              class="rounded-full hover:scale-150 transition-transform"
              style="width:8px;height:8px;background:#3B82F6;"
            />
            <span class="text-[6px] text-grey-6 mt-0.5 whitespace-nowrap">E</span>
          </div>
          <!-- Tooltip flotante -->
          <div 
            v-if="expandedItems['event-' + ev.event_id]"
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-grey-3 p-2 w-48 z-20"
            @click.stop
            @mouseenter="cancelarCierre('event-' + ev.event_id)"
            @mouseleave="cerrarTooltip('event', ev.event_id)"
          >
            <div class="text-xs font-semibold text-dark">{{ ev.event_type }}</div>
            <div class="text-[10px] text-grey-6">{{ formatTiempoS(ev.elapsed_ms_total) }}</div>
            <div v-if="ev.screen_name" class="text-[10px] text-grey-6">📱 {{ ev.screen_name }}</div>
            <div v-if="getNodeIdFromEvent(ev)" class="text-[10px] text-primary font-mono">
              🏷️ {{ getNodeIdFromEvent(ev) }}
            </div>
            <q-btn
              dense
              flat
              size="sm"
              label="Saltar"
              class="q-mt-xs"
              @click.stop="$emit('seek', ev.elapsed_ms_total)"
            />
          </div>
        </div>

        <!-- Emociones -->
        <div
          v-for="(em, i) in emotionReadings"
          :key="'em-' + i"
          class="absolute bottom-1 cursor-pointer group"
          style="z-index:5;"
          :style="{ left: pct(getEmotionMs(em)) + '%' }"
          @mouseenter="abrirTooltip('emotion', i)"
          @mouseleave="cerrarTooltip('emotion', i)"
        >
          <div class="flex flex-col items-center">
            <div 
              class="rounded-full hover:scale-150 transition-transform"
              style="width:8px;height:8px;background:#F59E0B;"
            />
            <span class="text-[6px] text-grey-6 mt-0.5 whitespace-nowrap">😊</span>
          </div>
          <!-- Tooltip flotante -->
          <div 
            v-if="expandedItems['emotion-' + i]"
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-grey-3 p-2 w-48 z-20"
            @click.stop
            @mouseenter="cancelarCierre('emotion-' + i)"
            @mouseleave="cerrarTooltip('emotion', i)"
          >
            <div class="text-xs font-semibold text-dark">{{ getEmotionLabel(em) }}</div>
            <div class="text-[10px] text-grey-6">{{ formatTiempoS(getEmotionMs(em)) }}</div>
            <div v-if="em.scoresJson" class="text-[10px] text-grey-6">
              🎯 {{ sumScores(em.scoresJson) }}
            </div>
            <q-btn
              dense
              flat
              size="sm"
              label="Saltar"
              class="q-mt-xs"
              @click.stop="$emit('seek', getEmotionMs(em))"
            />
          </div>
        </div>

        <!-- Sentimientos -->
        <div
          v-for="s in sentiments"
          :key="'s-' + s.sentimentId"
          class="absolute top-1/3 cursor-pointer group"
          style="z-index:5;"
          :style="{ left: pct(s.elapsedMsTotal) + '%' }"
          @mouseenter="abrirTooltip('sentiment', s.sentimentId)"
          @mouseleave="cerrarTooltip('sentiment', s.sentimentId)"
        >
          <div class="flex flex-col items-center">
            <div 
              class="rounded-full hover:scale-150 transition-transform"
              style="width:8px;height:8px;background:#8B5CF6;"
            />
            <span class="text-[6px] text-grey-6 mt-0.5 whitespace-nowrap">🧠</span>
          </div>
          <!-- Tooltip flotante -->
          <div 
            v-if="expandedItems['sentiment-' + s.sentimentId]"
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-grey-3 p-2 w-48 z-20"
            @click.stop
            @mouseenter="cancelarCierre('sentiment-' + s.sentimentId)"
            @mouseleave="cerrarTooltip('sentiment', s.sentimentId)"
          >
            <div class="text-xs font-semibold text-dark">{{ s.uxLabel }}</div>
            <div class="text-[10px] text-grey-6">{{ formatTiempoS(s.elapsedMsTotal) }}</div>
            <div class="text-[10px] text-grey-6">📝 "{{ s.text }}"</div>
            <div class="text-[10px] text-grey-6">🎯 {{ (s.confidence * 100).toFixed(0) }}%</div>
            <q-btn
              dense
              flat
              size="sm"
              label="Saltar"
              class="q-mt-xs"
              @click.stop="$emit('seek', s.elapsedMsTotal)"
            />
          </div>
        </div>

        <!-- Comentarios de usuario -->
        <div
          v-for="c in comments"
          :key="'c-' + c.commentId"
          class="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
          style="z-index:5;"
          :style="{ left: pct(c.elapsedMsTotal) + '%' }"
          @mouseenter="abrirTooltip('comment', c.commentId)"
          @mouseleave="cerrarTooltip('comment', c.commentId)"
        >
          <div class="flex flex-col items-center">
            <div 
              class="hover:scale-150 transition-transform"
              style="width:10px;height:10px;background:#10B981;transform:rotate(45deg);"
            />
            <span class="text-[6px] text-grey-6 mt-0.5 whitespace-nowrap">💬</span>
          </div>
          <!-- Tooltip flotante -->
          <div 
            v-if="expandedItems['comment-' + c.commentId]"
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-grey-3 p-2 w-48 z-20"
            @click.stop
            @mouseenter="cancelarCierre('comment-' + c.commentId)"
            @mouseleave="cerrarTooltip('comment', c.commentId)"
          >
            <div class="text-xs font-semibold text-dark">Comentario</div>
            <div class="text-[10px] text-grey-6">{{ formatTiempoS(c.elapsedMsTotal) }}</div>
            <div class="text-[10px] text-grey-7">📝 "{{ c.text }}"</div>
            <div class="flex q-gutter-xs q-mt-xs">
              <q-btn
                dense
                flat
                size="sm"
                label="Saltar"
                @click.stop="$emit('seek', c.elapsedMsTotal)"
              />
              <q-btn
                dense
                flat
                size="sm"
                label="Ver mas"
                color="primary"
                @click.stop="$emit('edit-comment', c.elapsedMsTotal, c)"
              />
            </div>
          </div>
        </div>

        <!-- Comentarios de experto -->
        <div
          v-for="ec in expertComments"
          :key="'ec-' + ec.commentId"
          class="absolute bottom-1/3 cursor-pointer group"
          style="z-index:5;"
          :style="{ left: pct(ec.elapsedMsTotal) + '%' }"
          @mouseenter="abrirTooltip('expert', ec.commentId)"
          @mouseleave="cerrarTooltip('expert', ec.commentId)"
        >
          <div class="flex flex-col items-center">
            <div 
              class="hover:scale-150 transition-transform"
              style="width:10px;height:10px;background:#F472B6;border-radius:4px;"
            />
            <span class="text-[6px] text-grey-6 mt-0.5 whitespace-nowrap">🔍</span>
          </div>
          <!-- Tooltip flotante -->
          <div 
            v-if="expandedItems['expert-' + ec.commentId]"
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-grey-3 p-2 w-48 z-20"
            @click.stop
            @mouseenter="cancelarCierre('expert-' + ec.commentId)"
            @mouseleave="cerrarTooltip('expert', ec.commentId)"
          >
            <div class="text-xs font-semibold text-dark">{{ getExpertTypeLabel(ec.commentType) }}</div>
            <div class="text-[10px] text-grey-6">{{ formatTiempoS(ec.elapsedMsTotal) }}</div>
            <div class="text-[10px] text-grey-7">📝 "{{ ec.comment }}"</div>
            <div v-if="ec.severity" class="text-[10px] text-grey-6">
              ⚠️ Severidad: {{ ec.severity }}/5
            </div>
            <div class="flex q-gutter-xs q-mt-xs">
              <q-btn
                dense
                flat
                size="sm"
                label="Saltar"
                @click.stop="$emit('seek', ec.elapsedMsTotal)"
              />
              <q-btn
                dense
                flat
                size="sm"
                label="Editar"
                color="primary"
                @click.stop="$emit('edit-expert-comment', ec.elapsedMsTotal, ec)"
              />
            </div>
          </div>
        </div>

        <!-- Botón flotante para añadir comentario -->
        <div
          v-if="hoverMs !== null"
          class="absolute -top-8 -translate-x-1/2 bg-primary text-white text-caption rounded-full px-2 py-0.5 shadow-lg cursor-pointer hover:bg-primary-dark transition-colors"
          style="font-size:10px; z-index:20;"
          :style="{ left: pct(hoverMs) + '%' }"
          @click.stop="$emit('add-comment', hoverMs)"
        >
          + {{ formatTiempoS(hoverMs) }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const props = defineProps<{
  durationMs: number
  currentTimeMs: number
  events: any[]
  emotionReadings: any[]
  comments: any[]
  sentiments: any[]
  expertComments: any[]
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
  (e: 'add-comment', ms: number): void
  (e: 'edit-comment', ms: number, comment: any): void
  (e: 'add-expert-comment', ms: number): void
  (e: 'edit-expert-comment', ms: number, comment: any): void
}>()

// 🔥 Estado para elementos expandidos
const expandedItems = reactive<Record<string, boolean>>({})
const timeouts = reactive<Record<string, ReturnType<typeof setTimeout>>>({})

function cerrarTodosTooltips() {
  for (const key in expandedItems) {
    expandedItems[key] = false
  }
}

function abrirTooltip(type: string, id: any) {
  const key = `${type}-${id}`
  
  // Limpiar timeout pendiente
  if (timeouts[key]) {
    clearTimeout(timeouts[key])
    delete timeouts[key]
  }
  
  // Cerrar otros del mismo tipo
  for (const k in expandedItems) {
    if (k.startsWith(type + '-') && k !== key) {
      expandedItems[k] = false
    }
  }
  
  expandedItems[key] = true
}

function cerrarTooltip(type: string, id: any) {
  const key = `${type}-${id}`
  
  // Pequeño delay para permitir mover el mouse al tooltip
  timeouts[key] = setTimeout(() => {
    expandedItems[key] = false
    delete timeouts[key]
  }, 100)
}

function cancelarCierre(key: string) {
  if (timeouts[key]) {
    clearTimeout(timeouts[key])
    delete timeouts[key]
  }
}

function getExpertTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    observation: '👀 Observación',
    problem: '🐛 Problema',
    recommendation: '💡 Recomendación',
    positive: '✅ Positivo',
    question: '❓ Pregunta',
  }
  return labels[type] || type
}

const timelineBarEl = ref<HTMLDivElement | null>(null)
const hoverMs = ref<number | null>(null)

function pct(ms: number) {
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

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function sumScores(scores: Record<string, number> | null | undefined): number {
  if (!scores) return 0
  return Object.values(scores).reduce((a: number, b: number) => a + b, 0)
}
</script>

<style scoped>
/* Animación para los tooltips */
.z-20 {
  z-index: 20;
}

/* Sombra para los tooltips */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Transiciones suaves */
.transition-transform {
  transition: transform 0.15s ease;
}

.hover\:scale-150:hover {
  transform: scale(1.5);
}
</style>