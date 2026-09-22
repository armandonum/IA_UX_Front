<!-- components/findings/FindingDetailModal.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 500px; max-width: 700px; max-height: 80vh;">
      <q-card-section :class="getSeverityHeaderColor(finding?.severity)">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-h6 text-white">{{ finding?.description || 'Detalle del Hallazgo' }}</div>
            <div class="text-subtitle2 text-white/70">
              {{ getTypeLabel(finding?.type) }} • {{ getSeverityLabel(finding?.severity) }}
            </div>
          </div>
          <q-btn
            flat
            dense
            icon="close"
            color="white"
            @click="close"
          />
        </div>
      </q-card-section>

      <q-card-section v-if="finding" style="max-height: 60vh; overflow-y: auto;">
        <div class="grid grid-cols-2 gap-3">
          <!-- Severidad -->
          <div class="bg-slate-800 p-2 rounded-lg">
            <div class="text-xs text-slate-500">Severidad</div>
            <q-badge :color="getSeverityColor(finding.severity)" size="md">
              {{ getSeverityLabel(finding.severity) }}
            </q-badge>
          </div>

          <!-- Estado -->
          <div class="bg-slate-800 p-2 rounded-lg">
            <div class="text-xs text-slate-500">Estado</div>
            <q-badge :color="getStatusColor(finding.status)" size="md">
              {{ getStatusLabel(finding.status) }}
            </q-badge>
          </div>

          <!-- Tipo -->
          <div class="bg-slate-800 p-2 rounded-lg">
            <div class="text-xs text-slate-500">Tipo</div>
            <q-badge :color="getTypeColor(finding.type)" size="md" outline>
              {{ getTypeLabel(finding.type) }}
            </q-badge>
          </div>

          <!-- Prioridad -->
          <div class="bg-slate-800 p-2 rounded-lg">
            <div class="text-xs text-slate-500">Prioridad</div>
            <q-badge :color="getPriorityColor(finding.priority)" size="md">
              {{ getPriorityLabel(finding.priority) }}
            </q-badge>
          </div>

          <!-- Impacto -->
          <div class="bg-slate-800 p-2 rounded-lg">
            <div class="text-xs text-slate-500">Impacto</div>
            <q-badge :color="getImpactColor(finding.impact)" size="md">
              {{ getImpactLabel(finding.impact) }}
            </q-badge>
          </div>

          <!-- Frecuencia -->
          <div class="bg-slate-800 p-2 rounded-lg">
            <div class="text-xs text-slate-500">Frecuencia</div>
            <div class="text-slate-100 font-semibold">{{ finding.frequency }}</div>
          </div>

          <!-- Emoción -->
          <div class="bg-slate-800 p-2 rounded-lg">
            <div class="text-xs text-slate-500">Emoción Inferida</div>
            <div class="text-slate-100">{{ finding.emotionInferred || '—' }}</div>
          </div>

          <!-- Sentimiento -->
          <div class="bg-slate-800 p-2 rounded-lg">
            <div class="text-xs text-slate-500">Sentimiento Textual</div>
            <div class="text-slate-100">{{ finding.textualSentiment || '—' }}</div>
          </div>

          <!-- Versión -->
          <div class="bg-slate-800 p-2 rounded-lg">
            <div class="text-xs text-slate-500">Versión</div>
            <div class="text-slate-100">{{ finding.version || '—' }}</div>
          </div>

          <!-- Node ID -->
          <div class="bg-slate-800 p-2 rounded-lg col-span-2">
            <div class="text-xs text-slate-500">Node ID (Figma)</div>
            <div class="text-slate-100 font-mono text-sm">{{ finding.nodeId || '—' }}</div>
          </div>
        </div>

        <!-- Descripción -->
        <div class="q-mt-3 p-3 bg-slate-800 rounded-lg">
          <div class="text-xs text-slate-500 q-mb-1">Descripción</div>
          <div class="text-slate-100">{{ finding.description }}</div>
        </div>

        <!-- Recomendación -->
        <div v-if="finding.recommendation" class="q-mt-3 p-3 bg-slate-800 rounded-lg border border-positive/30">
          <div class="text-xs text-positive q-mb-1">
            <q-icon name="lightbulb" size="14px" />
            Recomendación
          </div>
          <div class="text-slate-100">{{ finding.recommendation }}</div>
        </div>

        <!-- Comentarios -->
        <div v-if="finding.userComment" class="q-mt-3 p-3 bg-slate-800 rounded-lg">
          <div class="text-xs text-slate-500 q-mb-1">
            <q-icon name="comment" size="14px" />
            Comentario del Usuario
          </div>
          <div class="text-slate-100 text-sm italic">"{{ finding.userComment }}"</div>
        </div>

        <div v-if="finding.expertComment" class="q-mt-3 p-3 bg-slate-800 rounded-lg">
          <div class="text-xs text-slate-500 q-mb-1">
            <q-icon name="psychology" size="14px" />
            Comentario del Experto
          </div>
          <div class="text-slate-100">{{ finding.expertComment }}</div>
        </div>

        <!-- Metadatos -->
        <div class="q-mt-3 text-xs text-slate-500">
          <div>Creado: {{ formatDate(finding.createdAt) }}</div>
          <div>Actualizado: {{ formatDate(finding.updatedAt) }}</div>
          <div v-if="finding.aggregatedFrom?.length">
            Agregado de: {{ finding.aggregatedFrom.join(', ') }}
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          v-if="finding?.status !== 'resolved' && finding?.status !== 'kept'"
          color="positive"
          label="Resolver"
          @click="changeStatus('resolved')"
        />
        <q-btn
          v-if="finding?.status === 'pending' || finding?.status === 'in_progress'"
          color="warning"
          label="En Progreso"
          @click="changeStatus('in_progress')"
        />
        <q-btn
          color="primary"
          label="Editar"
          @click="$emit('edit', finding)"
        />
        <q-btn flat label="Cerrar" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  finding?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', finding: any): void
  (e: 'status-change', id: string, status: string): void
  (e: 'close'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const close = () => {
  visible.value = false
  emit('close')
}

const changeStatus = (status: string) => {
  if (props.finding) {
    emit('status-change', props.finding.findingId, status)
  }
}

const formatDate = (date: string) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Helpers
const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = { critical: 'negative', high: 'orange', medium: 'warning', low: 'info' }
  return colors[severity] || 'grey'
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = { critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo' }
  return labels[severity] || severity
}

const getSeverityHeaderColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: 'bg-negative text-white',
    high: 'bg-orange text-white',
    medium: 'bg-warning text-white',
    low: 'bg-info text-white',
  }
  return colors[severity] || 'bg-primary text-white'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = { pending: 'grey', in_progress: 'blue', resolved: 'positive', not_resolved: 'negative', kept: 'info' }
  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = { pending: 'Pendiente', in_progress: 'En Progreso', resolved: 'Resuelto', not_resolved: 'No Resuelto', kept: 'Conservado' }
  return labels[status] || status
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = { problem: 'negative', difficulty: 'warning', accessibility: 'orange', friction: 'deep-orange', positive: 'positive', opportunity: 'info' }
  return colors[type] || 'grey'
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = { problem: 'Problema', difficulty: 'Dificultad', accessibility: 'Accesibilidad', friction: 'Fricción', positive: 'Positivo', opportunity: 'Oportunidad' }
  return labels[type] || type
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = { high: 'negative', medium: 'warning', low: 'info' }
  return colors[priority] || 'grey'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' }
  return labels[priority] || priority
}

const getImpactColor = (impact: string) => {
  const colors: Record<string, string> = { high: 'negative', medium: 'warning', low: 'info' }
  return colors[impact] || 'grey'
}

const getImpactLabel = (impact: string) => {
  const labels: Record<string, string> = { high: 'Alto', medium: 'Medio', low: 'Bajo' }
  return labels[impact] || impact
}
</script>