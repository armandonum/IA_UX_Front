<template>
  <div class="column full-height q-pa-md">
    <div class="col full-height overflow-y-auto">
      <!-- Encabezado -->
      <div class="q-mb-lg">
        <div class="text-caption text-grey-6">
          Paso {{ stepIndex + 1 }} de {{ totalSteps }}
        </div>
        <h4 class="text-h6 text-white q-mb-xs">
          {{ currentStep?.nodeId || 'Sin pasos definidos' }}
        </h4>
        <div v-if="currentStep?.presentedNodeId" class="text-caption text-grey-5">
          <q-icon name="mdi-code" size="14px" />
          ID: {{ currentStep.presentedNodeId }}
        </div>
        <div v-if="flowClicks.length === 0" class="text-body2 text-warning q-mt-md">
          <q-icon name="mdi-alert" size="16px" class="q-mr-xs" />
          Esta tarea no tiene un flujo ideal definido. Responde según tu criterio.
        </div>
      </div>

      <!-- Estado del paso -->
      <div v-if="isCompleted" class="bg-positive/20 border border-positive/30 rounded-borders q-pa-md q-mb-lg">
        <div class="row items-center gap-2 text-positive">
          <q-icon name="mdi-check-circle" size="24px" />
          <span class="text-weight-bold">¡Paso {{ stepIndex + 1 }} completado!</span>
        </div>
        <p class="text-body2 text-grey-5 q-mt-sm">
          {{ isLastStep ? 'Has completado todos los pasos de esta tarea.' : 'Continúa con el siguiente paso.' }}
        </p>
      </div>

      <!-- Preguntas del recorrido cognitivo -->
      <div v-if="!isCompleted" class="q-gutter-y-md">
        <!-- Pregunta 1 -->
        <div class="bg-secondary rounded-borders q-pa-md">
          <div class="text-body2 text-weight-medium text-grey-4 q-mb-sm">
            1. ¿El usuario intentará lograr el resultado correcto?
          </div>
          <div class="row q-gutter-xs">
            <q-btn
              v-for="option in options"
              :key="option.value"
              :label="option.label"
              :color="response.q1 === option.value ? 'warning' : 'grey-7'"
              size="sm"
              no-caps
              @click="response.q1 = option.value"
            />
          </div>
          <q-input
            v-model="response.q1Reasoning"
            label="Razonamiento"
            dense
            dark
            color="white"
            filled
            class="q-mt-sm"
            placeholder="Explica tu razonamiento..."
          />
        </div>

        <!-- Pregunta 2 -->
        <div class="bg-secondary rounded-borders q-pa-md">
          <div class="text-body2 text-weight-medium text-grey-4 q-mb-sm">
            2. ¿El usuario notará que la acción correcta está disponible?
          </div>
          <div class="row q-gutter-xs">
            <q-btn
              v-for="option in options"
              :key="option.value"
              :label="option.label"
              :color="response.q2 === option.value ? 'warning' : 'grey-7'"
              size="sm"
              no-caps
              @click="response.q2 = option.value"
            />
          </div>
          <q-input
            v-model="response.q2Reasoning"
            label="Razonamiento"
            dense
            dark
            color="white"
            filled
            class="q-mt-sm"
            placeholder="Explica tu razonamiento..."
          />
        </div>

        <!-- Pregunta 3 -->
        <div class="bg-secondary rounded-borders q-pa-md">
          <div class="text-body2 text-weight-medium text-grey-4 q-mb-sm">
            3. ¿El usuario asociará la acción correcta con el resultado deseado?
          </div>
          <div class="row q-gutter-xs">
            <q-btn
              v-for="option in options"
              :key="option.value"
              :label="option.label"
              :color="response.q3 === option.value ? 'warning' : 'grey-7'"
              size="sm"
              no-caps
              @click="response.q3 = option.value"
            />
          </div>
          <q-input
            v-model="response.q3Reasoning"
            label="Razonamiento"
            dense
            dark
            color="white"
            filled
            class="q-mt-sm"
            placeholder="Explica tu razonamiento..."
          />
        </div>

        <!-- Pregunta 4 -->
        <div class="bg-secondary rounded-borders q-pa-md">
          <div class="text-body2 text-weight-medium text-grey-4 q-mb-sm">
            4. ¿El usuario verá que está progresando?
          </div>
          <div class="row q-gutter-xs">
            <q-btn
              v-for="option in options"
              :key="option.value"
              :label="option.label"
              :color="response.q4 === option.value ? 'warning' : 'grey-7'"
              size="sm"
              no-caps
              @click="response.q4 = option.value"
            />
          </div>
          <q-input
            v-model="response.q4Reasoning"
            label="Razonamiento"
            dense
            dark
            color="white"
            filled
            class="q-mt-sm"
            placeholder="Explica tu razonamiento..."
          />
        </div>

        <!-- Problemas y sugerencias -->
        <div class="bg-slate-100 text-slate-100 rounded-borders q-pa-md">
          <q-input
            v-model="response.problemIdentified"
            label="Problema identificado"
            dense
            filled
            type="textarea"
            rows="2"
            placeholder="¿Qué problema de usabilidad identificaste en este paso?"
          />
          <q-input
            v-model="response.designSuggestion"
            label="Sugerencia de diseño"
            dense
            filled
            type="textarea"
            rows="2"
            class="q-mt-sm"
            placeholder="¿Qué sugerencia de diseño tienes para mejorar este paso?"
          />
          <q-input
            v-model="response.otherComments"
            label="Otros comentarios"
            dense
            filled
            type="textarea"
            rows="2"
            class="q-mt-sm"
            placeholder="Comentarios adicionales..."
          />
        </div>
      </div>

      <!-- Resumen cuando está completo -->
      <div v-if="isCompleted" class="bg-secondary rounded-borders q-pa-md">
        <div class="q-gutter-y-sm">
          <div class="row justify-between text-body2">
            <span class="text-grey-5">Problemas identificados</span>
            <span class="text-grey-3">{{ response.problemIdentified || 'Ninguno' }}</span>
          </div>
          <div class="row justify-between text-body2">
            <span class="text-grey-5">Sugerencias</span>
            <span class="text-grey-3">{{ response.designSuggestion || 'Ninguna' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Botones de acción -->
    <div class="q-mt-md row q-gutter-sm border-top border-grey-7 q-pt-md">
      <template v-if="!isCompleted">
        <q-btn
          color="primary"
          label="Guardar Respuesta"
          class="col"
          :disable="!isResponseValid"
          :loading="saving"
          @click="saveResponse"
        />
        <q-btn
          v-if="!isLastStep"
          flat
          color="grey"
          label="Saltar"
          @click="skipStep"
        />
      </template>

      <template v-else>
        <q-btn
          v-if="isLastStep"
          color="positive"
          label="Completar Tarea"
          class="col"
          @click="$emit('complete')"
        />
        <q-btn
          v-else
          color="warning"
          label="Siguiente Paso"
          class="col"
          @click="$emit('next-step')"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  task: any
  flowClicks: any[]
  currentStepIndex: number
  totalSteps: number
  isLastStep: boolean
  isCompleted: boolean
}>()

const emit = defineEmits<{
  (e: 'save', data: any): void
  (e: 'skip'): void
  (e: 'complete'): void
  (e: 'next-step'): void
}>()

const saving = ref(false)

const options = [
  { label: 'Sí', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Incierto', value: 'uncertain' },
]

const currentStep = computed(() => {
  return props.flowClicks[props.currentStepIndex] || null
})

const response = ref({
  q1: null as string | null,
  q1Reasoning: '',
  q2: null as string | null,
  q2Reasoning: '',
  q3: null as string | null,
  q3Reasoning: '',
  q4: null as string | null,
  q4Reasoning: '',
  problemIdentified: '',
  designSuggestion: '',
  otherComments: '',
  stepIndex: 0,
  flowClickId: null as string | null,
})

const isResponseValid = computed(() => {
  return response.value.q1 && response.value.q2 && response.value.q3 && response.value.q4
})

const saveResponse = () => {
  if (!isResponseValid.value) return
  
  saving.value = true
  try {
    emit('save', {
      ...response.value,
      stepIndex: props.currentStepIndex,
      flowClickId: currentStep.value?.clickId || null,
      timeSpentSeconds: 0,
      success: true,
    })
  } finally {
    saving.value = false
  }
}

const skipStep = () => {
  emit('skip')
}

// Resetear respuesta cuando cambia el paso
watch(() => props.currentStepIndex, () => {
  response.value = {
    q1: null,
    q1Reasoning: '',
    q2: null,
    q2Reasoning: '',
    q3: null,
    q3Reasoning: '',
    q4: null,
    q4Reasoning: '',
    problemIdentified: '',
    designSuggestion: '',
    otherComments: '',
    stepIndex: props.currentStepIndex,
    flowClickId: currentStep.value?.clickId || null,
  }
}, { immediate: true })

// Actualizar stepIndex cuando cambia
watch(() => props.currentStepIndex, (newVal) => {
  response.value.stepIndex = newVal
  response.value.flowClickId = currentStep.value?.clickId || null
})
</script>