<template>
  <div>
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando reporte...</div>
    </div>

    <div v-else-if="!data.length" class="text-center q-py-xl">
      <q-icon name="rule" size="48px" color="grey-5" />
      <div class="text-grey-7 q-mt-sm">No hay requerimientos con hallazgos</div>
      <div class="text-caption text-grey-6 q-mt-xs">
        Los hallazgos deben estar vinculados a tareas con requerimiento
      </div>
    </div>

    <q-card v-else flat bordered>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h6 text-weight-bold">
              📋 Hallazgos por Requerimiento
            </div>
            <div class="text-caption text-grey-7">
              Agrupación de hallazgos según el requerimiento funcional asociado
            </div>
          </div>

          <q-btn
            color="primary"
            icon="download"
            label="Exportar a Excel"
            @click="exportToExcel"
          />
        </div>

        <!-- Resumen visual -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-6 col-md-3">
            <q-card flat bordered class="text-center q-pa-md">
              <div class="text-h5 text-primary text-weight-bold">
                {{ data.length }}
              </div>
              <div class="text-caption text-grey-7">Requerimientos</div>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered class="text-center q-pa-md">
              <div class="text-h5 text-negative text-weight-bold">
                {{ totalCritical }}
              </div>
              <div class="text-caption text-grey-7">Críticos</div>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered class="text-center q-pa-md">
              <div class="text-h5 text-deep-orange text-weight-bold">
                {{ totalHigh }}
              </div>
              <div class="text-caption text-grey-7">Altos</div>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered class="text-center q-pa-md">
              <div class="text-h5 text-positive text-weight-bold">
                {{ totalResolved }}
              </div>
              <div class="text-caption text-grey-7">Resueltos</div>
            </q-card>
          </div>
        </div>

        <!-- Tabla -->
        <q-markup-table flat bordered dense>
          <thead>
            <tr>
              <th class="text-left">Código</th>
              <th class="text-left">Requerimiento</th>
              <th class="text-center">Total</th>
              <th class="text-center">🔴 Críticos</th>
              <th class="text-center">🟠 Altos</th>
              <th class="text-center">🟡 Medios</th>
              <th class="text-center">🟢 Bajos</th>
              <th class="text-center">✅ Resueltos</th>
              <th class="text-center">😤 Emociones neg.</th>
              <th class="text-center">💬 Sentim. neg.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data" :key="row.requirement_code">
              <td>
                <q-badge color="blue-grey" text-color="white" outline>
                  {{ row.requirement_code }}
                </q-badge>
              </td>
              <td class="ellipsis" style="max-width: 300px;">
                {{ row.requirement_title }}
              </td>
              <td class="text-center">
                <q-badge
                  :color="Number(row.total_findings) > 0 ? 'primary' : 'grey-5'"
                  text-color="white"
                >
                  {{ row.total_findings }}
                </q-badge>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.critical) > 0"
                  color="negative"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.critical }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.high) > 0"
                  color="deep-orange"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.high }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.medium) > 0"
                  color="warning"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.medium }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.low) > 0"
                  color="info"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.low }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.resolved) > 0"
                  color="positive"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.resolved }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.negative_emotions) > 0"
                  color="orange"
                  text-color="white"
                  dense
                  size="sm"
                >
                  😤 {{ row.negative_emotions }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.negative_sentiments) > 0"
                  color="purple"
                  text-color="white"
                  dense
                  size="sm"
                >
                  💬 {{ row.negative_sentiments }}
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
import type { FindingsByRequirementRow } from '@/api/reports.api'

const props = defineProps<{
  data: FindingsByRequirementRow[]
  loading: boolean
}>()

const totalCritical = computed(() =>
  props.data.reduce((sum, r) => sum + Number(r.critical || 0), 0),
)
const totalHigh = computed(() =>
  props.data.reduce((sum, r) => sum + Number(r.high || 0), 0),
)
const totalResolved = computed(() =>
  props.data.reduce((sum, r) => sum + Number(r.resolved || 0), 0),
)

function exportToExcel() {
  const rows = props.data.map((r) => ({
    'Código': r.requirement_code,
    'Requerimiento': r.requirement_title,
    'Total Hallazgos': r.total_findings,
    'Críticos': r.critical,
    'Altos': r.high,
    'Medios': r.medium,
    'Bajos': r.low,
    'Resueltos': r.resolved,
    'Emociones Negativas': r.negative_emotions,
    'Sentimientos Negativos': r.negative_sentiments,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 }, { wch: 40 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 18 }, { wch: 22 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Por Requerimiento')
  XLSX.writeFile(
    wb,
    `Hallazgos_Por_Requerimiento_${new Date().toISOString().slice(0, 10)}.xlsx`,
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