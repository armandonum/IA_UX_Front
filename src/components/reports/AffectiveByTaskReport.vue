<template>
  <div>
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando reporte...</div>
    </div>

    <div v-else-if="!data.length" class="text-center q-py-xl">
      <q-icon name="sentiment_satisfied" size="48px" color="grey-5" />
      <div class="text-grey-7 q-mt-sm">No hay datos afectivos por tarea</div>
    </div>

    <q-card v-else flat bordered>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h6 text-weight-bold">
              😊 Análisis Afectivo-Emocional por Tarea
            </div>
            <div class="text-caption text-grey-7">
              Emociones y sentimientos detectados en cada tarea
            </div>
          </div>

          <q-btn
            color="primary"
            icon="download"
            label="Exportar a Excel"
            @click="exportToExcel"
          />
        </div>

        <!-- Lista de tareas con análisis -->
        <div class="q-gutter-y-md">
          <q-card
            v-for="task in data"
            :key="task.task_id"
            flat
            bordered
          >
            <q-card-section>
              <!-- Header de tarea -->
              <div class="row items-center q-mb-md">
                <q-avatar color="primary" text-color="white" size="32px">
                  {{ task.order_index }}
                </q-avatar>
                <div class="col q-ml-md">
                  <div class="text-subtitle1 text-weight-bold">
                    {{ task.task_title }}
                  </div>
                  <div v-if="task.task_description" class="text-caption text-grey-6">
                    {{ task.task_description }}
                  </div>
                </div>
                <q-chip color="blue-grey" text-color="white" dense>
                  {{ task.sessions_count }} sesiones
                </q-chip>
              </div>

              <q-separator class="q-mb-md" />

              <div class="row q-col-gutter-md">
                <!-- Emociones -->
                <div class="col-12 col-md-6">
                  <div class="text-caption text-grey-7 q-mb-xs">
                    🎭 Emociones detectadas
                  </div>

                  <div v-if="task.emotions_breakdown && Object.keys(task.emotions_breakdown).length">
                    <div
                      v-for="(count, emotion) in task.emotions_breakdown"
                      :key="emotion"
                      class="q-mb-xs"
                    >
                      <div class="row items-center justify-between">
                        <div class="text-caption">
                          {{ formatEmotion(emotion) }}
                        </div>
                        <div class="text-caption text-weight-bold">
                          {{ count }}
                        </div>
                      </div>
                      <q-linear-progress
                        :value="Number(count) / maxEmotionValue(task)"
                        :color="getEmotionColor(emotion)"
                        track-color="grey-3"
                        size="5px"
                        rounded
                      />
                    </div>
                  </div>
                  <div v-else class="text-caption text-grey-5">
                    Sin emociones registradas
                  </div>
                </div>

                <!-- Sentimientos -->
                <div class="col-12 col-md-6">
                  <div class="text-caption text-grey-7 q-mb-xs">
                    💬 Sentimientos detectados
                  </div>

                  <div v-if="task.sentiments_breakdown && Object.keys(task.sentiments_breakdown).length">
                    <div
                      v-for="(count, sentiment) in task.sentiments_breakdown"
                      :key="sentiment"
                      class="q-mb-xs"
                    >
                      <div class="row items-center justify-between">
                        <div class="text-caption">
                          {{ sentiment }}
                        </div>
                        <div class="text-caption text-weight-bold">
                          {{ count }}
                        </div>
                      </div>
                      <q-linear-progress
                        :value="Number(count) / maxSentimentValue(task)"
                        :color="getSentimentColor(sentiment)"
                        track-color="grey-3"
                        size="5px"
                        rounded
                      />
                    </div>
                  </div>
                  <div v-else class="text-caption text-grey-5">
                    Sin sentimientos registrados
                  </div>
                </div>
              </div>

              <!-- Comentarios asociados -->
              <div v-if="task.user_comments" class="q-mt-md">
                <div class="text-caption text-grey-7 q-mb-xs">
                  💭 Comentarios del usuario
                </div>
                <div class="bg-grey-1 q-pa-sm rounded-borders text-caption">
                  {{ task.user_comments }}
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import * as XLSX from 'xlsx'
import type { AffectiveByTaskRow } from '@/api/reports.api'
import {
  getEmotionTemplate,
  getEmotionColor as getEmotionColorRaw,
  getSentimentColor as getSentimentColorRaw,
} from '@/types/expert/findings.dictionary'

const props = defineProps<{
  data: AffectiveByTaskRow[]
  loading: boolean
}>()

function maxEmotionValue(task: AffectiveByTaskRow): number {
  if (!task.emotions_breakdown) return 1
  return Math.max(...Object.values(task.emotions_breakdown).map(Number), 1)
}

function maxSentimentValue(task: AffectiveByTaskRow): number {
  if (!task.sentiments_breakdown) return 1
  return Math.max(...Object.values(task.sentiments_breakdown).map(Number), 1)
}

function formatEmotion(emotion: string): string {
  const tpl = getEmotionTemplate(emotion)
  return `${tpl.emoji} ${tpl.labelEs}`
}

function getEmotionColor(emotion: string): string {
  const hex = getEmotionColorRaw(emotion)
  return mapHexToQuasar(hex)
}

function getSentimentColor(sentiment: string): string {
  const hex = getSentimentColorRaw(sentiment)
  return mapHexToQuasar(hex)
}

function mapHexToQuasar(hex: string): string {
  const map: Record<string, string> = {
    '#ef4444': 'negative',
    '#f59e0b': 'warning',
    '#22c55e': 'positive',
    '#64748b': 'grey-7',
    '#f97316': 'deep-orange',
    '#dc2626': 'negative',
    '#3b82f6': 'info',
    '#78716c': 'grey-8',
    '#14b8a6': 'teal',
    '#94a3b8': 'grey-6',
    '#6366f1': 'indigo',
    '#84cc16': 'light-green',
    '#7c3aed': 'purple',
    '#06b6d4': 'cyan',
  }
  return map[hex] || 'primary'
}

function exportToExcel() {
  const rows: any[] = []

  props.data.forEach((task) => {
    const emotions = task.emotions_breakdown || {}
    const sentiments = task.sentiments_breakdown || {}

    if (!Object.keys(emotions).length && !Object.keys(sentiments).length) {
      rows.push({
        'Tarea': task.task_title,
        'Orden': task.order_index,
        'Sesiones': task.sessions_count,
        'Tipo': '—',
        'Emoción/Sentimiento': '—',
        'Conteo': 0,
        'Comentarios': task.user_comments || '—',
      })
    } else {
      Object.entries(emotions).forEach(([emotion, count]) => {
        rows.push({
          'Tarea': task.task_title,
          'Orden': task.order_index,
          'Sesiones': task.sessions_count,
          'Tipo': 'Emoción',
          'Emoción/Sentimiento': formatEmotion(emotion),
          'Conteo': count,
          'Comentarios': task.user_comments || '—',
        })
      })

      Object.entries(sentiments).forEach(([sentiment, count]) => {
        rows.push({
          'Tarea': task.task_title,
          'Orden': task.order_index,
          'Sesiones': task.sessions_count,
          'Tipo': 'Sentimiento',
          'Emoción/Sentimiento': sentiment,
          'Conteo': count,
          'Comentarios': task.user_comments || '—',
        })
      })
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 40 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
    { wch: 25 }, { wch: 10 }, { wch: 60 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Afectivo por Tarea')
  XLSX.writeFile(
    wb,
    `Afectivo_Por_Tarea_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}
</script>