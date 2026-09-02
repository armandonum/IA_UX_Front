<!-- components/findings/FindingsForm.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 500px; max-width: 700px;">
      <q-card-section :class="isEdit ? 'bg-warning text-white' : 'bg-primary text-white'">
        <div class="text-h6">
          {{ isEdit ? 'Editar Hallazgo' : 'Nuevo Hallazgo' }}
        </div>
        <div class="text-subtitle2">
          {{ isEdit ? 'Actualiza la información del hallazgo' : 'Registra un nuevo hallazgo de usabilidad' }}
        </div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <!-- Datos básicos -->
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-select
              v-model="form.type"
              :options="typeOptions"
              label="Tipo"
              filled
              dense
              emit-value
              map-options
              :rules="[v => !!v || 'El tipo es requerido']"
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="form.severity"
              :options="severityOptions"
              label="Severidad"
              filled
              dense
              emit-value
              map-options
              :rules="[v => !!v || 'La severidad es requerida']"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-select
              v-model="form.impact"
              :options="impactOptions"
              label="Impacto"
              filled
              dense
              emit-value
              map-options
              :rules="[v => !!v || 'El impacto es requerido']"
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="form.priority"
              :options="priorityOptions"
              label="Prioridad"
              filled
              dense
              emit-value
              map-options
              :rules="[v => !!v || 'La prioridad es requerida']"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-select
              v-model="form.status"
              :options="statusOptions"
              label="Estado"
              filled
              dense
              emit-value
              map-options
              :rules="[v => !!v || 'El estado es requerido']"
            />
          </div>
          <div class="col-6">
            <q-input
              v-model.number="form.frequency"
              label="Frecuencia"
              filled
              dense
              type="number"
              min="1"
            />
          </div>
        </div>

        <!-- Descripción -->
        <q-input
          v-model="form.description"
          label="Descripción"
          filled
          dense
          type="textarea"
          rows="3"
          :rules="[v => !!v || 'La descripción es requerida']"
          placeholder="Describe el hallazgo en detalle..."
        />

        <!-- Recomendación -->
        <q-input
          v-model="form.recommendation"
          label="Recomendación"
          filled
          dense
          type="textarea"
          rows="2"
          placeholder="Sugiere una acción para resolver el hallazgo..."
        />

        <!-- Campos afectivos -->
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-input
              v-model="form.emotionInferred"
              label="Emoción Inferida"
              filled
              dense
              placeholder="Ej: Frustración, Satisfacción"
            />
          </div>
          <div class="col-6">
            <q-input
              v-model="form.textualSentiment"
              label="Sentimiento Textual"
              filled
              dense
              placeholder="Ej: Positivo, Negativo, Neutro"
            />
          </div>
        </div>

        <!-- Comentarios -->
        <q-input
          v-model="form.userComment"
          label="Comentario del Usuario"
          filled
          dense
          type="textarea"
          rows="2"
          placeholder="Comentario textual del usuario..."
        />

        <q-input
          v-model="form.expertComment"
          label="Comentario del Experto"
          filled
          dense
          type="textarea"
          rows="2"
          placeholder="Observación del evaluador UX/docente..."
        />

        <!-- Datos de contexto (opcionales) -->
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-input
              v-model="form.version"
              label="Versión"
              filled
              dense
              placeholder="Ej: V1, V2, V3"
            />
          </div>
          <div class="col-6">
            <q-input
              v-model="form.nodeId"
              label="Node ID (Figma)"
              filled
              dense
              placeholder="Ej: 1:759"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" @click="close" />
        <q-btn
          color="primary"
          :label="isEdit ? 'Actualizar' : 'Crear'"
          :loading="loading"
          :disable="!form.description || !form.type"
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
  finding?: any
  evaluationId: string
  sessionId?: string
  taskId?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
}>()

const loading = ref(false)
const isEdit = computed(() => !!props.finding)

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

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'En Progreso', value: 'in_progress' },
  { label: 'Resuelto', value: 'resolved' },
  { label: 'No Resuelto', value: 'not_resolved' },
  { label: 'Conservado', value: 'kept' },
]

const form = ref({
  type: 'problem',
  description: '',
  severity: 'medium',
  impact: 'medium',
  priority: 'medium',
  recommendation: '',
  status: 'pending',
  frequency: 1,
  emotionInferred: '',
  textualSentiment: '',
  userComment: '',
  expertComment: '',
  version: '',
  nodeId: '',
})

const resetForm = () => {
  form.value = {
    type: 'problem',
    description: '',
    severity: 'medium',
    impact: 'medium',
    priority: 'medium',
    recommendation: '',
    status: 'pending',
    frequency: 1,
    emotionInferred: '',
    textualSentiment: '',
    userComment: '',
    expertComment: '',
    version: '',
    nodeId: '',
  }
}
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

watch(() => props.finding, (val) => {
  if (val) {
    form.value = {
      type: val.type || 'problem',
      description: val.description || '',
      severity: val.severity || 'medium',
      impact: val.impact || 'medium',
      priority: val.priority || 'medium',
      recommendation: val.recommendation || '',
      status: val.status || 'pending',
      frequency: val.frequency || 1,
      emotionInferred: val.emotionInferred || '',
      textualSentiment: val.textualSentiment || '',
      userComment: val.userComment || '',
      expertComment: val.expertComment || '',
      version: val.version || '',
      nodeId: val.nodeId || '',
    }
  } else {
    resetForm()
  }
}, { immediate: true })


const close = () => {
  visible.value = false
  if (!isEdit.value) {
    resetForm()
  }
}

const save = async () => {
  if (!form.value.description || !form.value.type) return

  loading.value = true
  try {
    const data = {
      ...form.value,
      evaluationId: props.evaluationId,
      sessionId: props.sessionId || null,
      taskId: props.taskId || null,
    }
    
    emit('save', data)
    close()
  } finally {
    loading.value = false
  }
}
</script>