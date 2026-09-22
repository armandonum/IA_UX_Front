import { api } from './api'

/* ============================================================
 * QUESTIONNAIRES
 * ============================================================ */

export const questionnairesApi = {

  list() {
    return api.get('/questionnaires')
  },

  findById(questionnaireId: string) {
    return api.get(`/questionnaires/${questionnaireId}`)
  },

  findByProject(projectId: string) {
    return api.get(`/questionnaires/project/${projectId}`)
  },

  findByProjectAndType(
    projectId: string,
    type: 'pretest' | 'posttest',
  ) {
    return api.get(
      `/questionnaires/project/${projectId}/type/${type}`,
    )
  },

  create(data: {
    projectId: string
    type: 'pretest' | 'posttest'
    title: string
    description?: string
  }) {
    return api.post('/questionnaires', data)
  },

  update(
    questionnaireId: string,
    data: any,
  ) {
    return api.patch(
      `/questionnaires/${questionnaireId}`,
      data,
    )
  },

  delete(questionnaireId: string) {
    return api.delete(
      `/questionnaires/${questionnaireId}`,
    )
  },

}

/* ============================================================
 * QUESTIONS
 * ============================================================ */

export const questionsApi = {

  list() {
    return api.get('/questions')
  },

  findById(questionId: string) {
    return api.get(`/questions/${questionId}`)
  },

  findByQuestionnaire(
    questionnaireId: string,
  ) {
    return api.get(
      `/questions/questionnaire/${questionnaireId}`,
    )
  },

  create(data: any) {
    return api.post('/questions', data)
  },

  update(
    questionId: string,
    data: any,
  ) {
    return api.patch(
      `/questions/${questionId}`,
      data,
    )
  },

  delete(questionId: string) {
    return api.delete(
      `/questions/${questionId}`,
    )
  },

}

/* ============================================================
 * QUESTION OPTIONS
 * ============================================================ */

export const questionOptionsApi = {

  list() {
    return api.get('/question-options')
  },

  findById(optionId: string) {
    return api.get(
      `/question-options/${optionId}`,
    )
  },

  findByQuestion(
    questionId: string,
  ) {
    return api.get(
      `/question-options/question/${questionId}`,
    )
  },

  create(data: any) {
    return api.post(
      '/question-options',
      data,
    )
  },

  update(
    optionId: string,
    data: any,
  ) {
    return api.patch(
      `/question-options/${optionId}`,
      data,
    )
  },

  delete(optionId: string) {
    return api.delete(
      `/question-options/${optionId}`,
    )
  },

}