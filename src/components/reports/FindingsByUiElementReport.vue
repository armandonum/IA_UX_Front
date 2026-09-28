<template>
  <div>
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando reporte...</div>
    </div>

    <div v-else-if="!data.length" class="text-center q-py-xl">
      <q-icon name="widgets" size="48px" color="grey-5" />
      <div class="text-grey-7 q-mt-sm">No hay hallazgos por elemento UI</div>
      <div class="text-caption text-grey-6 q-mt-xs">
        Se requieren hallazgos vinculados a componentes específicos (botones, inputs, etc.)
      </div>
    </div>

    <q-card v-else flat bordered>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h6 text-weight-bold">
              🧩 Hallazgos por Elemento UI
            </div>
            <div class="text-caption text-grey-7">
              Componentes específicos (botones, inputs, cards) con más problemas
            </div>
          </div>

          <q-btn
            color="primary"
            icon="download"
            label="Exportar a Excel"
            @click="exportToExcel"
          />
        </div>

        <!-- Filtro por tipo de elemento -->
        <div class="row q-mb-md">
          <q-select
            v-model="filterType"
            :options="availableTypes"
            label="Filtrar por tipo"
            outlined
            dense
            clearable
            style="min-width: 220px;"
          />
        </div>

        <q-markup-table flat bordered dense>
          <thead>
            <tr>
              <th class="text-left">Elemento</th>
              <th class="text-left">Node ID</th>
              <th class="text-left">Tipo</th>
              <th class="text-center">Total Hallazgos</th>
              <th class="text-center">⚠️ Severos</th>
              <th class="text-left">Tipos de hallazgos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredData" :key="row.node_id">
              <td class="ellipsis" style="max-width: 250px;">
                <q-icon name="widgets" size="14px" class="q-mr-xs text-primary" />
                {{ row.element_name }}
              </td>
              <td>
                <span class="font-mono text-caption">{{ row.node_id }}</span>
              </td>
              <td>
                <q-badge :color="getTypeColor(row.element_type)" outline size="sm">
                  {{ row.element_type }}
                </q-badge>
              </td>
              <td class="text-center">
                <q-badge color="primary" text-color="white">
                  {{ row.total_findings }}
                </q-badge>
              </td>
              <td class="text-center">
                <q-chip
                  v-if="Number(row.severe_findings) > 0"
                  color="negative"
                  text-color="white"
                  dense
                  size="sm"
                >
                  ⚠️ {{ row.severe_findings }}
                </q-chip>
                <span v-else class="text-grey-5">—</span>
              </td>
              <td>
                <div class="row q-gutter-xs">
                  <q-chip
                    v-for="(t, i) in parseTypes(row.finding_types)"
                    :key="i"
                    dense
                    size="sm"
                    :color="getFindingTypeColor(t)"
                    text-color="white"
                  >
                    {{ getFindingTypeLabel(t) }}
                  </q-chip>
                </div>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import type { FindingsByUiElementRow } from '@/api/reports.api'

const props = defineProps<{
  data: FindingsByUiElementRow[]
  loading: boolean
}>()

const filterType = ref<string | null>(null)

const availableTypes = computed(() => {
  const types = new Set(props.data.map((r) => r.element_type))
  return Array.from(types)
})

const filteredData = computed(() => {
  if (!filterType.value) return props.data
  return props.data.filter((r) => r.element_type === filterType.value)
})

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    INSTANCE: 'primary',
    COMPONENT: 'info',
    FRAME: 'blue-grey',
    GROUP: 'grey',
    RECTANGLE: 'teal',
    TEXT: 'purple',
  }
  return colors[type] || 'grey'
}

function getFindingTypeColor(type: string): string {
  const colors: Record<string, string> = {
    problem: 'negative',
    difficulty: 'warning',
    accessibility: 'deep-orange',
    friction: 'deep-orange',
    positive: 'positive',
    opportunity: 'info',
  }
  return colors[type] || 'grey'
}

function getFindingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    problem: 'Problema',
    difficulty: 'Dificultad',
    accessibility: 'Accesibilidad',
    friction: 'Fricción',
    positive: 'Positivo',
    opportunity: 'Oportunidad',
  }
  return labels[type] || type
}

function parseTypes(types: string): string[] {
  if (!types) return []
  return types.split(',').map((t) => t.trim()).filter(Boolean)
}

function exportToExcel() {
  const rows = filteredData.value.map((r) => ({
    'Elemento UI': r.element_name,
    'Node ID': r.node_id,
    'Tipo': r.element_type,
    'Total Hallazgos': r.total_findings,
    'Hallazgos Severos': r.severe_findings,
    'Tipos de Hallazgos': r.finding_types,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 35 }, { wch: 12 }, { wch: 14 },
    { wch: 16 }, { wch: 18 }, { wch: 40 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Por Elemento UI')
  XLSX.writeFile(
    wb,
    `Hallazgos_Por_ElementoUI_${new Date().toISOString().slice(0, 10)}.xlsx`,
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