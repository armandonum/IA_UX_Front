<template>
  <div>
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando reporte...</div>
    </div>

    <div v-else-if="!data.length" class="text-center q-py-xl">
      <q-icon name="rate_review" size="48px" color="grey-5" />
      <div class="text-grey-7 q-mt-sm">No hay comentarios de expertos</div>
    </div>

    <q-card v-else flat bordered>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h6 text-weight-bold">
              🧠 Comentarios de Expertos Evaluadores
            </div>
            <div class="text-caption text-grey-7">
              Observaciones, problemas y recomendaciones de los evaluadores
            </div>
          </div>

          <q-btn
            color="primary"
            icon="download"
            label="Exportar a Excel"
            @click="exportToExcel"
          />
        </div>

        <!-- Resumen por tipo -->
        <div class="row q-col-gutter-md q-mb-md">
          <div
            v-for="(count, type) in typeBreakdown"
            :key="type"
            class="col-6 col-md-3"
          >
            <q-card flat bordered class="text-center q-pa-md">
              <div class="text-h5 text-weight-bold" :class="`text-${getCommentTypeColor(String(type))}`">
                {{ count }}
              </div>
              <div class="text-caption text-grey-7">
                {{ getCommentTypeLabel(String(type)) }}
              </div>
            </q-card>
          </div>
        </div>

        <!-- Tabla -->
        <q-markup-table flat bordered dense>
          <thead>
            <tr>
              <th class="text-left">Evaluador</th>
              <th class="text-center">Tipo</th>
              <th class="text-left">Comentario</th>
              <th class="text-left">Pantalla</th>
              <th class="text-center">Severidad</th>
              <th class="text-center">Hallazgos vinculados</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data" :key="row.comment_id">
              <td>
                <q-chip color="primary" outline dense>
                  {{ row.evaluator_name || 'Anónimo' }}
                </q-chip>
              </td>
              <td class="text-center">
                <q-badge
                  :color="getCommentTypeColor(row.comment_type)"
                  text-color="white"
                  outline
                >
                  {{ getCommentTypeLabel(row.comment_type) }}
                </q-badge>
              </td>
              <td style="max-width: 400px;">
                <div class="text-caption">{{ row.comment }}</div>
              </td>
              <td class="text-left ellipsis" style="max-width: 180px;">
                <span v-if="row.screen_name">{{ row.screen_name }}</span>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <div v-if="row.severity !== null && row.severity !== undefined">
                  <q-badge :color="getSeverityColor(row.severity)" text-color="white">
                    {{ getSeverityLabel(row.severity) }}
                  </q-badge>
                </div>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.linked_findings) > 0"
                  color="positive"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.linked_findings }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
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
import type { ExpertCommentRow } from '@/api/reports.api'

const props = defineProps<{
  data: ExpertCommentRow[]
  loading: boolean
}>()

const typeBreakdown = computed(() => {
  const map: Record<string, number> = {}
  props.data.forEach((r) => {
    map[r.comment_type] = (map[r.comment_type] || 0) + 1
  })
  return map
})

function getCommentTypeColor(type: string): string {
  const colors: Record<string, string> = {
    observation: 'blue-grey',
    problem: 'negative',
    recommendation: 'positive',
    positive: 'positive',
    question: 'info',
  }
  return colors[type] || 'grey'
}

function getCommentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    observation: 'Observación',
    problem: 'Problema',
    recommendation: 'Recomendación',
    positive: 'Positivo',
    question: 'Pregunta',
  }
  return labels[type] || type
}

function getSeverityColor(severity: number): string {
  if (severity >= 5) return 'negative'
  if (severity >= 4) return 'deep-orange'
  if (severity >= 3) return 'warning'
  if (severity >= 2) return 'info'
  return 'grey'
}

function getSeverityLabel(severity: number): string {
  if (severity >= 5) return 'Crítico'
  if (severity >= 4) return 'Alto'
  if (severity >= 3) return 'Medio'
  if (severity >= 2) return 'Bajo'
  return 'Info'
}

function exportToExcel() {
  const rows = props.data.map((r) => ({
    'Evaluador': r.evaluator_name || 'Anónimo',
    'Tipo': getCommentTypeLabel(r.comment_type),
    'Comentario': r.comment,
    'Pantalla': r.screen_name || '—',
    'Node ID': r.node_id || '—',
    'Severidad': r.severity !== null ? getSeverityLabel(r.severity) : '—',
    'Hallazgos vinculados': r.linked_findings || 0,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 22 }, { wch: 16 }, { wch: 60 }, { wch: 25 },
    { wch: 12 }, { wch: 12 }, { wch: 20 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Comentarios Expertos')
  XLSX.writeFile(
    wb,
    `Comentarios_Expertos_${new Date().toISOString().slice(0, 10)}.xlsx`,
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