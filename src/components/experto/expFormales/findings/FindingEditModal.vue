<!-- components/findings/FindingEditModal.vue -->
<template>
  <q-dialog v-model="localOpen" persistent>
    <q-card style="min-width: 550px; max-width: 700px;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">✏️ Editar Hallazgo</div>
        <div class="text-subtitle2">Revisa y ajusta los detalles del hallazgo</div>
      </q-card-section>

      <q-form @submit.prevent="save">
        <q-card-section class="q-gutter-md">
          <!-- Tipo -->
          <q-select
            v-model="form.type"
            filled
            :options="typeOptions"
            label="Tipo"
            emit-value
            map-options
          />

          <!-- Severidad -->
          <q-select
            v-model="form.severity"
            filled
            :options="severityOptions"
            label="Severidad"
            emit-value
            map-options
          />

          <!-- Impacto -->
          <q-select
            v-model="form.impact"
            filled
            :options="impactOptions"
            label="Impacto"
            emit-value
            map-options
          />

          <!-- Prioridad -->
          <q-select
            v-model="form.priority"
            filled
            :options="priorityOptions"
            label="Prioridad"
            emit-value
            map-options
          />

          <!-- Descripción -->
          <q-input
            v-model="form.description"
            filled
            type="textarea"
            autogrow
            label="Descripción"
            :rules="[(v) => !!v || 'Campo obligatorio']"
          />

          <!-- Recomendación -->
          <q-input
            v-model="form.recommendation"
            filled
            type="textarea"
            autogrow
            label="Recomendación"
          />

          <!-- Frecuencia -->
          <q-input
            v-model.number="form.frequency"
            filled
            type="number"
            label="Frecuencia"
            min="1"
          />

          <!-- Estado -->
          <q-select
            v-model="form.status"
            filled
            :options="statusOptions"
            label="Estado"
            emit-value
            map-options
          />

          <!-- Info adicional (solo lectura) -->
          <div class="row q-gutter-md">
            <div v-if="form.nodeId" class="col">
              <div class="text-caption text-grey-7">Nodo</div>
              <div class="text-caption font-mono">{{ form.nodeId }}</div>
            </div>
            <div v-if="form.emotionInferred" class="col">
              <div class="text-caption text-grey-7">Emoción</div>
              <div class="text-caption">{{ form.emotionInferred }}</div>
            </div>
            <div v-if="form.textualSentiment" class="col">
              <div class="text-caption text-grey-7">Sentimiento</div>
              <div class="text-caption">{{ form.textualSentiment }}</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="close" />
          <q-btn
            unelevated
            color="primary"
            type="submit"
            label="Guardar"
            :loading="saving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { GeneratedFinding } from '@/types/expert/findings.types'

const props = defineProps<{
  modelValue: boolean
  finding: GeneratedFinding | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', finding: GeneratedFinding): void
}>()

const localOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const saving = ref(false)

const typeOptions = [
  { label: 'Usabilidad', value: 'usability' },
  { label: 'Emocional', value: 'emotional' },
  { label: 'Sentimiento', value: 'sentiment' },
  { label: 'Experto', value: 'expert' },
  { label: 'Mixto', value: 'mixed' },
]

const severityOptions = [
  { label: 'Crítico', value: 'critical' },
  { label: 'Alto', value: 'high' },
  { label: 'Medio', value: 'medium' },
  { label: 'Bajo', value: 'low' },
  { label: 'Informativo', value: 'info' },
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
  { label: 'Revisado', value: 'reviewed' },
  { label: 'Aprobado', value: 'approved' },
  { label: 'Rechazado', value: 'rejected' },
]

const form = reactive<Partial<GeneratedFinding>>({
  type: 'usability',
  severity: 'medium',
  impact: 'medium',
  priority: 'medium',
  status: 'pending',
  frequency: 1,
  description: '',
  recommendation: '',
})

watch(() => props.finding, (newFinding) => {
  if (newFinding) {
    Object.assign(form, newFinding)
  }
}, { immediate: true })

function close() {
  emit('update:modelValue', false)
}

async function save() {
  saving.value = true
  try {
    emit('save', { ...props.finding, ...form } as GeneratedFinding)
    close()
  } catch (error) {
    // Error manejado en el padre
  } finally {
    saving.value = false
  }
}
</script>