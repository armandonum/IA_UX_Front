<!-- components/findings/FindingsQuickForm.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 480px; max-width: 600px;">
      <q-card-section class="bg-primary text-white">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-h6">🔍 Registrar Hallazgo</div>
            <div class="text-subtitle2">
              {{ formatTiempoS(ms) }} • {{ taskName || 'Tarea' }}
            </div>
          </div>
          <q-btn flat dense icon="close" color="white" @click="close" />
        </div>
      </q-card-section>

      <!-- Contexto del hallazgo -->
      <q-card-section class="q-pt-sm">
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-4">
            <q-card flat bordered class="bg-grey-1">
              <q-card-section class="q-pa-xs text-center">
                <div class="text-caption text-grey-6">Evento</div>
                <div class="text-caption text-dark">{{ traducirEvento(nearestEvent?.event_type) }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-4">
            <q-card flat bordered class="bg-grey-1">
              <q-card-section class="q-pa-xs text-center">
                <div class="text-caption text-grey-6">Emoción</div>
                <div class="text-caption text-dark">{{ emotionLabel || '—' }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-4">
            <q-card flat bordered class="bg-grey-1">
              <q-card-section class="q-pa-xs text-center">
                <div class="text-caption text-grey-6">Sentimiento</div>
                <div class="text-caption text-dark">{{ sentimentLabel || '—' }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Comentario cercano (si existe) -->
        <div v-if="nearestComment" class="q-mb-md p-2 bg-blue-50 rounded border border-blue-200">
          <div class="text-caption text-grey-6">
            <q-icon name="chat" size="14px" />
            Comentario del usuario
          </div>
          <div class="text-caption text-dark q-mt-xs">"{{ nearestComment.text }}"</div>
        </div>

        <q-separator class="q-my-sm" />

        <!-- Formulario -->
        <div class="q-gutter-sm">
          <q-select
            v-model="form.type"
            :options="typeOptions"
            label="Tipo de hallazgo *"
            filled
            dense
            emit-value
            map-options
            :rules="[v => !!v || 'Requerido']"
          />

          <q-input
            v-model="form.description"
            label="Descripción *"
            filled
            dense
            type="textarea"
            rows="2"
            placeholder="Describe el problema identificado..."
            :rules="[v => !!v || 'La descripción es requerida']"
          />

          <div class="row q-col-gutter-sm">
            <div class="col-4">
              <q-select
                v-model="form.severity"
                :options="severityOptions"
                label="Severidad"
                filled
                dense
                emit-value
                map-options
              />
            </div>
            <div class="col-4">
              <q-select
                v-model="form.impact"
                :options="impactOptions"
                label="Impacto"
                filled
                dense
                emit-value
                map-options
              />
            </div>
            <div class="col-4">
              <q-select
                v-model="form.priority"
                :options="priorityOptions"
                label="Prioridad"
                filled
                dense
                emit-value
                map-options
              />
            </div>
          </div>

          <q-input
            v-model="form.recommendation"
            label="Recomendación (opcional)"
            filled
            dense
            placeholder="Sugerencia para resolver el problema..."
          />

          <!-- Comentario de experto (opcional) -->
          <q-input
            v-model="form.expertComment"
            label="Comentario del experto (opcional)"
            filled
            dense
            type="textarea"
            rows="1"
            placeholder="Observación adicional..."
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" @click="close" />
        <q-btn
          color="primary"
          label="Guardar Hallazgo"
          :loading="loading"
          :disable="!form.type || !form.description"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  ms: number
  taskName?: string
  evaluationId: string
  sessionId: string
  taskId?: string
  nearestEvent?: any
  emotionLabel?: string
  sentimentLabel?: string
  nearestComment?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
  (e: 'close'): void
}>()

const loading = ref(false)

const typeOptions = [
  { label: 'Problema', value: 'problem' },
  { label: 'Dificultad', value: 'difficulty' },
  { label: 'Accesibilidad', value: 'accessibility' },
  { label: 'Fricción', value: 'friction' },
  { label: 'Positivo', value: 'positive' },
  { label: 'Oportunidad', value: 'opportunity' },
]

const severityOptions = [
  { label: 'Crítico', value: 'critical' },
  { label: 'Alto', value: 'high' },
  { label: 'Medio', value: 'medium' },
  { label: 'Bajo', value: 'low' },
]

const impactOptions = [
  { label: 'Alto', value: 'high' },
  { label: 'Medio', value: 'medium' },
  { label: 'Bajo', value: 'low' },
]

const priorityOptions = [
  { label: 'Alta', value: 'high' },
  { label: 'Media', value: 'medium' },
  { label: 'Baja', value: 'low' },
]

const form = ref({
  type: 'problem',
  description: '',
  severity: 'medium',
  impact: 'medium',
  priority: 'medium',
  recommendation: '',
  expertComment: '',
})

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const resetForm = () => {
  // Pre-cargar datos del contexto
  let suggestedType = 'problem'
  
  // Si hay sentimiento de frustración o confusión, sugerir problema
  if (props.sentimentLabel?.toLowerCase().includes('frustración') ||
      props.sentimentLabel?.toLowerCase().includes('confusión')) {
    suggestedType = 'problem'
  }
  
  // Si hay emoción de frustración, sugerir problema
  if (props.emotionLabel?.toLowerCase().includes('frustration') ||
      props.emotionLabel?.toLowerCase().includes('angry')) {
    suggestedType = 'problem'
  }

  form.value = {
    type: suggestedType,
    description: '',
    severity: 'medium',
    impact: 'medium',
    priority: 'medium',
    recommendation: '',
    expertComment: '',
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    resetForm()
  }
})

const close = () => {
  visible.value = false
  emit('close')
}

const save = async () => {
  if (!form.value.type || !form.value.description) return

  loading.value = true
  try {
    const data = {
      evaluationId: props.evaluationId,
      sessionId: props.sessionId,
      taskId: props.taskId || null,
      nodeId: props.nearestEvent?.node_id || null,
      description: form.value.description,
      type: form.value.type,
      severity: form.value.severity,
      impact: form.value.impact,
      priority: form.value.priority,
      recommendation: form.value.recommendation || null,
      expertComment: form.value.expertComment || null,
      emotionInferred: props.emotionLabel || null,
      textualSentiment: props.sentimentLabel || null,
      userComment: props.nearestComment?.text || null,
      userCommentId: props.nearestComment?.commentId || null,
      status: 'pending',
      frequency: 1,
    }
    
    emit('save', data)
    close()
  } finally {
    loading.value = false
  }
}

// Helpers
const traduccionesEventos: Record<string, string> = {
  'INITIAL_LOAD': 'Carga inicial',
  'PRESENTED_NODE_CHANGED': 'Cambio de pantalla',
  'NEW_STATE': 'Nuevo estado',
  'MOUSE_PRESS_OR_RELEASE': 'Click del mouse',
  'CLICK': 'Click',
  'SCROLL': 'Desplazamiento',
  'NAVIGATION': 'Navegación',
}

function traducirEvento(eventType: string | undefined): string {
  if (!eventType) return '—'
  return traduccionesEventos[eventType] || eventType.replace(/_/g, ' ').toLowerCase()
}

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}
</script>