<!-- components/experto/EmotionList.vue -->
<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle2 text-dark">😊 Análisis de emociones</div>
        <q-badge color="orange" rounded class="q-ml-sm">{{ readings.length }}</q-badge>
        <q-space />
        <q-btn
          dense
          flat
          size="sm"
          :label="showAll ? 'Ocultar' : 'Ver todas'"
          @click="showAll = !showAll"
        />
      </div>

      <div v-if="!readings.length" class="text-center text-caption text-grey-6 q-py-md">
        No hay lecturas de emociones disponibles
      </div>

      <div
        v-for="(r, index) in displayedReadings"
        :key="r.readingId || index"
        class="q-px-sm q-py-xs q-mb-xs bg-grey-1 rounded cursor-pointer"
        @click="$emit('seek', r.elapsedMsTotal)"
      >
        <!-- Fila principal -->
        <div class="row items-center">
          <span class="font-mono text-caption text-grey-7" style="min-width:50px;">
            {{ formatTiempoS(r.elapsedMsTotal) }}
          </span>

          <q-chip
            :color="getEmotionColor(r.dominantEmotion)"
            text-color="white"
            size="sm"
            dense
          >
            {{ getEmotionEmoji(r.dominantEmotion) }}
            {{ getEmotionLabel(r.dominantEmotion) }}
          </q-chip>

          <span class="text-caption text-grey-6 q-ml-sm">
            {{ getDominantScore(r) }}%
          </span>

          <q-space />

          <q-btn
            dense
            flat
            size="sm"
            icon="add_alert"
            color="primary"
            @click.stop="openFindingFromEmotion(r)"
          >
            <q-tooltip>Registrar hallazgo</q-tooltip>
          </q-btn>

          <q-btn
            dense
            flat
            size="sm"
            icon="info"
            class="text-grey-6"
            @click.stop="toggleDetail(r)"
          />
        </div>

        <!-- Vista completa de scores (TODAS las clases con %) -->
        <div v-if="expandedId === (r.readingId || index)" class="q-mt-xs q-pa-xs bg-white rounded">
          <div class="text-caption text-grey-7 q-mb-xs">
            Distribución completa de emociones:
          </div>

          <div class="q-gutter-y-xs">
            <div v-for="score in getEmotionScores(r)" :key="score.emotion">
              <div class="row items-center justify-between">
                <span class="text-caption">
                  {{ score.emoji }} {{ score.label }}
                </span>
                <span class="text-caption text-weight-bold">{{ score.value }}%</span>
              </div>
              <q-linear-progress
                :value="score.value / 100"
                :color="score.color"
                track-color="grey-3"
                size="6px"
                rounded
              />
            </div>
          </div>

          <div class="text-caption text-grey-6 q-mt-xs">
            Timestamp: {{ formatDate(r.timestampReal) }}
          </div>

          <div class="q-mt-xs text-right">
            <q-btn
              color="primary"
              icon="add_alert"
              label="Registrar Hallazgo"
              size="sm"
              flat
              @click.stop="openFindingFromEmotion(r)"
            />
          </div>
        </div>
      </div>

      <!-- Modal rápido -->
      <FindingsQuickForm
        v-model="showFindingForm"
        :ms="selectedReading?.elapsedMsTotal || 0"
        :evaluation-id="evaluationId"
        :session-id="sessionId"
        :task-id="taskId"
        :emotion-label="getEmotionLabel(selectedReading?.dominantEmotion)"
        :nearest-comment="getNearestComment(selectedReading?.elapsedMsTotal || 0)"
        @save="$emit('create-finding', $event)"
        @close="showFindingForm = false"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EmotionReading } from '@/types/evaluation'
import FindingsQuickForm from '@/components/findings/FindingsQuickForm.vue'
import {
  getEmotionTemplate,
  getEmotionColor as getColor,
  normalizeScore,
} from '@/types/expert/findings.dictionary'

const props = defineProps<{
  readings: EmotionReading[]
  evaluationId: string
  sessionId: string
  taskId?: string
  taskName?: string
  getNearestComment?: (ms: number) => any
}>()

const emit = defineEmits<{
  (e: 'seek', ms: number): void
  (e: 'create-finding', data: any): void
}>()

const showAll = ref(false)
const expandedId = ref<string | null>(null)
const showFindingForm = ref(false)
const selectedReading = ref<EmotionReading | null>(null)

const displayedReadings = computed(() => {
  if (showAll.value) return props.readings
  return props.readings.slice(0, 8)
})

function getEmotionLabel(emotion: string | null | undefined): string {
  if (!emotion) return 'Neutral'
  return getEmotionTemplate(emotion).labelEs
}

function getEmotionEmoji(emotion: string | null | undefined): string {
  if (!emotion) return '😐'
  return getEmotionTemplate(emotion).emoji
}

function getEmotionColor(emotion: string | null | undefined): string {
  if (!emotion) return 'grey'
  return getColor(emotion)
}

function getDominantScore(reading: EmotionReading): number {
  if (!reading.scoresJson || !reading.dominantEmotion) return 0
  const score = reading.scoresJson[reading.dominantEmotion] || 0
  return normalizeScore(score)
}

function getEmotionScores(reading: EmotionReading) {
  if (!reading.scoresJson) return []
  return Object.entries(reading.scoresJson)
    .map(([emotion, score]) => {
      const tpl = getEmotionTemplate(emotion)
      return {
        emotion,
        label: tpl.labelEs,
        emoji: tpl.emoji,
        color: tpl.color,
        value: normalizeScore(score),
        
      }
    })
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
}

function toggleDetail(r: EmotionReading) {
  const id = r.readingId || String(r.elapsedMsTotal)
  expandedId.value = expandedId.value === id ? null : id
}

function openFindingFromEmotion(r: EmotionReading) {
  selectedReading.value = r
  showFindingForm.value = true
}

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function formatDate(iso: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-BO', {
      dateStyle: 'short',
      timeStyle: 'medium',
    })
  } catch {
    return '—'
  }
}
</script>