<!-- components/findings/FindingDetailModal.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 560px; max-width: 760px; max-height: 85vh;">
      <!-- ============================================================ -->
      <!-- HEADER (color según severidad)                                -->
      <!-- ============================================================ -->
      <q-card-section :class="getSeverityHeaderColor(finding?.severity)">
        <div class="row items-center justify-between no-wrap">
          <div class="col">
            <div class="text-h6 text-white">
              {{ finding?.description || 'Detalle del Hallazgo' }}
            </div>
            <div class="row items-center q-gutter-sm q-mt-xs">
              <q-badge
                :color="getTypeColor(finding?.type)"
                text-color="white"
                outline
              >
                {{ getTypeLabel(finding?.type) }}
              </q-badge>
              <q-badge color="white" text-color="black" outline>
                {{ getSeverityLabel(finding?.severity) }}
              </q-badge>
              <q-badge
                :color="getSourceColor(finding)"
                text-color="white"
              >
                <q-icon :name="getSourceIcon(finding)" size="12px" class="q-mr-xs" />
                {{ getSourceLabel(finding) }}
              </q-badge>
            </div>
          </div>
          <q-btn
            flat
            dense
            round
            icon="close"
            color="white"
            @click="close"
          />
        </div>
      </q-card-section>

      <!-- ============================================================ -->
      <!-- CONTENIDO                                                     -->
      <!-- ============================================================ -->
      <q-card-section
        v-if="finding"
        style="max-height: 60vh; overflow-y: auto;"
      >
        <!-- ======================================================== -->
        <!-- GRID DE DATOS PRINCIPALES                                -->
        <!-- ======================================================== -->
        <div class="row q-col-gutter-sm">
          <!-- Severidad -->
          <div class="col-6 col-md-3">
            <div class="q-pa-sm bg-grey-2 rounded-borders">
              <div class="text-caption text-grey-6">Severidad</div>
              <q-badge
                :color="getSeverityColor(finding.severity)"
                size="md"
                class="q-mt-xs"
              >
                {{ getSeverityLabel(finding.severity) }}
              </q-badge>
            </div>
          </div>

          <!-- Estado -->
          <div class="col-6 col-md-3">
            <div class="q-pa-sm bg-grey-2 rounded-borders">
              <div class="text-caption text-grey-6">Estado</div>
              <q-badge
                :color="getStatusColor(finding.status)"
                size="md"
                class="q-mt-xs"
              >
                {{ getStatusLabel(finding.status) }}
              </q-badge>
            </div>
          </div>

          <!-- Prioridad -->
          <div class="col-6 col-md-3">
            <div class="q-pa-sm bg-grey-2 rounded-borders">
              <div class="text-caption text-grey-6">Prioridad</div>
              <q-badge
                :color="getPriorityColor(finding.priority)"
                size="md"
                class="q-mt-xs"
              >
                {{ getPriorityLabel(finding.priority) }}
              </q-badge>
            </div>
          </div>

          <!-- Impacto -->
          <div class="col-6 col-md-3">
            <div class="q-pa-sm bg-grey-2 rounded-borders">
              <div class="text-caption text-grey-6">Impacto</div>
              <q-badge
                :color="getImpactColor(finding.impact)"
                size="md"
                class="q-mt-xs"
              >
                {{ getImpactLabel(finding.impact) }}
              </q-badge>
            </div>
          </div>

          <!-- Frecuencia -->
          <div class="col-6 col-md-3">
            <div class="q-pa-sm bg-grey-2 rounded-borders">
              <div class="text-caption text-grey-6">Frecuencia</div>
              <div class="text-h6 text-weight-bold q-mt-xs">
                {{ finding.frequency || 1 }}×
              </div>
            </div>
          </div>

          <!-- Versión -->
          <div class="col-6 col-md-3">
            <div class="q-pa-sm bg-grey-2 rounded-borders">
              <div class="text-caption text-grey-6">Versión</div>
              <div class="text-body1 q-mt-xs">{{ finding.version || '1.0' }}</div>
            </div>
          </div>

          <!-- Node ID -->
          <div class="col-12 col-md-6">
            <div class="q-pa-sm bg-grey-2 rounded-borders">
              <div class="text-caption text-grey-6">
                <q-icon name="layers" size="14px" />
                Pantalla (Node ID)
              </div>
              <div class="text-caption font-mono q-mt-xs ellipsis">
                {{ finding.nodeId || '—' }}
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- CONTEXTO AFECTIVO (Emoción + Sentimiento)                 -->
        <!-- ======================================================== -->
        <div
          v-if="finding.emotionInferred || finding.textualSentiment"
          class="q-mt-md"
        >
          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            🎭 Contexto afectivo
          </div>

          <div class="row q-col-gutter-sm">
            <!-- Emoción -->
            <div v-if="finding.emotionInferred" class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section class="q-pa-sm">
                  <div class="row items-center q-gutter-xs">
                    <q-icon
                      name="sentiment_satisfied"
                      color="orange"
                      size="sm"
                    />
                    <div class="text-caption text-grey-6">
                      Emoción detectada
                    </div>
                  </div>
                  <div class="text-body1 text-weight-medium q-mt-xs">
                    {{ formatEmotionLabel(finding.emotionInferred) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Sentimiento -->
            <div v-if="finding.textualSentiment" class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section class="q-pa-sm">
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="psychology" color="purple" size="sm" />
                    <div class="text-caption text-grey-6">
                      Sentimiento del texto
                    </div>
                  </div>
                  <div class="q-mt-xs">
                    <q-badge
                      :color="getSentimentColor(finding.textualSentiment)"
                      size="md"
                      text-color="white"
                    >
                      {{ finding.textualSentiment }}
                    </q-badge>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- DESCRIPCIÓN                                               -->
        <!-- ======================================================== -->
        <div class="q-mt-md">
          <div class="text-subtitle2 text-weight-bold q-mb-xs">
            📝 Descripción
          </div>
          <q-card flat bordered>
            <q-card-section class="q-pa-sm">
              {{ finding.description }}
            </q-card-section>
          </q-card>
        </div>

        <!-- ======================================================== -->
        <!-- RECOMENDACIÓN                                             -->
        <!-- ======================================================== -->
        <div v-if="finding.recommendation" class="q-mt-md">
          <div class="text-subtitle2 text-weight-bold q-mb-xs">
            💡 Recomendación
          </div>
          <q-card flat bordered class="bg-green-1">
            <q-card-section class="q-pa-sm">
              <div class="row items-start no-wrap q-gutter-sm">
                <q-icon name="lightbulb" color="positive" size="sm" />
                <div class="col">{{ finding.recommendation }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- ======================================================== -->
        <!-- COMENTARIO DEL USUARIO                                    -->
        <!-- ======================================================== -->
        <div v-if="finding.userComment" class="q-mt-md">
          <div class="text-subtitle2 text-weight-bold q-mb-xs">
            💬 Comentario del usuario
          </div>
          <q-card flat bordered class="bg-teal-1">
            <q-card-section class="q-pa-sm">
              <div class="text-body2" style="font-style: italic;">
                "{{ finding.userComment }}"
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- ======================================================== -->
        <!-- COMENTARIO DEL EXPERTO                                    -->
        <!-- ======================================================== -->
        <div v-if="finding.expertComment" class="q-mt-md">
          <div class="text-subtitle2 text-weight-bold q-mb-xs">
            🧠 Comentario del experto
          </div>
          <q-card flat bordered class="bg-indigo-1">
            <q-card-section class="q-pa-sm">
              {{ finding.expertComment }}
            </q-card-section>
          </q-card>
        </div>

        <!-- ======================================================== -->
        <!-- METADATOS                                                 -->
        <!-- ======================================================== -->
        <div class="q-mt-md text-caption text-grey-6">
          <div class="row q-gutter-md">
            <div>
              <q-icon name="schedule" size="12px" />
              Creado: {{ formatDate(finding.createdAt) }}
            </div>
            <div v-if="finding.updatedAt && finding.updatedAt !== finding.createdAt">
              <q-icon name="update" size="12px" />
              Actualizado: {{ formatDate(finding.updatedAt) }}
            </div>
          </div>

          <div v-if="finding.aggregatedFrom?.length" class="q-mt-xs">
            <q-icon name="merge" size="12px" />
            Agregado de {{ finding.aggregatedFrom.length }} origen(es)
          </div>
        </div>
      </q-card-section>

      <!-- ============================================================ -->
      <!-- ACCIONES                                                      -->
      <!-- ============================================================ -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          v-if="finding?.status === 'pending' || finding?.status === 'in_progress'"
          color="warning"
          label="En Progreso"
          icon="schedule"
          @click="changeStatus('in_progress')"
        />
        <q-btn
          v-if="finding?.status !== 'resolved' && finding?.status !== 'kept'"
          color="positive"
          label="Resolver"
          icon="check_circle"
          @click="changeStatus('resolved')"
        />
        <q-btn
          color="primary"
          label="Editar"
          icon="edit"
          @click="$emit('edit', finding)"
        />
        <q-btn flat label="Cerrar" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  getEmotionTemplate,
  getSentimentColor as getSentColor,
} from '@/types/expert/findings.dictionary'

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
  set: (val) => emit('update:modelValue', val),
})

