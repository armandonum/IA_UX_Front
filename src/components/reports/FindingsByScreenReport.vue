<template>
  <div>
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando reporte...</div>
    </div>

    <div v-else-if="!data.length" class="text-center q-py-xl">
      <q-icon name="screenshot_monitor" size="48px" color="grey-5" />
      <div class="text-grey-7 q-mt-sm">No hay hallazgos vinculados a pantallas</div>
    </div>

    <q-card v-else flat bordered>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h6 text-weight-bold">
              🖥️ Hallazgos por Interfaz del Prototipo
            </div>
            <div class="text-caption text-grey-7">
              Distribución de problemas por pantalla evaluada
            </div>
          </div>

          <q-btn
            color="primary"
            icon="download"
            label="Exportar a Excel"
            @click="exportToExcel"
          />
        </div>

        <!-- Top 3 pantallas más problemáticas -->
        <div v-if="topScreens.length" class="row q-col-gutter-md q-mb-md">
          <div
            v-for="(screen, i) in topScreens"
            :key="screen.node_id"
            class="col-12 col-md-4"
          >
            <q-card flat bordered :class="`bg-${getRankColor(i)}-1`">
              <q-card-section>
                <div class="row items-center justify-between q-mb-xs">
                  <q-badge :color="getRankColor(i)" text-color="white">
                    #{{ i + 1 }} más problemática
                  </q-badge>
                  <div class="text-h6 text-weight-bold">
                    {{ screen.total_findings }}
                  </div>
                </div>
                <div class="text-subtitle2 text-weight-medium ellipsis">
                  {{ screen.screen_name }}
                </div>
                <div class="text-caption text-grey-6 font-mono">
                  {{ screen.node_id }}
                </div>
                <div class="row q-gutter-xs q-mt-sm">
                  <q-chip
                    v-if="Number(screen.critical) > 0"
                    color="negative"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    🔴 {{ screen.critical }}
                  </q-chip>
                  <q-chip
                    v-if="Number(screen.confusion_count) > 0"
                    color="orange"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    😕 {{ screen.confusion_count }}
                  </q-chip>
                  <q-chip
                    v-if="Number(screen.frustration_count) > 0"
                    color="deep-orange"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    😤 {{ screen.frustration_count }}
                  </q-chip>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Tabla completa -->
        <q-markup-table flat bordered dense>
          <thead>
            <tr>
              <th class="text-left">Pantalla</th>
              <th class="text-left">Node ID</th>
              <th class="text-left">Tipo</th>
              <th class="text-center">Total</th>
              <th class="text-center">🔴 Críticos</th>
              <th class="text-center">🟠 Altos</th>
              <th class="text-center">😤 Emociones neg.</th>
              <th class="text-center">😕 Confusión</th>
              <th class="text-center">😤 Frustración</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data" :key="row.node_id">
              <td class="ellipsis" style="max-width: 250px;">
                <q-icon name="web" size="14px" class="q-mr-xs text-primary" />
                {{ row.screen_name }}
              </td>
              <td>
                <span class="font-mono text-caption">{{ row.node_id }}</span>
              </td>
              <td>
                <q-badge color="blue-grey" outline size="sm">
                  {{ row.node_type }}
                </q-badge>
              </td>
              <td class="text-center">
                <q-badge color="primary" text-color="white">
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
                  v-if="Number(row.negative_emotions) > 0"
                  color="orange"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.negative_emotions }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.confusion_count) > 0"
                  color="amber"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.confusion_count }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.frustration_count) > 0"
                  color="deep-orange"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ row.frustration_count }}
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
import type { FindingsByScreenRow } from '@/api/reports.api'

const props = defineProps<{
  data: FindingsByScreenRow[]
  loading: boolean
}>()

const topScreens = computed(() =>
  [...props.data]
    .sort((a, b) => Number(b.total_findings) - Number(a.total_findings))
    .slice(0, 3),
)

function getRankColor(index: number): string {
  return ['negative', 'deep-orange', 'warning'][index] || 'grey'
}

function exportToExcel() {
  const rows = props.data.map((r) => ({
    'Pantalla': r.screen_name,
    'Node ID': r.node_id,
    'Tipo': r.node_type,
    'Total Hallazgos': r.total_findings,
    'Críticos': r.critical,
    'Altos': r.high,
    'Emociones Negativas': r.negative_emotions,
    'Confusión': r.confusion_count,
    'Frustración': r.frustration_count,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
    { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 14 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Por Interfaz')
  XLSX.writeFile(
    wb,
    `Hallazgos_Por_Interfaz_${new Date().toISOString().slice(0, 10)}.xlsx`,
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