<!-- components/experto/SentimentList.vue - Actualizado con botón de hallazgo -->
<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle2 text-dark">
          🧠 Análisis de sentimientos
        </div>
        <q-badge color="purple" rounded class="q-ml-sm">{{ sentiments.length }}</q-badge>
        <q-space />
        <q-btn
          dense
          flat
          size="sm"
          :label="showAll ? 'Ocultar' : 'Ver todos'"
          @click="showAll = !showAll"
        />
      </div>

      <div v-if="!sentiments.length" class="text-center text-caption text-grey-6 q-py-md">
        No hay análisis de sentimientos disponibles
      </div>

      <div
        v-for="(s, index) in displayedSentiments"
        :key="s.sentimentId"
        class="q-px-sm q-py-xs q-mb-xs bg-grey-1 rounded cursor-pointer"
        @click="$emit('seek', s.elapsedMsTotal)"
      >
        <div class="row items-center">
          <span class="font-mono text-caption text-grey-7" style="min-width:50px;">
            {{ formatTiempoS(s.elapsedMsTotal) }}
          </span>
          <q-chip
            :color="getSentimentColor(s.uxLabel)"
            text-color="white"
            size="sm"
            dense
          >
            {{ s.uxLabel }}
          </q-chip>
          <span class="text-caption text-dark col ellipsis q-ml-sm">
            "{{ s.text }}"
          </span>
          <span class="text-caption text-grey-6 q-ml-sm" style="min-width:45px;">
            {{ (s.confidence * 100).toFixed(0) }}%
          </span>
          <!-- 🔥 Botón para registrar hallazgo desde el sentimiento -->
          <q-btn
            dense
            flat
            size="sm"
            icon="add_alert"
            color="primary"
            class="q-ml-xs"
            @click.stop="openFindingFromSentiment(s)"
          />
          <q-btn
            dense
            flat
            size="sm"
            icon="info"
            class="text-grey-6"
            @click.stop="showDetail(s)"
          />
        </div>

        <!-- Detalle expandido -->
        <div v-if="expandedId === s.sentimentId" class="q-mt-xs q-pa-xs bg-white rounded">
          <div class="text-caption text-grey-6">Emoción original: {{ s.originalLabel }}</div>
          <div class="row q-col-gutter-xs q-mt-xs">
            <div
              v-for="(score, label) in s.scoresJson"
              :key="label"
              class="col-4"
            >
              <div class="text-[10px] text-grey-6">{{ label }}</div>
              <div class="bg-grey-2 rounded overflow-hidden" style="height:4px;">
                <div
                  class="h-full rounded"
                  :style="{
                    width: (score * 100) + '%',
                    backgroundColor: getSentimentColor(label)
                  }"
                />
              </div>
              <div class="text-[9px] font-mono">{{ (score * 100).toFixed(0) }}%</div>
            </div>
          </div>
          <!-- 🔥 Botón de hallazgo en el detalle -->
          <div class="q-mt-xs text-right">
            <q-btn
              color="primary"
              icon="add_alert"
              label="Registrar Hallazgo"
              size="sm"
              flat
              @click="openFindingFromSentiment(s)"
            />
          </div>
        </div>
      </div>

      <!-- Formulario rápido de hallazgo -->
      <FindingsQuickForm
        v-model="showFindingForm"
        :ms="selectedSentiment?.elapsedMsTotal || 0"
        :task-name="taskName"
        :evaluation-id="evaluationId"
        :session-id="sessionId"
        :task-id="taskId"
        :sentiment-label="selectedSentiment?.uxLabel" 
        :nearest-comment="getNearestComment(selectedSentiment?.elapsedMsTotal || 0)"
        @save="$emit('create-finding', $event)"
        @close="showFindingForm = false"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TextSentiment } from '@/api/text-sentiments.api'
import FindingsQuickForm from '@/components/findings/FindingsQuickForm.vue'

const props = defineProps<{
  sentiments: TextSentiment[]
  taskName?: string
  evaluationId: string
  sessionId: string
  taskId?: string
  comments?: any[]
  getNearestComment?: (ms: number) => any
}>()

const emit = defineEmits<{
  (e: 'seek', ms: number): void
  (e: 'create-finding', data: any): void
}>()

const showAll = ref(false)
const expandedId = ref<string | null>(null)
const showFindingForm = ref(false)
const selectedSentiment = ref<TextSentiment | null>(null)

const displayedSentiments = computed(() => {
  if (showAll.value) return props.sentiments
  return props.sentiments.slice(0, 5)
})

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function getSentimentColor(label: string): string {
  const colors: Record<string, string> = {
    'Confusión': 'orange',
    'Frustración': 'red',
    'Satisfacción': 'green',
    'Desconfianza': 'grey',
    'Dificultad / esfuerzo': 'orange',
    'Rechazo': 'red',
    'Interés / motivación': 'blue',
    'Aburrimiento': 'grey',
    'Sorpresa': 'yellow',
    'Alivio': 'green',
    'Neutral': 'grey',
  }
  return colors[label] || 'primary'
}

function showDetail(s: TextSentiment) {
  expandedId.value = expandedId.value === s.sentimentId ? null : s.sentimentId
}

function openFindingFromSentiment(s: TextSentiment) {
  selectedSentiment.value = s
  showFindingForm.value = true
}
</script>