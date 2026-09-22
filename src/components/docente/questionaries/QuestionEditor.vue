<template>
  <q-card flat bordered>
    <q-card-section>
      <q-input
        v-model="local.questionText"
        filled
        type="textarea"
        autogrow
        label="Texto de la pregunta"
        @blur="persist"
      />
    </q-card-section>

    <q-separator />

    <q-card-section class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="local.questionType"
          filled
          :options="typeOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          label="Tipo de pregunta"
          @update:model-value="onTypeChange"
        />
      </div>

      <div class="col-12 col-md-3 flex items-center">
        <q-checkbox v-model="local.isRequired" label="Obligatoria" @update:model-value="persist" />
      </div>

      <div class="col-12 col-md-3 flex items-center" v-if="local.questionType === 'scale'">
        <q-checkbox v-model="local.allowNotApplicable" label="Permitir N/A" @update:model-value="persist" />
      </div>
    </q-card-section>

    <!-- Configuración de escala -->
    <q-card-section v-if="local.questionType === 'scale'" class="row q-col-gutter-md">
      <div class="col-6">
        <q-input v-model.number="local.scaleMin" filled type="number" label="Valor mínimo" @blur="persist" />
      </div>
      <div class="col-6">
        <q-input v-model.number="local.scaleMax" filled type="number" label="Valor máximo" @blur="persist" />
      </div>
    </q-card-section>

    <!-- Opciones (single/multi choice) -->
    <q-card-section v-if="isChoiceType">
      <div class="text-subtitle2 q-mb-sm">Opciones</div>

      <div
        v-for="option in options"
        :key="option.optionId"
        class="row items-center q-col-gutter-sm q-mb-sm"
      >
        <div class="col">
          <q-input
            :model-value="option.label"
            filled
            dense
            @update:model-value="val => renameOption(option, val)"
          />
        </div>
        <div class="col-auto">
          <q-btn flat dense round icon="delete" color="negative" @click="removeOption(option)" />
        </div>
      </div>

      <q-btn flat dense icon="add" label="Agregar opción" color="primary" @click="addOption" />
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn flat color="negative" icon="delete" label="Eliminar pregunta" @click="confirmDelete" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useQuestionnaireStore } from '@/stores/questionnaire.store'
import type { Question, QuestionType } from '@/types/questionnaire.types'

const props = defineProps<{ question: Question }>()
const emit = defineEmits<{ (e: 'updated'): void }>()

const $q = useQuasar()
const store = useQuestionnaireStore()

const typeOptions: { label: string; value: QuestionType }[] = [
  { label: 'Texto corto', value: 'short_text' },
  { label: 'Texto largo', value: 'long_text' },
  { label: 'Opción única', value: 'single_choice' },
  { label: 'Opción múltiple', value: 'multi_choice' },
  { label: 'Escala (1-7)', value: 'scale' },
  { label: 'Sí / No', value: 'boolean' },
]

const local = reactive({
  questionText: props.question.questionText,
  questionType: props.question.questionType,
  isRequired: props.question.isRequired,
  scaleMin: props.question.scaleMin ?? 1,
  scaleMax: props.question.scaleMax ?? 7,
  allowNotApplicable: props.question.allowNotApplicable ?? false,
})

// si cambia la pregunta seleccionada desde la lista, sincroniza el formulario local
watch(
  () => props.question.questionId,
  () => {
    local.questionText = props.question.questionText
    local.questionType = props.question.questionType
    local.isRequired = props.question.isRequired
    local.scaleMin = props.question.scaleMin ?? 1
    local.scaleMax = props.question.scaleMax ?? 7
    local.allowNotApplicable = props.question.allowNotApplicable ?? false
    loadOptionsIfNeeded()
  },
)

const isChoiceType = computed(
  () => local.questionType === 'single_choice' || local.questionType === 'multi_choice',
)

const options = computed(
  () => store.questionOptions[props.question.questionId] ?? [],
)

async function loadOptionsIfNeeded() {
  if (isChoiceType.value) {
    await store.fetchOptions(props.question.questionId)
  }
}
loadOptionsIfNeeded()

async function persist() {
  try {
    await store.updateQuestion(props.question.questionId, {
      questionText: local.questionText,
      questionType: local.questionType,
      isRequired: local.isRequired,
      scaleMin: local.questionType === 'scale' ? local.scaleMin : null,
      scaleMax: local.questionType === 'scale' ? local.scaleMax : null,
      allowNotApplicable: local.questionType === 'scale' ? local.allowNotApplicable : false,
    })
    emit('updated')
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo guardar la pregunta' })
  }
}

async function onTypeChange() {
  await persist()
  await loadOptionsIfNeeded()
}

async function addOption() {
  try {
    await store.createOption({
      questionId: props.question.questionId,
      label: 'Nueva opción',
      orderIndex: options.value.length + 1,
    })
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo agregar la opción' })
  }
}

async function renameOption(option: any, label: string) {
  try {
    await store.updateOption(option.optionId, { label })
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo renombrar la opción' })
  }
}

async function removeOption(option: any) {
  try {
    await store.deleteOption(option.optionId, props.question.questionId)
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo eliminar la opción' })
  }
}

function confirmDelete() {
  $q.dialog({
    title: 'Eliminar pregunta',
    message: '¿Seguro que quieres eliminar esta pregunta? Esta acción no se puede deshacer.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await store.deleteQuestion(props.question.questionId)
      emit('updated')
    } catch (e: any) {
      $q.notify({ type: 'negative', message: e.message ?? 'No se pudo eliminar la pregunta' })
    }
  })
}
</script>