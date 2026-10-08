<!-- components/experto/cognitive/CognitiveQuestions.vue -->
<template>
  <div class="questions-panel column full-height">
    <!-- ============================================================ -->
    <!-- HEADER FIJO                                                   -->
    <!-- ============================================================ -->
    <div class="questions-header q-pa-md">
      <div class="row items-center q-gutter-xs q-mb-xs">
        <q-chip
          color="primary"
          text-color="white"
          dense
          size="sm"
        >
          Paso {{ stepIndex + 1 }} / {{ totalSteps }}
        </q-chip>
        <q-badge
          v-if="isCompleted"
          color="positive"
          text-color="white"
        >
          <q-icon name="check" size="12px" class="q-mr-xs" />
          Completado
        </q-badge>
      </div>

      <div class="text-subtitle2 text-weight-bold q-mt-xs">
        {{ currentStep?.nodeId || 'Sin pasos definidos' }}
      </div>

      <div
        v-if="currentStep?.presentedNodeId"
        class="text-caption text-grey-6 q-mt-xs font-mono"
      >
        ID: {{ currentStep.presentedNodeId }}
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- AVISO SI NO HAY FLUJO                                         -->
    <!-- ============================================================ -->
    <q-banner
      v-if="flowClicks.length === 0"
      dense
      rounded
      class="bg-orange-1 text-orange-10 q-mx-md q-mb-md"
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>
      <div class="text-caption">
        Esta tarea no tiene un flujo ideal definido. Responde según tu criterio.
      </div>
    </q-banner>

    <!-- ============================================================ -->
    <!-- SCROLL DE PREGUNTAS                                           -->
    <!-- ============================================================ -->
    <div class="col scroll q-px-md q-pb-md">
      <!-- Estado: completado -->
      <q-card
        v-if="isCompleted"
        flat
        class="bg-green-1 q-mb-md"
      >
        <q-card-section class="q-pa-md">
          <div class="row items-center q-gutter-sm">
            <q-icon name="check_circle" size="32px" color="positive" />
            <div>
              <div class="text-subtitle2 text-weight-bold text-positive">
                ¡Paso {{ stepIndex + 1 }} completado!
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                {{ isLastStep
                  ? 'Has completado todos los pasos.'
                  : 'Continúa con el siguiente paso.' }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Preguntas del recorrido cognitivo -->
      <template v-else>
        <!-- Pregunta 1 -->
        <q-card flat bordered class="q-mb-sm question-card">
          <q-card-section class="q-pa-md">
            <div class="text-body2 text-weight-medium text-grey-8 q-mb-sm">
              <span class="text-primary text-weight-bold">1.</span>
              ¿El usuario intentará lograr el resultado correcto?
            </div>

            <div class="row q-gutter-xs q-mb-sm">
              <q-btn
                v-for="option in options"
                :key="option.value"
                :label="option.label"
                :color="response.q1 === option.value ? 'primary' : 'grey-5'"
                :outline="response.q1 !== option.value"
                :unelevated="response.q1 === option.value"
                size="sm"
                no-caps
                class="q-px-md"
                @click="response.q1 = option.value"
              />
            </div>

            <q-input
              v-model="response.q1Reasoning"
              dense
              outlined
              placeholder="Razonamiento..."
              :rows="2"
              type="textarea"
            />
          </q-card-section>
        </q-card>

        <!-- Pregunta 2 -->
        <q-card flat bordered class="q-mb-sm question-card">
          <q-card-section class="q-pa-md">
            <div class="text-body2 text-weight-medium text-grey-8 q-mb-sm">
              <span class="text-primary text-weight-bold">2.</span>
              ¿El usuario notará que la acción correcta está disponible?
            </div>

            <div class="row q-gutter-xs q-mb-sm">
              <q-btn
                v-for="option in options"
                :key="option.value"
                :label="option.label"
                :color="response.q2 === option.value ? 'primary' : 'grey-5'"
                :outline="response.q2 !== option.value"
                :unelevated="response.q2 === option.value"
                size="sm"
                no-caps
                class="q-px-md"
                @click="response.q2 = option.value"
              />
            </div>

            <q-input
              v-model="response.q2Reasoning"
              dense
              outlined
              placeholder="Razonamiento..."
              :rows="2"
              type="textarea"
            />
          </q-card-section>
        </q-card>

        <!-- Pregunta 3 -->
        <q-card flat bordered class="q-mb-sm question-card">
          <q-card-section class="q-pa-md">
            <div class="text-body2 text-weight-medium text-grey-8 q-mb-sm">
              <span class="text-primary text-weight-bold">3.</span>
              ¿El usuario asociará la acción con el resultado deseado?
            </div>

            <div class="row q-gutter-xs q-mb-sm">
              <q-btn
                v-for="option in options"
                :key="option.value"
                :label="option.label"
                :color="response.q3 === option.value ? 'primary' : 'grey-5'"
                :outline="response.q3 !== option.value"
                :unelevated="response.q3 === option.value"
                size="sm"
                no-caps
                class="q-px-md"
                @click="response.q3 = option.value"
              />
            </div>

            <q-input
              v-model="response.q3Reasoning"
              dense
              outlined
              placeholder="Razonamiento..."
              :rows="2"
              type="textarea"
            />
          </q-card-section>
        </q-card>

        <!-- Pregunta 4 -->
        <q-card flat bordered class="q-mb-md question-card">
          <q-card-section class="q-pa-md">
            <div class="text-body2 text-weight-medium text-grey-8 q-mb-sm">
              <span class="text-primary text-weight-bold">4.</span>
              ¿El usuario verá que está progresando?
            </div>

            <div class="row q-gutter-xs q-mb-sm">
              <q-btn
                v-for="option in options"
                :key="option.value"
                :label="option.label"
                :color="response.q4 === option.value ? 'primary' : 'grey-5'"
                :outline="response.q4 !== option.value"
                :unelevated="response.q4 === option.value"
                size="sm"
                no-caps
                class="q-px-md"
                @click="response.q4 = option.value"
              />
            </div>

            <q-input
              v-model="response.q4Reasoning"
              dense
              outlined
              placeholder="Razonamiento..."
              :rows="2"
              type="textarea"
            />
          </q-card-section>
        </q-card>

        <!-- Problemas y sugerencias -->
        <q-expansion-item
          icon="flag"
          label="Problemas y sugerencias"
          caption="Opcional"
          header-class="bg-grey-2 text-grey-8 rounded-borders"
          expand-icon-class="text-primary"
          class="q-mb-sm"
        >
          <q-card flat>
            <q-card-section class="q-gutter-sm">
              <q-input
                v-model="response.problemIdentified"
                dense
                outlined
                type="textarea"
                :rows="2"
                label="Problema identificado"
                placeholder="¿Qué problema de usabilidad identificaste?"
              />

              <q-input
                v-model="response.designSuggestion"
                dense
                outlined
                type="textarea"
                :rows="2"
                label="Sugerencia de diseño"
                placeholder="¿Cómo se podría mejorar este paso?"
              />

              <q-input
                v-model="response.otherComments"
                dense
                outlined
                type="textarea"
                :rows="2"
                label="Otros comentarios"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </template>
    </div>

    <!-- ============================================================ -->
    <!-- FOOTER FIJO CON BOTONES                                       -->
    <!-- ============================================================ -->
    <div class="questions-footer q-pa-md">
      <template v-if="!isCompleted">
        <div class="row q-gutter-sm">
          <q-btn
            unelevated
            color="primary"
            icon="save"
            label="Guardar respuesta"
            class="col"
            no-caps
            :disable="!isResponseValid"
            :loading="saving"
            @click="saveResponse"
          />

          <q-btn
            v-if="!isLastStep"
            flat
            color="grey-7"
            icon="skip_next"
            label="Saltar"
            no-caps
            @click="skipStep"
          />
        </div>
      </template>

      <template v-else>
        <q-btn
          v-if="isLastStep"
          unelevated
          color="positive"
          icon="check_circle"
          label="Completar tarea"
          class="full-width"
          no-caps
          size="md"
          @click="$emit('complete')"
        />
        <q-btn
          v-else
          unelevated
          color="warning"
          icon="arrow_forward"
          label="Siguiente paso"
          class="full-width"
          no-caps
          size="md"
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

function saveResponse() {
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

function skipStep() {
  emit('skip')
}

watch(
  () => props.currentStepIndex,
  (newIndex) => {
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
      stepIndex: newIndex,
      flowClickId: currentStep.value?.clickId || null,
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.questions-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.questions-header {
  flex-shrink: 0;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.questions-footer {
  flex-shrink: 0;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.question-card {
  background: white;
  transition: border-color 0.15s;
}

.question-card:hover {
  border-color: #94a3b8;
}

.bg-green-1 {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.font-mono {
  font-family: 'Courier New', monospace;
}
</style>