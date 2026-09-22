import { defineStore } from 'pinia'
import { ref } from 'vue'

import type {
  Questionnaire,
  Question,
  QuestionOption,
} from '@/types/questionnaire.types'

import {
  questionnairesApi,
  questionsApi,
  questionOptionsApi,
} from '@/api/questionnaire.api'

export const useQuestionnaireStore = defineStore(
  'questionnaire',
  () => {

    // ==========================
    // STATE
    // ==========================

    const questionnaires = ref<Questionnaire[]>([])

    const currentQuestionnaire =
      ref<Questionnaire | null>(null)

    const questions = ref<Question[]>([])

    const questionOptions =
      ref<Record<string, QuestionOption[]>>({})

    const loading = ref(false)

    // ==========================
    // QUESTIONNAIRES
    // ==========================

    async function fetchByProject(
      projectId: string,
    ) {
      loading.value = true

      try {

        questionnaires.value =
          await questionnairesApi.findByProject(
            projectId,
          )

      } finally {
        loading.value = false
      }
    }

    async function fetchByProjectAndType(
      projectId: string,
      type: 'pretest' | 'posttest',
    ) {

      currentQuestionnaire.value =
        await questionnairesApi.findByProjectAndType(
          projectId,
          type,
        )

      return currentQuestionnaire.value
    }

    async function createQuestionnaire(
      data: {
        projectId: string
        type: 'pretest' | 'posttest'
        title: string
        description?: string
      },
    ) {

      const created =
        await questionnairesApi.create(data)

      questionnaires.value.push(created)

      currentQuestionnaire.value =
        created

      return created
    }

    async function updateQuestionnaire(
      questionnaireId: string,
      data: Partial<Questionnaire>,
    ) {

      const updated =
        await questionnairesApi.update(
          questionnaireId,
          data,
        )

      const index =
        questionnaires.value.findIndex(
            (          q: { questionnaireId: string }) =>
            q.questionnaireId ===
            questionnaireId,
        )

      if (index >= 0) {
        questionnaires.value[index] =
          updated
      }

      currentQuestionnaire.value =
        updated

      return updated
    }

    async function deleteQuestionnaire(
      questionnaireId: string,
    ) {

      await questionnairesApi.delete(
        questionnaireId,
      )

      questionnaires.value =
        questionnaires.value.filter(
            (          q: { questionnaireId: string }) =>
            q.questionnaireId !==
            questionnaireId,
        )

      if (
        currentQuestionnaire.value
          ?.questionnaireId ===
        questionnaireId
      ) {
        currentQuestionnaire.value =
          null
      }
    }

    // ==========================
    // QUESTIONS
    // ==========================

    async function fetchQuestions(
      questionnaireId: string,
    ) {

      questions.value =
        await questionsApi.findByQuestionnaire(
          questionnaireId,
        )
    }

    async function createQuestion(
      data: any,
    ) {
        console.log("vamos a crear uno vacio  :", data)

      const created =
        await questionsApi.create(data)

      questions.value.push(created)

      return created
    }

    async function updateQuestion(
      questionId: string,
      data: any,
    ) {

      const updated =
        await questionsApi.update(
          questionId,
          data,
        )

      const index =
        questions.value.findIndex(
            (          q: { questionId: string }) =>
            q.questionId ===
            questionId,
        )

      if (index >= 0) {
        questions.value[index] =
          updated
      }

      return updated
    }

    async function deleteQuestion(
      questionId: string,
    ) {

      await questionsApi.delete(
        questionId,
      )

      questions.value =
        questions.value.filter(
            (          q: { questionId: string }) =>
            q.questionId !==
            questionId,
        )
    }

    // ==========================
    // OPTIONS
    // ==========================

    async function fetchOptions(
      questionId: string,
    ) {

      const options =
        await questionOptionsApi.findByQuestion(
          questionId,
        )

      questionOptions.value[
        questionId
      ] = options
    }

    async function createOption(
      data: any,
    ) {

      const created =
        await questionOptionsApi.create(
          data,
        )

      if (
        !questionOptions.value[
          data.questionId
        ]
      ) {
        questionOptions.value[
          data.questionId
        ] = []
      }

      questionOptions.value[
        data.questionId
      ].push(created)

      return created
    }

    async function updateOption(
      optionId: string,
      data: any,
    ) {

      const updated =
        await questionOptionsApi.update(
          optionId,
          data,
        )

      const list =
        questionOptions.value[
          updated.questionId
        ]

      if (!list) return updated

      const index =
        list.findIndex(
          x =>
            x.optionId === optionId,
        )

      if (index >= 0) {
        list[index] = updated
      }

      return updated
    }

    async function deleteOption(
      optionId: string,
      questionId: string,
    ) {

      await questionOptionsApi.delete(
        optionId,
      )

      questionOptions.value[
        questionId
      ] =
        questionOptions.value[
          questionId
        ].filter(
          x =>
            x.optionId !== optionId,
        )
    }

    // ==========================
// FLUJO COMBINADO (usado por Questionaries.vue)
// ==========================

async function loadQuestionnaire(
  projectId: string,
  type: 'pretest' | 'posttest',
) {
  loading.value = true
  try {
    // Endpoint "find all" -> nunca lanza 404, regresa [] si no hay nada
    const all = await questionnairesApi.findByProject(projectId)
    questionnaires.value = all

    let questionnaire =all.find((q: Questionnaire) => q.type === type) ?? null

    if (!questionnaire) {
      questionnaire = await questionnairesApi.create({
        projectId,
        type,
        title: type === 'pretest' ? 'Cuestionario Pre-Test' : 'Cuestionario Post-Test',
      })
      questionnaires.value.push(questionnaire)
    }

    currentQuestionnaire.value = questionnaire
    await fetchQuestions(questionnaire.questionnaireId)

    await Promise.all(
      questions.value
        .filter((q: Question) => q.questionType === 'single_choice' || q.questionType === 'multi_choice')
        .map((q: Question) => fetchOptions(q.questionId)),
    )
  } finally {
    loading.value = false
  }
}

async function createEmptyQuestion() {

  if (!currentQuestionnaire.value) {
    throw new Error('Selecciona un proyecto y tipo de cuestionario primero')
  }

  return createQuestion({
    questionnaireId: currentQuestionnaire.value.questionnaireId,
    orderIndex: questions.value.length + 1,
    questionText: 'Nueva pregunta',
    questionType: 'short_text',
    isRequired: true,
  })
}

    return {

      loading,

      questionnaires,
      currentQuestionnaire,

      questions,

      questionOptions,

      fetchByProject,
      fetchByProjectAndType,
      loadQuestionnaire,

      createQuestionnaire,
      updateQuestionnaire,
      deleteQuestionnaire,

      fetchQuestions,
      createQuestion,
      createEmptyQuestion,
      updateQuestion,
      deleteQuestion,

      fetchOptions,
      createOption,
      updateOption,
      deleteOption,

    }
  },
)