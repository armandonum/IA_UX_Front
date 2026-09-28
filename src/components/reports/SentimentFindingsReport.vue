<template>
  <div>
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando reporte...</div>
    </div>

    <div v-else-if="!data.length" class="text-center q-py-xl">
      <q-icon name="psychology" size="48px" color="grey-5" />
      <div class="text-grey-7 q-mt-sm">No hay sentimientos registrados</div>
    </div>

    <q-card v-else flat bordered>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h6 text-weight-bold">
              💬 Sentimientos y Comentarios del Usuario
            </div>
            <div class="text-caption text-grey-7">
              Comentarios analizados y su hallazgo vinculado
            </div>
          </div>

          <q-btn
            color="primary"
            icon="download"
            label="Exportar a Excel"
            @click="exportToExcel"
          />
        </div>

        <!-- Filtros -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="filterSentiment"
              :options="availableSentiments"
              label="Filtrar por sentimiento"
              outlined
              dense
              clearable
            />
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="filterTopic"
              :options="availableTopics"
              label="Filtrar por tema UX"
              outlined
              dense
              clearable
            />
          </div>
          <div class="col-12 col-md-4">
            <q-toggle
              v-model="onlyWithFinding"
              label="Solo con hallazgo vinculado"
              color="primary"
            />
          </div>
        </div>

        <!-- Tabla -->
        <q-markup-table flat bordered dense>
          <thead>
            <tr>
              <th class="text-left">Comentario del usuario</th>
              <th class="text-center">Sentimiento</th>
              <th class="text-center">Confianza</th>
              <th class="text-center">Tema UX</th>
              <th class="text-center">Hallazgo vinculado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredData" :key="row.sentiment_id">
              <td style="max-width: 380px;">
                <div class="text-caption">"{{ row.user_comment }}"</div>
              </td>
              <td class="text-center">
                <q-chip
                  :color="getSentimentColor(row.sentiment_label)"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.sentiment_label }}
                </q-chip>
              </td>
              <td class="text-center">
                <q-badge color="blue-grey" outline>
                  {{ (row.confidence * 100).toFixed(0) }}%
                </q-badge>
              </td>
              <td class="text-center">
                <q-badge color="info" outline>{{ row.ux_topic }}</q-badge>
              </td>
              <td class="text-center">
                <div v-if="row.finding_id" class="column items-center q-gutter-xs">
                  <q-chip
                    :color="getSeverityColor(row.finding_severity || 'medium')"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    {{ shortId(row.finding_id) }}
                  </q-chip>
                  <div class="text-caption text-grey-6 ellipsis" style="max-width: 200px;">
                    {{ row.finding_description }}
                  </div>
                </div>
                <span v-else class="text-grey-5 text-caption">Sin vincular</span>
              </td>
            </tr>
          </tbody>
        </q-markup-table>

        <div class="row q-mt-md justify-between items-center">
          <div class="text-caption text-grey-6">
            {{ filteredData.length }} de {{ data.length }} resultados
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import type { SentimentWithFindingRow } from '@/api/reports.api'

const props = defineProps<{
  data: SentimentWithFindingRow[]
  loading: boolean
}>()

const filterSentiment = ref<string | null>(null)
const filterTopic = ref<string | null>(null)
const onlyWithFinding = ref(false)

const availableSentiments = computed(() => {
  const set = new Set(props.data.map((r) => r.sentiment_label))
  return Array.from(set).sort()
})

const availableTopics = computed(() => {
  const set = new Set(props.data.map((r) => r.ux_topic))
  return Array.from(set).sort()
})

const filteredData = computed(() => {
  return props.data.filter((row) => {
    if (filterSentiment.value && row.sentiment_label !== filterSentiment.value) return false
    if (filterTopic.value && row.ux_topic !== filterTopic.value) return false
    if (onlyWithFinding.value && !row.finding_id) return false
    return true
  })
})

function getSentimentColor(label: string): string {
  const colors: Record<string, string> = {
    'Confusión': 'orange',
    'Frustración': 'red',
    'Satisfacción': 'green',
    'Desconfianza': 'grey-7',
    'Dificultad / esfuerzo': 'deep-orange',
    'Rechazo': 'red-9',
    'Interés / motivación': 'blue',
    'Aburrimiento': 'brown',
    'Sorpresa': 'amber',
    'Alivio': 'teal',
  }
  return colors[label] || 'primary'
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'negative',
    high: 'deep-orange',
    medium: 'warning',
    low: 'info',
  }
  return colors[severity] || 'grey'
}

function shortId(id: string): string {
  return `H-${id.substring(0, 4).toUpperCase()}`
}

function exportToExcel() {
  const rows = filteredData.value.map((r) => ({
    'Comentario del usuario': r.user_comment,
    'Sentimiento': r.sentiment_label,
    'Confianza': `${(r.confidence * 100).toFixed(0)}%`,
    'Tema UX': r.ux_topic,
    'Hallazgo ID': r.finding_id ? shortId(r.finding_id) : '—',
    'Descripción hallazgo': r.finding_description || '—',
    'Severidad hallazgo': r.finding_severity || '—',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 50 }, { wch: 22 }, { wch: 12 }, { wch: 22 },
    { wch: 14 }, { wch: 50 }, { wch: 14 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sentimientos + Hallazgos')
  XLSX.writeFile(
    wb,
    `Sentimientos_Hallazgos_${new Date().toISOString().slice(0, 10)}.xlsx`,
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