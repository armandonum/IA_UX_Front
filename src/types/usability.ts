export interface Task {
  taskId: string
  title: string
  description: string
  order_index: number
}

// El backend devuelve estos dos en camelCase (confirmado en consola).
export interface QuestionOption {
  optionId: string
  questionId: string
  label: string
  orderIndex: number
}

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'single_choice'
  | 'multi_choice'
  | 'scale'
  | 'boolean'

export interface Question {
  questionId: string
  questionText: string
  questionType: QuestionType
  isRequired: boolean
  orderIndex: number
  options: QuestionOption[]  
  scaleMin?: number
  scaleMax?: number
  allowNotApplicable?: boolean
}

// El objeto Questionnaire en sí sí vino en snake_case en la consola
// (questionnaire_id, title, description) — se deja así.
export interface Questionnaire {
  questionnaire_id: string
  title: string
  description?: string | null
  questions: Question[]
}

export interface QuestionAnswer {
  questionId: string
  answerText?: string | null
  selectedOptionId?: string | null
  selectedOptionIds?: string[] | null
  scaleValue?: number | null
  booleanValue?: boolean | null
  isNotApplicable?: boolean | null
}