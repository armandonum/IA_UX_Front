<!-- components/recommendations/RecommendationForm.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 500px; max-width: 700px;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Crear Recomendaciones</div>
        <div class="text-subtitle2">Genera recomendaciones basadas en los problemas identificados</div>
      </q-card-section>

      <q-card-section>
        <div class="text-sm text-slate-500 q-mb-md">
          Las recomendaciones ayudan a resolver los problemas de usabilidad identificados
        </div>

        <div class="space-y-4">
          <div
            v-for="(rec, index) in recommendations"
            :key="index"
            class="bg-slate-700/50 p-4 rounded-lg"
          >
            <div class="flex items-center justify-between q-mb-2">
              <span class="text-sm font-semibold text-slate-300">Recomendación {{ index + 1 }}</span>
              <q-btn
                icon="close"
                flat
                dense
                size="sm"
                color="negative"
                @click="removeRecommendation(index)"
                :disable="recommendations.length === 1"
              />
            </div>

            <div class="q-gutter-y-sm">
              <q-input
                v-model="rec.title"
                label="Título"
                filled
                dense
                placeholder="Ej: Mejorar conectividad de botones"
              />
              <q-input
                v-model="rec.description"
                label="Descripción"
                filled
                dense
                type="textarea"
                rows="2"
                placeholder="Describe la recomendación en detalle..."
              />
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-select
                    v-model="rec.problemId"
                    :options="problemOptions"
                    label="Problema Relacionado"
                    filled
                    dense
                    emit-value
                    map-options
                    clearable
                  />
                </div>
                <div class="col-6">
                  <q-select
                    v-model="rec.recommendationType"
                    :options="typeOptions"
                    label="Tipo"
                    filled
                    dense
                    emit-value
                    map-options
                  />
                </div>
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-select
                    v-model="rec.priority"
                    :options="priorityOptions"
                    label="Prioridad"
                    filled
                    dense
                    emit-value
                    map-options
                  />
                </div>
              </div>
            </div>
          </div>

          <q-btn
            flat
            color="primary"
            icon="add"
            label="Agregar otra recomendación"
            size="sm"
            @click="addRecommendation"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup @click="close" />
        <q-btn
          color="primary"
          label="Guardar Recomendaciones"
          :loading="loading"
          :disable="!hasValidRecommendations"
          @click="save"
        />
        <span class="text-xs text-slate-500 q-ml-sm">
          {{ recommendations.filter(r => r.title && r.description).length }} válidas
        </span>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  evaluationId?: string
  problems: any[]
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

const priorityOptions = [
  { label: 'Crítico', value: 'critical' },
  { label: 'Alto', value: 'high' },
  { label: 'Medio', value: 'medium' },
  { label: 'Bajo', value: 'low' }
]

const typeOptions = [
  { label: 'Cambio de Diseño', value: 'design_change' },
  { label: 'Nueva Funcionalidad', value: 'feature_addition' },
  { label: 'Actualización de Contenido', value: 'content_update' },
  { label: 'Mejora de Conectividad', value: 'connectivity_improvement' }
]

const problemOptions = computed(() => {
  return (props.problems || [])
    .filter(p => p.status === 'identified' || p.status === 'analyzing')
    .map(p => ({
      label: `${p.title} (${p.severity})`,
      value: p.id
    }))
})

interface Recommendation {
  title: string
  description: string
  problemId: string | null
  recommendationType: string
  priority: string
}

const recommendations = ref<Recommendation[]>([
  {
    title: '',
    description: '',
    problemId: null,
    recommendationType: 'design_change',
    priority: 'medium'
  }
])

const hasValidRecommendations = computed(() => {
  return recommendations.value.some(r => r.title.trim() && r.description.trim())
})

const addRecommendation = () => {
  recommendations.value.push({
    title: '',
    description: '',
    problemId: null,
    recommendationType: 'design_change',
    priority: 'medium'
  })
}

const removeRecommendation = (index: number) => {
  if (recommendations.value.length > 1) {
    recommendations.value.splice(index, 1)
  }
}

const save = async () => {
  const valid = recommendations.value.filter(r => r.title.trim() && r.description.trim())
  if (valid.length === 0) return

  loading.value = true
  try {
    emit('save', {
      evaluationId: props.evaluationId,
      recommendations: valid.map(r => ({
        ...r,
        problemId: r.problemId || null,
        recommendationType: r.recommendationType || null
      }))
    })
    close()
  } finally {
    loading.value = false
  }
}

const close = () => {
  visible.value = false
  recommendations.value = [{
    title: '',
    description: '',
    problemId: null,
    recommendationType: 'design_change',
    priority: 'medium'
  }]
}
</script>