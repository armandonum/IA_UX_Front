<!-- QuestionnaireModal.vue -->
<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div class="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
      <h2 class="text-xl font-semibold mb-1">{{ questionnaire.title }}</h2>
      <p v-if="questionnaire.description" class="text-sm text-gray-500 mb-4">
        {{ questionnaire.description }}
      </p>

      <div v-if="loading" class="py-10 text-center text-gray-500">
        Cargando cuestionario…
      </div>

      <form v-else @submit.prevent="enviar" class="space-y-6">
        <div
          v-for="(question, idx) in questionsWithOptions"
          :key="question.questionId"
          class="border-b border-gray-100 pb-4 last:border-none"
        >
          <label class="block font-medium mb-2">
            {{ idx + 1 }}. {{ question.questionText }}
            <span v-if="question.isRequired" class="text-red-500">*</span>
          </label>

          <!-- short / long text -->
          <input
            v-if="question.questionType === 'short_text'"
            v-model="respuestas[question.questionId].answerText"
            type="text"
            class="w-full rounded border border-gray-300 px-3 py-2"
          />
          <textarea
            v-else-if="question.questionType === 'long_text'"
            v-model="respuestas[question.questionId].answerText"
            rows="3"
            class="w-full rounded border border-gray-300 px-3 py-2"
          />

          <!-- single choice -->
          <div v-else-if="question.questionType === 'single_choice'" class="space-y-1">
            <label
              v-for="opt in question.options"
              :key="opt.optionId"
              class="flex items-center gap-2"
            >
              <input
                type="radio"
                :name="question.questionId"
                :value="opt.optionId"
                v-model="respuestas[question.questionId].selectedOptionId"
              />
              {{ opt.label }}
            </label>
            <div v-if="!question.options?.length" class="text-sm text-gray-400">
              No hay opciones disponibles
            </div>
          </div>

          <!-- multi choice -->
          <div v-else-if="question.questionType === 'multi_choice'" class="space-y-1">
            <label
              v-for="opt in question.options"
              :key="opt.optionId"
              class="flex items-center gap-2"
            >
              <input
                type="checkbox"
                :value="opt.optionId"
                v-model="respuestas[question.questionId].selectedOptionIds"
              />
              {{ opt.label }}
            </label>
            <div v-if="!question.options?.length" class="text-sm text-gray-400">
              No hay opciones disponibles
            </div>
          </div>

          <!-- scale -->
          <div v-else-if="question.questionType === 'scale'" class="flex items-center gap-2">
            <span class="text-sm text-gray-500">{{ question.scaleMin ?? 1 }}</span>
            <input
              type="range"
              :min="question.scaleMin ?? 1"
              :max="question.scaleMax ?? 5"
              v-model.number="respuestas[question.questionId].scaleValue"
              class="flex-1"
            />
            <span class="text-sm text-gray-500">{{ question.scaleMax ?? 5 }}</span>
            <span class="w-6 text-center font-medium">
              {{ respuestas[question.questionId].scaleValue }}
            </span>
          </div>

          <!-- boolean -->
          <div v-else-if="question.questionType === 'boolean'" class="flex gap-4">
            <label class="flex items-center gap-2">
              <input
                type="radio"
                :name="question.questionId"
                :value="true"
                v-model="respuestas[question.questionId].booleanValue"
              />
              Sí
            </label>
            <label class="flex items-center gap-2">
              <input
                type="radio"
                :name="question.questionId"
                :value="false"
                v-model="respuestas[question.questionId].booleanValue"
              />
              No
            </label>
          </div>

          <label v-if="question.allowNotApplicable" class="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <input type="checkbox" v-model="respuestas[question.questionId].isNotApplicable" />
            No aplica
          </label>
        </div>

        <p v-if="errorValidacion" class="text-sm text-red-600">{{ errorValidacion }}</p>

        <button
          type="submit"
          class="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          :disabled="enviando"
        >
          {{ enviando ? 'Enviando…' : tituloBoton }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import type { Questionnaire, QuestionAnswer } from '@/types/usability'

const props = defineProps<{
  show: boolean
  questionnaire: Questionnaire
  loading?: boolean
  tituloBoton?: string
}>()

const emit = defineEmits<{
  (e: 'enviar', answers: QuestionAnswer[]): void
}>()

const tituloBoton = props.tituloBoton ?? 'Enviar'
const enviando = ref(false)
const errorValidacion = ref<string | null>(null)

const questionsWithOptions = computed(() => {
  if (!props.questionnaire?.questions) return []
  
  console.log('🔍 Procesando preguntas:', props.questionnaire.questions)
  
  return props.questionnaire.questions.map(question => {
    // Asegurar que las opciones son un array
    if (question.questionType === 'single_choice' || question.questionType === 'multi_choice') {
      const options = question.options || []
      
      console.log(`📋 Pregunta ${question.questionId} tiene ${options.length} opciones:`, options)
      return {
        ...question,
        options: options
      }
    }
    return question
  })
})
type RespuestaLocal = QuestionAnswer & Record<string, unknown>
const respuestas = reactive<Record<string, RespuestaLocal>>({})

function inicializarRespuestas() {
  if (!props.questionnaire?.questions) return
  
  for (const q of props.questionnaire.questions) {
    respuestas[q.questionId] = {
      questionId: q.questionId,
      answerText: '',
      selectedOptionId: null,
      selectedOptionIds: [],
      scaleValue: q.scaleMin ?? 1,
      booleanValue: null,
      isNotApplicable: false,
    }
  }
}

// 🔥 Debug: Ver qué datos llegan
watch(() => props.questionnaire, (newVal) => {
  console.log('📋 Cuestionario recibido:', newVal)
  if (newVal?.questions) {
    newVal.questions.forEach((q, i) => {
      console.log(`Pregunta ${i+1}:`, q.questionType, 'Opciones:', q.options?.length || 0)
    })
  }
  inicializarRespuestas()
}, { deep: true, immediate: true })

function validar(): boolean {
  for (const q of props.questionnaire.questions) {
    const r = respuestas[q.questionId]
    if (!q.isRequired || r.isNotApplicable) continue

    const vacio =
      (q.questionType === 'short_text' || q.questionType === 'long_text') && !r.answerText?.trim() ||
      q.questionType === 'single_choice' && !r.selectedOptionId ||
      q.questionType === 'multi_choice' && (!r.selectedOptionIds || r.selectedOptionIds.length === 0) ||
      q.questionType === 'boolean' && r.booleanValue === null

    if (vacio) {
      errorValidacion.value = 'Por favor responde todas las preguntas obligatorias.'
      return false
    }
  }
  errorValidacion.value = null
  return true
}

async function enviar() {
  if (!validar()) return
  enviando.value = true
  try {
    emit('enviar', Object.values(respuestas))
  } finally {
    enviando.value = false
  }
}
</script>