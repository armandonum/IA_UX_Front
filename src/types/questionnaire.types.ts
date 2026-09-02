export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'single_choice'
  | 'multi_choice'
  | 'scale'
  | 'boolean'

export interface Questionnaire {
  questionnaireId: string
  projectId: string
  type: 'pretest' | 'posttest'
  title: string
  description?: string | null
  createdAt: string
}

export interface QuestionOption {
  optionId: string
  questionId: string
  label: string
  orderIndex: number
}

export interface Question {
  questionId: string
  questionnaireId: string
  orderIndex: number
  questionText: string
  questionType: QuestionType
  isRequired: boolean
  scaleMin?: number | null
  scaleMax?: number | null
  allowNotApplicable?: boolean
}