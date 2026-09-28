<template>
  <div>
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando reporte...</div>
    </div>

    <div v-else-if="!data" class="text-center q-py-xl">
      <q-icon name="inbox" size="48px" color="grey-5" />
      <div class="text-grey-7 q-mt-sm">No hay datos disponibles</div>
    </div>

    <div v-else>
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6 text-weight-bold q-mb-md">
            📌 Reporte Centralizador
          </div>

          <div class="row q-col-gutter-md">
            <!-- Stats grid -->
            <div class="col-6 col-md-3">
              <q-card flat bordered class="text-center q-pa-md">
                <div class="text-h4 text-primary text-weight-bold">
                  {{ data.total_findings || 0 }}
                </div>
                <div class="text-caption text-grey-7">Total Hallazgos</div>
              </q-card>
            </div>

            <div class="col-6 col-md-3">
              <q-card flat bordered class="text-center q-pa-md">
                <div class="text-h4 text-negative text-weight-bold">
                  {{ data.critical || 0 }}
                </div>
                <div class="text-caption text-grey-7">Críticos</div>
              </q-card>
            </div>

            <div class="col-6 col-md-3">
              <q-card flat bordered class="text-center q-pa-md">
                <div class="text-h4 text-deep-orange text-weight-bold">
                  {{ data.high || 0 }}
                </div>
                <div class="text-caption text-grey-7">Altos</div>
              </q-card>
            </div>

            <div class="col-6 col-md-3">
              <q-card flat bordered class="text-center q-pa-md">
                <div class="text-h4 text-positive text-weight-bold">
                  {{ data.resolved || 0 }}
                </div>
                <div class="text-caption text-grey-7">Resueltos</div>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Tabla resumen -->
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-md">
            Resumen del Proyecto
          </div>

          <q-markup-table flat bordered dense>
            <tbody>
              <tr>
                <td class="text-weight-bold" style="width: 40%">Total hallazgos</td>
                <td>{{ data.total_findings || 0 }}</td>
              </tr>
              <tr>
                <td class="text-weight-bold">Problemas críticos</td>
                <td>
                  <q-badge color="negative">
                    {{ data.critical || 0 }}
                  </q-badge>
                </td>
              </tr>
              <tr>
                <td class="text-weight-bold">Problemas altos</td>
                <td>
                  <q-badge color="deep-orange">
                    {{ data.high || 0 }}
                  </q-badge>
                </td>
              </tr>
              <tr>
                <td class="text-weight-bold">Problemas medios</td>
                <td>
                  <q-badge color="warning">
                    {{ data.medium || 0 }}
                  </q-badge>
                </td>
              </tr>
              <tr>
                <td class="text-weight-bold">Problemas bajos</td>
                <td>
                  <q-badge color="info">
                    {{ data.low || 0 }}
                  </q-badge>
                </td>
              </tr>
              <tr>
                <td class="text-weight-bold">Aspectos positivos</td>
                <td>
                  <q-badge color="positive">
                    {{ data.positive || 0 }}
                  </q-badge>
                </td>
              </tr>
              <tr>
                <td class="text-weight-bold">Interfaz más problemática</td>
                <td>
                  <q-chip v-if="data.worst_screen" color="negative" text-color="white" dense>
                    {{ data.worst_screen }}
                  </q-chip>
                  <span v-else class="text-grey-6">—</span>
                </td>
              </tr>
              <tr>
                <td class="text-weight-bold">Estado afectivo negativo</td>
                <td>
                  <q-chip v-if="data.dominant_emotion" color="orange" text-color="white" dense>
                    {{ getEmotionLabel(data.dominant_emotion) }}
                  </q-chip>
                  <span v-else class="text-grey-6">—</span>
                </td>
              </tr>
              <tr>
                <td class="text-weight-bold">Sentimiento predominante</td>
                <td>
                  <q-chip v-if="data.dominant_sentiment" color="purple" text-color="white" dense>
                    {{ data.dominant_sentiment }}
                  </q-chip>
                  <span v-else class="text-grey-6">—</span>
                </td>
              </tr>
              <tr>
                <td class="text-weight-bold">Comentario usuario recurrente</td>
                <td>
                  <div v-if="data.top_user_comment" class="text-italic">
                    "{{ data.top_user_comment }}"
                  </div>
                  <span v-else class="text-grey-6">—</span>
                </td>
              </tr>
              <tr>
                <td class="text-weight-bold">Comentario experto recurrente</td>
                <td>
                  <div v-if="data.top_expert_comment" class="text-italic">
                    "{{ data.top_expert_comment }}"
                  </div>
                  <span v-else class="text-grey-6">—</span>
                </td>
              </tr>
            </tbody>
          </q-markup-table>

          <div class="row q-mt-md justify-end">
            <q-btn
              color="primary"
              icon="download"
              label="Exportar a Excel"
              @click="exportToExcel"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as XLSX from 'xlsx'
import { getEmotionTemplate } from '@/types/expert/findings.dictionary'
import type { CentralizerReport } from '@/api/reports.api'

const props = defineProps<{
  data: CentralizerReport | null
  loading: boolean
}>()

function getEmotionLabel(emotion: string | null): string {
  if (!emotion) return '—'
  const tpl = getEmotionTemplate(emotion)
  return `${tpl.emoji} ${tpl.labelEs}`
}

function exportToExcel() {
  if (!props.data) return

  const rows = [
    { Categoría: 'Total de hallazgos', Resultado: props.data.total_findings },
    { Categoría: 'Problemas críticos', Resultado: props.data.critical },
    { Categoría: 'Problemas altos', Resultado: props.data.high },
    { Categoría: 'Problemas medios', Resultado: props.data.medium },
    { Categoría: 'Problemas bajos', Resultado: props.data.low },
    { Categoría: 'Aspectos positivos', Resultado: props.data.positive },
    { Categoría: 'Resueltos', Resultado: props.data.resolved },
    { Categoría: 'Interfaz más problemática', Resultado: props.data.worst_screen || '—' },
    { Categoría: 'Estado afectivo negativo', Resultado: getEmotionLabel(props.data.dominant_emotion) },
    { Categoría: 'Sentimiento predominante', Resultado: props.data.dominant_sentiment || '—' },
    { Categoría: 'Comentario usuario recurrente', Resultado: props.data.top_user_comment || '—' },
    { Categoría: 'Comentario experto recurrente', Resultado: props.data.top_expert_comment || '—' },
  ]

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 35 }, { wch: 60 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Centralizador')
  XLSX.writeFile(wb, `Reporte_Centralizador_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>