function close() {
  visible.value = false
  emit('close')
}

function changeStatus(status: string) {
  if (props.finding) {
    emit('status-change', props.finding.findingId, status)
  }
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

// ============================================================
// EMOCIÓN: usa el diccionario para emoji + label
// ============================================================
function formatEmotionLabel(emotion: string | null | undefined): string {
  if (!emotion) return '—'
  const tpl = getEmotionTemplate(emotion)
  return `${tpl.emoji} ${tpl.labelEs}`
}

// ============================================================
// SENTIMIENTO: usa el color del diccionario
// ============================================================
function getSentimentColor(sentiment: string): string {
  const color = getSentColor(sentiment)
  // El diccionario retorna hex; Quasar acepta hex con text-color="white"
  // así que lo usamos directo. Si prefieres nombres Quasar, aquí mapeamos:
  const map: Record<string, string> = {
    '#ef4444': 'negative',
    '#f59e0b': 'warning',
    '#22c55e': 'positive',
    '#64748b': 'grey-7',
    '#f97316': 'deep-orange',
    '#dc2626': 'negative',
    '#3b82f6': 'info',
    '#78716c': 'grey-8',
    '#14b8a6': 'teal',
    '#94a3b8': 'grey-6',
  }
  return map[color] || 'grey'
}

// ============================================================
// ORIGEN DEL HALLAZGO
// ============================================================
function getSourceLabel(finding: any): string {
  if (!finding) return 'Directo'

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

  if (finding.expertComment) return 'Experto'
  if (finding.userComment) return 'Comentario'
  if (finding.textualSentiment) return 'Sentimiento'
  if (finding.emotionInferred) return 'Emoción'
  return 'Directo'
}

function getSourceIcon(finding: any): string {
  if (!finding) return 'edit'

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
  if (!finding) return 'grey'

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

// ============================================================
// COLORES Y LABELS (consistentes con FindingsList)
// ============================================================
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

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
    info: 'Informativo',
  }
  return labels[severity] || severity
}

function getSeverityHeaderColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-negative text-white',
    high: 'bg-deep-orange text-white',
    medium: 'bg-warning text-white',
    low: 'bg-info text-white',
    info: 'bg-grey-7 text-white',
  }
  return colors[severity] || 'bg-primary text-white'
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

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: 'negative',
    medium: 'warning',
    low: 'info',
  }
  return colors[priority] || 'grey'
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  }
  return labels[priority] || priority
}

function getImpactColor(impact: string): string {
  const colors: Record<string, string> = {
    high: 'negative',
    medium: 'warning',
    low: 'info',
  }
  return colors[impact] || 'grey'
}

function getImpactLabel(impact: string): string {
  const labels: Record<string, string> = {
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
  }
  return labels[impact] || impact
}
</script>

<style scoped>
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>