<!-- components/problems/ProblemForm.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 500px; max-width: 700px;">
      <q-card-section :class="isEdit ? 'bg-warning text-white' : 'bg-primary text-white'">
        <div class="text-h6">{{ isEdit ? 'Editar Problema' : 'Identificar Problema' }}</div>
        <div class="text-subtitle2">
          {{ isEdit ? 'Actualiza la información del problema' : 'Registra un problema de usabilidad identificado' }}
        </div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-input
          v-model="form.title"
          label="Título del problema"
          filled
          dense
          :rules="[v => !!v || 'El título es requerido']"
        />

        <q-input
          v-model="form.description"
          label="Descripción detallada"
          filled
          dense
          type="textarea"
          rows="3"
          :rules="[v => !!v || 'La descripción es requerida']"
        />

        <div class="row q-col-gutter-md">
          <div class="col-6">
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
          <div class="col-6">
            <q-select
              v-model="form.category"
              :options="categoryOptions"
              label="Categoría"
              filled
              dense
              emit-value
              map-options
            />
          </div>
        </div>

        <q-select
          v-model="form.affectedTasks"
          :options="taskOptions"
          label="Tareas Afectadas"
          filled
          dense
          multiple
          emit-value
          map-options
          use-chips
          stack-label
        />

        <q-input
          v-if="isEdit"
          v-model="form.resolutionNotes"
          label="Notas de Resolución"
          filled
          dense
          type="textarea"
          rows="2"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup @click="close" />
        <q-btn
          color="primary"
          :label="isEdit ? 'Actualizar' : 'Crear'"
          :loading="loading"
          :disable="!form.title || !form.description"
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
  evaluationId?: string
  problem?: any
  tasks?: any[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const isEdit = computed(() => !!props.problem)

const severityOptions = [
  { label: 'Crítico', value: 'critical' },
  { label: 'Alto', value: 'high' },
  { label: 'Medio', value: 'medium' },
  { label: 'Bajo', value: 'low' }
]

const categoryOptions = [
  { label: 'Diseño', value: 'design' },
  { label: 'Funcionalidad', value: 'functionality' },
  { label: 'Navegación', value: 'navigation' },
  { label: 'Contenido', value: 'content' },
  { label: 'Rendimiento', value: 'performance' },
  { label: 'Accesibilidad', value: 'accessibility' },
  { label: 'Usabilidad', value: 'usability' },
  { label: 'Otro', value: 'other' }
]

const taskOptions = computed(() => {
  return (props.tasks || []).map(task => ({
    label: task.title,
    value: task.id
  }))
})

const form = ref({
  title: '',
  description: '',
  severity: 'medium',
  category: 'usability',
  affectedTasks: [],
  resolutionNotes: ''
})

watch(() => props.problem, (val) => {
  if (val) {
    form.value = {
      title: val.title || '',
      description: val.description || '',
      severity: val.severity || 'medium',
      category: val.category || 'usability',
      affectedTasks: val.affectedTasks || [],
      resolutionNotes: val.resolutionNotes || ''
    }
  }
}, { immediate: true })

const save = async () => {
  if (!form.value.title || !form.value.description) return

  loading.value = true
  try {
    const data = {
      evaluationId: props.evaluationId,
      ...form.value
    }
    
    if (isEdit.value && props.problem) {
      data.id = props.problem.id
    }
    
    emit('save', data)
    close()
  } finally {
    loading.value = false
  }
}

const close = () => {
  visible.value = false
  if (!isEdit.value) {
    form.value = {
      title: '',
      description: '',
      severity: 'medium',
      category: 'usability',
      affectedTasks: [],
      resolutionNotes: ''
    }
  }
}
</script>