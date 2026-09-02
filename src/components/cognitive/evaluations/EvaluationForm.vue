<!-- components/evaluations/EvaluationForm.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 600px; max-width: 800px;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">
          {{ isEdit ? 'Editar Evaluación' : 'Nueva Evaluación Cognitiva' }}
        </div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-input
          v-model="form.name"
          label="Nombre de la evaluación"
          filled
          dense
          :rules="[v => !!v || 'El nombre es requerido']"
        />

        <q-input
          v-model="form.description"
          label="Descripción"
          filled
          dense
          type="textarea"
          rows="2"
        />

        <q-select
          v-model="form.projectId"
          label="Proyecto"
          filled
          dense
          :options="projects"
          option-label="projectName"
          option-value="projectId"
          emit-value
          map-options
          :rules="[v => !!v || 'Selecciona un proyecto']"
        />

        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-input
              v-model.number="form.maxDurationMinutes"
              label="Duración máxima (minutos)"
              filled
              dense
              type="number"
              min="1"
            />
          </div>
          <div class="col-6">
       <div class="col-6">
  <q-input
    :model-value="props.currentUserName || 'Sin asignar'"
    label="Supervisor"
    filled
    dense
    readonly
  />
</div>
          </div>
        </div>

        <q-input
          v-model="form.targetUserDescription"
          label="Descripción del usuario objetivo"
          filled
          dense
          placeholder="Ej: Turistas nacionales y extranjeros"
        />

        <q-input
          v-model="form.systemDescription"
          label="Descripción del sistema"
          filled
          dense
          placeholder="Ej: Aplicación de sistema turístico"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup @click="close" />
        <q-btn
          color="primary"
          :label="isEdit ? 'Actualizar' : 'Crear'"
          :loading="loading"
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
  evaluation?: any
  projects: any[]
  currentUserId?: string
  currentUserName?: string
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
const isEdit = computed(() => !!props.evaluation)

const form = ref({
  name: '',
  description: '',
  projectId: '',
  supervisorId: '',
  maxDurationMinutes: 20,
  targetUserDescription: '',
  systemDescription: '',
})

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    projectId: '',
    supervisorId: props.currentUserId || '',
    maxDurationMinutes: 20,
    targetUserDescription: '',
    systemDescription: '',
  }
}



watch(() => props.evaluation, (val) => {
  if (val) {
    form.value = {
      name: val.name || '',
      description: val.description || '',
      projectId: val.projectId || '',
      supervisorId: props.currentUserId || '',   
      maxDurationMinutes: val.maxDurationMinutes || 20,
      targetUserDescription: val.targetUserDescription || '',
      systemDescription: val.systemDescription || '',
    }
  } else {
    resetForm()
  }
}, { immediate: true })


const close = () => {
  visible.value = false
  resetForm()
}

const save = async () => {
  if (!form.value.name || !form.value.projectId) {
    return
  }
  loading.value = true
  try {
    await emit('save', { ...form.value })
    close()
  } finally {
    loading.value = false
  }
}
</script>