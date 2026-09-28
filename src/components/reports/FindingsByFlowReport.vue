<template>
  <div>
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando reporte...</div>
    </div>

    <div v-else-if="!data.length" class="text-center q-py-xl">
      <q-icon name="route" size="48px" color="grey-5" />
      <div class="text-grey-7 q-mt-sm">No hay flujos registrados</div>
      <div class="text-caption text-grey-6 q-mt-xs">
        Los flujos ideales deben estar definidos en el proyecto
      </div>
    </div>

    <q-card v-else flat bordered>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h6 text-weight-bold">
              🛤️ Hallazgos por Flujo del Prototipo
            </div>
            <div class="text-caption text-grey-7">
              Análisis de flujos ideales vs hallazgos encontrados
            </div>
          </div>

          <q-btn
            color="primary"
            icon="download"
            label="Exportar a Excel"
            @click="exportToExcel"
          />
        </div>

        <q-markup-table flat bordered dense>
          <thead>
            <tr>
              <th class="text-left">Flujo</th>
              <th class="text-left">Tarea</th>
              <th class="text-center">Sesiones</th>
              <th class="text-center">Hallazgos</th>
              <th class="text-center">🔴 Críticos</th>
              <th class="text-center">✅ % Completado</th>
              <th class="text-center">⏱️ Tiempo prom.</th>
              <th class="text-center">❌ Fallos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data" :key="row.flow_id">
              <td class="ellipsis" style="max-width: 220px;">
                <q-icon name="route" size="14px" class="q-mr-xs text-primary" />
                {{ row.flow_name }}
              </td>
              <td class="ellipsis" style="max-width: 220px;">
                {{ row.task_title || '—' }}
              </td>
              <td class="text-center">
                <q-badge color="blue-grey" outline>
                  {{ row.sessions_evaluated || 0 }}
                </q-badge>
              </td>
              <td class="text-center">
                <q-badge
                  :color="Number(row.total_findings) > 0 ? 'primary' : 'grey-5'"
                  text-color="white"
                >
                  {{ row.total_findings || 0 }}
                </q-badge>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.critical_findings) > 0"
                  color="negative"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.critical_findings }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <div class="row items-center justify-center q-gutter-xs">
                  <q-circular-progress
                    :value="Number(row.completion_rate) || 0"
                    size="32px"
                    :thickness="0.25"
                    :color="getCompletionColor(Number(row.completion_rate))"
                    track-color="grey-3"
                    show-value
                    font-size="9px"
                  />
                </div>
              </td>
              <td class="text-center">
                <q-chip color="blue-grey" outline dense size="sm">
                  {{ row.avg_time_sec || 0 }}s
                </q-chip>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.total_failures) > 0"
                  color="deep-orange"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.total_failures }}
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
import * as XLSX from 'xlsx'
import type { FindingsByFlowRow } from '@/api/reports.api'

const props = defineProps<{
  data: FindingsByFlowRow[]
  loading: boolean
}>()

function getCompletionColor(rate: number): string {
  if (rate >= 80) return 'positive'
  if (rate >= 50) return 'warning'
  return 'negative'
}

function exportToExcel() {
  const rows = props.data.map((r) => ({
    'Flujo': r.flow_name,
    'Tarea': r.task_title || '—',
    'Sesiones Evaluadas': r.sessions_evaluated || 0,
    'Total Hallazgos': r.total_findings || 0,
    'Hallazgos Críticos': r.critical_findings || 0,
    '% Completado': `${r.completion_rate || 0}%`,
    'Tiempo Promedio (s)': r.avg_time_sec || 0,
    'Fallos': r.total_failures || 0,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 35 }, { wch: 35 }, { wch: 18 }, { wch: 16 },
    { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 10 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Por Flujo')
  XLSX.writeFile(
    wb,
    `Hallazgos_Por_Flujo_${new Date().toISOString().slice(0, 10)}.xlsx`,
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