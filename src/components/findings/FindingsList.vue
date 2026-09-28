<!-- components/findings/FindingsList.vue -->
<template>
  <div>
    <div class="flex justify-between items-center q-mb-2">
      <div class="text-caption text-grey-7">
        {{ findings.length }} hallazgos
      </div>
      <div class="text-caption text-grey-6">
        <q-icon name="info" size="14px" />
        Click para ver detalles
      </div>
    </div>

    <q-table
      :rows="findings"
      :columns="columns"
      row-key="findingId"
      flat
      bordered
      class="findings-table"
      :loading="loading"
      :pagination="{ rowsPerPage: 10 }"
      :rows-per-page-options="[10, 25, 50]"
      dense
    >
      <template v-slot:body-cell-severity="props">
        <q-td>
          <q-badge :color="getSeverityColor(props.row.severity)" size="sm">
            {{ getSeverityLabel(props.row.severity) }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td>
          <q-badge :color="getStatusColor(props.row.status)" size="sm">
            {{ getStatusLabel(props.row.status) }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-type="props">
        <q-td>
          <q-badge :color="getTypeColor(props.row.type)" size="sm" outline>
            {{ getTypeLabel(props.row.type) }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-description="props">
        <q-td>
          <div class="text-caption ellipsis-2-lines" style="max-width: 380px;">
            {{ props.row.description }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-source="props">
        <q-td>
          <q-chip
            :icon="getSourceIcon(props.row)"
            size="sm"
            dense
            :color="getSourceColor(props.row)"
            text-color="white"
          >
            {{ getSourceLabel(props.row) }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td>
          <div class="flex gap-1 justify-center">
            <q-btn
              icon="visibility"
              flat
              dense
              size="sm"
              @click.stop="$emit('view', props.row)"
            >
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>
            <q-btn
              icon="edit"
              flat
              dense
              size="sm"
              @click.stop="$emit('edit', props.row)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn
              icon="delete"
              flat
              dense
              size="sm"
              color="negative"
              @click.stop="$emit('delete', props.row.findingId)"
            >
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>

      <template v-slot:no-data>
        <div class="text-center q-py-xl">
          <q-icon name="inbox" size="48px" color="grey-5" />
          <div class="text-grey-7 q-mt-sm">No hay hallazgos registrados</div>
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
defineProps<{
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

const columns = [
  { name: 'type', label: 'Tipo', field: 'type', align: 'left', sortable: true, style: 'width: 100px' },
  { name: 'description', label: 'Descripción', field: 'description', align: 'left', sortable: true },
  { name: 'severity', label: 'Severidad', field: 'severity', align: 'center', sortable: true, style: 'width: 100px' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center', sortable: true, style: 'width: 110px' },
  { name: 'source', label: 'Origen', field: 'source', align: 'center', style: 'width: 110px' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center', style: 'width: 130px' },
]

// ============================================================
// LABELS
// ============================================================
function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
    info: 'Info',
  }
  return labels[severity] || severity
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    not_resolved: 'No Resuelto',
    kept: 'Conservado',
    reviewed: 'Revisado',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  }
  return labels[status] || status
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    usability: 'Usabilidad',
    emotional: 'Emocional',
    sentiment: 'Sentimiento',
    expert: 'Experto',
    mixed: 'Mixto',
    problem: 'Problema',
    difficulty: 'Dificultad',
    accessibility: 'Accesibilidad',
    friction: 'Fricción',
    positive: 'Positivo',
    opportunity: 'Oportunidad',
  }
  return labels[type] || type
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'negative',
    high: 'deep-orange',
    medium: 'warning',
    low: 'info',
    info: 'grey',
  }
  return colors[severity] || 'grey'
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'grey',
    in_progress: 'info',
    resolved: 'positive',
    not_resolved: 'negative',
    kept: 'blue',
    reviewed: 'blue',
    approved: 'positive',
    rejected: 'negative',
  }
  return colors[status] || 'grey'
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    usability: 'orange',
    emotional: 'purple',
    sentiment: 'info',
    expert: 'teal',
    mixed: 'warning',
    problem: 'negative',
    difficulty: 'warning',
    accessibility: 'deep-orange',
    friction: 'deep-orange',
    positive: 'positive',
    opportunity: 'info',
  }
  return colors[type] || 'grey'
}

// ============================================================
// ORIGEN DEL HALLAZGO
// ============================================================
function getSourceLabel(finding: any): string {
  if (finding.source) {
    const labels: Record<string, string> = {
      emotion: 'Emoción',
      sentiment: 'Sentimiento',
      user_comment: 'Comentario',
      expert_comment: 'Experto',
      mixed: 'Mixto',
    }
    return labels[finding.source] || 'Directo'
  }

  // Inferir del contenido
  if (finding.expertComment) return 'Experto'
  if (finding.userComment) return 'Comentario'
  if (finding.textualSentiment) return 'Sentimiento'
  if (finding.emotionInferred) return 'Emoción'
  return 'Directo'
}

function getSourceIcon(finding: any): string {
  if (finding.source === 'emotion') return 'sentiment_satisfied'
  if (finding.source === 'sentiment') return 'psychology'
  if (finding.source === 'user_comment') return 'chat'
  if (finding.source === 'expert_comment') return 'psychology_alt'
  if (finding.source === 'mixed') return 'auto_awesome'

  if (finding.expertComment) return 'psychology_alt'
  if (finding.userComment) return 'chat'
  if (finding.textualSentiment) return 'psychology'
  if (finding.emotionInferred) return 'sentiment_satisfied'
  return 'edit'
}

function getSourceColor(finding: any): string {
  if (finding.source === 'emotion') return 'orange'
  if (finding.source === 'sentiment') return 'purple'
  if (finding.source === 'user_comment') return 'teal'
  if (finding.source === 'expert_comment') return 'indigo'
  if (finding.source === 'mixed') return 'warning'

  if (finding.expertComment) return 'indigo'
  if (finding.userComment) return 'teal'
  if (finding.textualSentiment) return 'purple'
  if (finding.emotionInferred) return 'orange'
  return 'grey'
}
</script>

<style scoped>
.findings-table :deep(.q-table__card) {
  background: transparent;
}
</style>