<!-- components/coordinador/heuristic/detail/HeuristicFindingEditModal.vue -->
<template>
  <q-dialog v-model="localOpen" persistent>
    <q-card style="min-width: 550px; max-width: 700px">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">✏️ Editar Hallazgo</div>
        <div class="text-subtitle2">Ajusta los detalles antes de guardar</div>
      </q-card-section>

      <q-form @submit.prevent="save">
        <q-card-section class="q-gutter-md" style="max-height: 65vh; overflow-y: auto">
          <!-- Tipo -->
          <q-select
            v-model="form.type"
            filled
            :options="typeOptions"
            label="Tipo"
            emit-value
            map-options
            dense
          />

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-select
                v-model="form.severity"
                filled
                :options="severityOptions"
                label="Severidad"
                emit-value
                map-options
                dense
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="form.impact"
                filled
                :options="impactOptions"
                label="Impacto"
                emit-value
                map-options
                dense
              />
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-select
                v-model="form.priority"
                filled
                :options="priorityOptions"
                label="Prioridad"
                emit-value
                map-options
                dense
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="form.frequency"
                filled
                dense
                type="number"
                label="Frecuencia"
                min="1"
              />
            </div>
          </div>

          <!-- Descripción -->
          <q-input
            v-model="form.description"
            filled
            dense
            type="textarea"
            autogrow
            label="Descripción *"
            :rules="[v => !!v || 'Requerido']"
          />

          <!-- Recomendación -->
          <q-input
            v-model="form.recommendation"
            filled
            dense
            type="textarea"
            autogrow
            label="Recomendación"
          />

          <!-- Info contextual (solo lectura) -->
          <div class="row q-col-gutter-md">
            <div v-if="form.nodeId" class="col-6">
              <div class="text-caption text-grey-7">Nodo (Figma)</div>
              <div class="text-caption font-mono">{{ form.nodeId }}</div>
            </div>
            <div v-if="form.emotionInferred" class="col-6">
              <div class="text-caption text-grey-7">Emoción</div>
              <div class="text-caption">
                {{ getEmotionLabel(form.emotionInferred) }}
              </div>
            </div>
            <div v-if="form.textualSentiment" class="col-6">
              <div class="text-caption text-grey-7">Sentimiento</div>
              <div class="text-caption">{{ form.textualSentiment }}</div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="close" />
          <q-btn
            unelevated
            color="primary"
            type="submit"
            label="Guardar"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { getEmotionLabel as getEmotionLabelDict } from '@/data/heuristicFindingsDictionary'
import type { GeneratedFinding } from '@/composables/coordinator/heuristic/useHeuristicFindingsGenerator'

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
  set: val => emit('update:modelValue', val),
})

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

const form = reactive<Partial<GeneratedFinding>>({
  type: 'problem',
  severity: 'medium',
  impact: 'medium',
  priority: 'medium',
  frequency: 1,
  description: '',
  recommendation: '',
})

watch(
  () => props.finding,
  newFinding => {
    if (newFinding) {
      Object.assign(form, newFinding)
    }
  },
  { immediate: true },
)

function close() {
  emit('update:modelValue', false)
}

function save() {
  if (!props.finding) return
  emit('save', { ...props.finding, ...form } as GeneratedFinding)
  close()
}

function getEmotionLabel(emotion: string): string {
  return getEmotionLabelDict(emotion)
}
</script>