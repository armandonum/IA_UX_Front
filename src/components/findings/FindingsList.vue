<!-- components/findings/FindingsList.vue -->
<template>
  <div>
    <div class="flex justify-between items-center q-mb-2">
      <div class="text-sm text-slate-400">
        {{ findings.length }} hallazgos encontrados
      </div>
      <div class="text-xs text-slate-500">
        <q-icon name="info" size="14px" />
        Click en una fila para ver detalles
      </div>
    </div>

    <q-table
      :rows="findings"
      :columns="columns"
      row-key="findingId"
      dark
      flat
      class="bg-slate-800 rounded-lg"
      :loading="loading"
      :pagination="{ rowsPerPage: 10 }"
      v-model:pagination="pagination"
    >
      <!-- Columna: Severidad -->
      <template v-slot:body-cell-severity="props">
        <q-td>
          <q-badge
            :color="getSeverityColor(props.row.severity)"
            size="sm"
          >
            {{ getSeverityLabel(props.row.severity) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Columna: Estado -->
      <template v-slot:body-cell-status="props">
        <q-td>
          <q-badge
            :color="getStatusColor(props.row.status)"
            size="sm"
          >
            {{ getStatusLabel(props.row.status) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Columna: Tipo -->
      <template v-slot:body-cell-type="props">
        <q-td>
          <q-badge
            :color="getTypeColor(props.row.type)"
            size="sm"
            outline
          >
            {{ getTypeLabel(props.row.type) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Columna: Emoción/Sentimiento -->
      <template v-slot:body-cell-affective="props">
        <q-td>
          <div class="flex items-center gap-1">
            <span v-if="props.row.emotionInferred" class="text-xs">
              <q-icon name="sentiment_satisfied" size="14px" />
              {{ props.row.emotionInferred }}
            </span>
            <span v-if="props.row.textualSentiment" class="text-xs text-slate-500">
              ({{ props.row.textualSentiment }})
            </span>
            <span v-else class="text-xs text-slate-500">—</span>
          </div>
        </q-td>
      </template>

      <!-- Columna: Acciones -->
      <template v-slot:body-cell-actions="props">
        <q-td>
          <div class="flex gap-1">
            <q-btn
              icon="visibility"
              flat
              dense
              size="sm"
              @click.stop="$emit('view', props.row)"
            />
            <q-btn
              icon="edit"
              flat
              dense
              size="sm"
              @click.stop="$emit('edit', props.row)"
            />
            <q-btn
              icon="delete"
              flat
              dense
              size="sm"
              color="negative"
              @click.stop="$emit('delete', props.row.findingId)"
            />
          </div>
        </q-td>
      </template>

      <!-- Sin datos -->
      <template v-slot:no-data>
        <div class="text-center q-py-xl">
          <q-icon name="inbox" size="48px" color="grey-6" />
          <div class="text-grey-6 q-mt-sm">No hay hallazgos registrados</div>
          <q-btn
            flat
            color="primary"
            label="Crear primer hallazgo"
            @click="$emit('create')"
          />
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  findings: any[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'view', finding: any): void
  (e: 'edit', finding: any): void
  (e: 'delete', id: string): void
  (e: 'status-change', id: string, status: string): void
  (e: 'create'): void
}>()

const pagination = ref({
  rowsPerPage: 10,
})

const columns = [
  { name: 'type', label: 'Tipo', field: 'type', align: 'left', sortable: true },
  { name: 'description', label: 'Descripción', field: 'description', align: 'left', sortable: true },
  { name: 'severity', label: 'Severidad', field: 'severity', align: 'center', sortable: true },
  { name: 'status', label: 'Estado', field: 'status', align: 'center', sortable: true },
  { name: 'affective', label: 'Emoción/Sentimiento', field: 'affective', align: 'center' },
  { name: 'frequency', label: 'Frecuencia', field: 'frequency', align: 'center', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' },
]

// Helpers
const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: 'negative',
    high: 'orange',
    medium: 'warning',
    low: 'info',
  }
  return colors[severity] || 'grey'
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
  }
  return labels[severity] || severity
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'grey',
    in_progress: 'blue',
    resolved: 'positive',
    not_resolved: 'negative',
    kept: 'info',
  }
  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    not_resolved: 'No Resuelto',
    kept: 'Conservado',
  }
  return labels[status] || status
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    problem: 'negative',
    difficulty: 'warning',
    accessibility: 'orange',
    friction: 'deep-orange',
    positive: 'positive',
    opportunity: 'info',
  }
  return colors[type] || 'grey'
}

const getTypeLabel = (type: string) => {
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
</script>