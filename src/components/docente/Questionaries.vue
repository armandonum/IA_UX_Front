<template>
  <div class="q-pa-md">

    <!-- ================= HEADER ================= -->

    <div class="row items-center justify-between q-mb-lg">

      <div>
        <div class="text-h5 text-weight-bold">
          Constructor de cuestionarios
        </div>

        <div class="text-grey-7">
          Administra los formularios Pretest y Posttest de cada proyecto.
        </div>
      </div>

      <q-btn
        color="primary"
        icon="save"
        label="Guardar cambios"
        @click="saveQuestionnaire"
      />

    </div>

    <!-- ================= SELECTORES ================= -->

    <QuestionnaireSelector
      v-model:project-id="selectedProjectId"
      v-model:type="selectedType"
    />

    <q-separator class="q-my-lg" />

    <div
      v-if="selectedProjectId"
      class="row q-col-gutter-lg"
    >

      <!-- ================= LISTA ================= -->

      <div class="col-4">

        <QuestionList
          :questions="questions"
          :selected-question-id="selectedQuestionId"
          @select="selectQuestion"
          @create="createQuestion"
        />

      </div>

      <!-- ================= EDITOR ================= -->

      <div class="col-8">

        <QuestionEditor
          v-if="selectedQuestion"
          :question="selectedQuestion"
          @updated="reloadQuestions"
        />

        <q-card
          v-else
          flat
          bordered
          class="flex flex-center"
          style="height:500px"
        >
          <div class="text-grey">
            Selecciona una pregunta
          </div>
        </q-card>

      </div>

    </div>

    <q-card
      v-else
      flat
      bordered
      class="q-pa-xl text-center"
    >

      <q-icon
        name="quiz"
        size="64px"
        color="primary"
      />

      <div class="text-h6 q-mt-md">
        Selecciona un proyecto
      </div>

      <div class="text-grey">
        Primero selecciona el proyecto para comenzar a crear el cuestionario.
      </div>

    </q-card>

  </div>
</template>

<script setup lang="ts">

import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'

import { useQuasar } from 'quasar'

import { useDocenteStore } from '@/stores/docente.stores'
import { useQuestionnaireStore } from '@/stores/questionnaire.store'

import QuestionnaireSelector from './questionaries/QuestionnaireSelector.vue'
import QuestionList from './questionaries/QuestionList.vue'
import QuestionEditor from './questionaries/QuestionEditor.vue'

const $q = useQuasar()

const docenteStore =
  useDocenteStore()

const questionnaireStore =
  useQuestionnaireStore()

const selectedProjectId =
  ref<string>()

const selectedType =
  ref<'pretest' | 'posttest'>(
    'pretest',
  )

const selectedQuestionId =
  ref<string>()

const questions =
  computed(
    () => questionnaireStore.questions,
  )

const selectedQuestion =
  computed(() =>
    questionnaireStore.questions.find(
      (      q: { questionId: string | undefined }) =>
        q.questionId ===
        selectedQuestionId.value,
    ),
  )

onMounted(async () => {

  await docenteStore.fetchProjects()

})

watch(
  [
    selectedProjectId,
    selectedType,
  ],
  async () => {

    if (
      !selectedProjectId.value
    ) {
      return
    }

    await questionnaireStore.loadQuestionnaire(
      selectedProjectId.value,
      selectedType.value,
    )

    selectedQuestionId.value =
      undefined

  },
)

function selectQuestion(
  questionId: string,
) {
  selectedQuestionId.value =
    questionId
}

async function createQuestion() {
  if (!questionnaireStore.currentQuestionnaire) {
    return
  }

  const question =await questionnaireStore.createEmptyQuestion()

  selectedQuestionId.value =
    question.questionId
}

async function reloadQuestions() {

  if (
    !selectedProjectId.value
  ) {
    return
  }

  await questionnaireStore.loadQuestionnaire(
    selectedProjectId.value,
    selectedType.value,
  )
}

async function saveQuestionnaire() {

  $q.notify({

    type: 'positive',

    message:
      'Todos los cambios fueron guardados.',

  })

}

</script>