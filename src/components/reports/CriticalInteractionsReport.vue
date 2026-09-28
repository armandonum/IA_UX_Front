<template>
  <div>
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando reporte...</div>
    </div>

    <div v-else-if="!data.length" class="text-center q-py-xl">
      <q-icon name="warning" size="48px" color="grey-5" />
      <div class="text-grey-7 q-mt-sm">No hay interacciones críticas detectadas</div>
      <div class="text-caption text-grey-6 q-mt-xs">
        Se consideran críticas: severidad alta/crítica, emociones negativas fuertes, sentimientos negativos o recurrencia ≥ 3
      </div>
    </div>

    <q-card v-else flat bordered>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h6 text-weight-bold">
              ⚠️ Interacciones Críticas
            </div>
            <div class="text-caption text-grey-7">
              Hallazgos de máxima prioridad que requieren atención inmediata
            </div>
          </div>

          <q-btn
            color="primary"
            icon="download"
            label="Exportar a Excel"
            @click="exportToExcel"
          />
        </div>

        <!-- Resumen por razón -->
        <div class="row q-col-gutter-md q-mb-md">
          <div
            v-for="(count, reason) in reasonBreakdown"
            :key="reason"
            class="col-6 col-md-3"
          >
            <q-card flat bordered class="text-center q-pa-md">
              <div class="text-h5 text-weight-bold" :class="`text-${getReasonColor(reason)}`">
                {{ count }}
              </div>
              <div class="text-caption text-grey-7">{{ reason }}</div>
            </q-card>
          </div>
        </div>

        <!-- Tabla -->
        <q-markup-table flat bordered dense>
          <thead>
            <tr>
              <th class="text-left">Descripción</th>
              <th class="text-center">Severidad</th>
              <th class="text-center">Emoción</th>
              <th class="text-center">Sentimiento</th>
              <th class="text-center">Frecuencia</th>
              <th class="text-left">Pantalla</th>
              <th class="text-left">Razón de criticidad</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data" :key="row.finding_id">
              <td style="max-width: 320px;">
                <div class="text-caption">{{ row.description }}</div>
              </td>
              <td class="text-center">
                <q-badge :color="getSeverityColor(row.severity)" text-color="white">
                  {{ getSeverityLabel(row.severity) }}
                </q-badge>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="row.emotion_inferred"
                  color="orange"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ formatEmotion(row.emotion_inferred) }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="row.textual_sentiment"
                  color="purple"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.textual_sentiment }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-badge color="blue-grey" outline>{{ row.frequency }}×</q-badge>
              </td>
              <td class="text-left ellipsis" style="max-width: 180px;">
                {{ row.screen_name || row.node_id || '—' }}
              </td>
              <td>
                <q-chip
                  :color="getReasonColor(row.criticality_reason)"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.criticality_reason }}
                </q-chip>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as XLSX from 'xlsx'
import type { CriticalInteractionRow } from '@/api/reports.api'
import { getEmotionTemplate } from '@/types/expert/findings.dictionary'

const props = defineProps<{
  data: CriticalInteractionRow[]
  loading: boolean
}>()

const reasonBreakdown = computed(() => {
  const map: Record<string, number> = {}
  props.data.forEach((r) => {
    const key = r.criticality_reason || 'Otro'
    map[key] = (map[key] || 0) + 1
  })
  return map
})

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'negative',
    high: 'deep-orange',
    medium: 'warning',
    low: 'info',
  }
  return colors[severity] || 'grey'
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
  }
  return labels[severity] || severity
}

function formatEmotion(emotion: string | null): string {
  if (!emotion) return '—'
  const tpl = getEmotionTemplate(emotion)
  return `${tpl.emoji} ${tpl.labelEs}`
}

function getReasonColor(reason: string): string {
  if (reason.includes('Severidad')) return 'negative'
  if (reason.includes('Emoción')) return 'deep-orange'
  if (reason.includes('Sentimiento')) return 'purple'
  if (reason.includes('Recurrencia')) return 'warning'
  return 'grey'
}

function exportToExcel() {
  const rows = props.data.map((r) => ({
    'Descripción': r.description,
    'Severidad': getSeverityLabel(r.severity),
    'Emoción': r.emotion_inferred ? formatEmotion(r.emotion_inferred) : '—',
    'Sentimiento': r.textual_sentiment || '—',
    'Frecuencia': r.frequency,
    'Pantalla': r.screen_name || r.node_id || '—',
    'Razón de Criticidad': r.criticality_reason,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 50 }, { wch: 12 }, { wch: 18 }, { wch: 20 },
    { wch: 12 }, { wch: 25 }, { wch: 28 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Interacciones Críticas')
  XLSX.writeFile(
    wb,
    `Interacciones_Criticas_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}
</script>

<style scoped>
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>