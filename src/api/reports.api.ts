import api from './axios'

export interface PrePostReportRow {
  questionnaire_type: 'pretest' | 'posttest'
  question_order: number
  question: string
  answer_type: string
  scale_min: number | null
  scale_max: number | null
  total_users: number
  avg_scale: number | null
  count_true: number
  count_false: number
  count_na: number
  count_text_answers: number
}

export interface FindingsByRequirementRow {
  requirement_code: string
  requirement_title: string
  total_findings: number
  critical: number
  high: number
  medium: number
  low: number
  resolved: number
  negative_sentiments: number
  negative_emotions: number
}

export interface FindingsByFlowRow {
  flow_id: string
  flow_name: string
  task_title: string
  total_findings: number
  sessions_evaluated: number
  completion_rate: number
  avg_time_sec: number
  total_failures: number
  critical_findings: number
}

export interface FindingsByScreenRow {
  node_id: string
  screen_name: string
  node_type: string
  total_findings: number
  critical: number
  high: number
  negative_emotions: number
  confusion_count: number
  frustration_count: number
}

export interface FindingsByUiElementRow {
  node_id: string
  element_name: string
  element_type: string
  total_findings: number
  severe_findings: number
  finding_types: string
}

export interface CriticalInteractionRow {
  finding_id: string
  description: string
  severity: string
  emotion_inferred: string | null
  textual_sentiment: string | null
  frequency: number
  node_id: string
  screen_name: string
  criticality_reason: string
}

export interface AffectiveByTaskRow {
  task_id: string
  task_title: string
  task_description: string
  order_index: number
  emotions_breakdown: Record<string, number> | null
  sentiments_breakdown: Record<string, number> | null
  user_comments: string | null
  sessions_count: number
}

export interface SentimentWithFindingRow {
  sentiment_id: string
  user_comment: string
  sentiment_label: string
  confidence: number
  elapsed_ms_total: number
  ux_topic: string
  finding_id: string | null
  finding_description: string | null
  finding_severity: string | null
  finding_type: string | null
}

export interface ExpertCommentRow {
  comment_id: string
  comment_type: string
  comment: string
  severity: number | null
  elapsed_ms_total: number
  node_id: string
  screen_name: string
  evaluator_name: string
  evaluator_id: string
  linked_findings: number
}

export interface CentralizerReport {
  total_findings: number
  critical: number
  high: number
  medium: number
  low: number
  positive: number
  resolved: number
  with_sentiment: number
  with_emotion: number
  worst_screen: string | null
  dominant_emotion: string | null
  dominant_sentiment: string | null
  top_user_comment: string | null
  top_expert_comment: string | null
}

export interface MyProject {
  project_id: string
  project_name: string
  file_key: string
  thumbnail_url: string | null
  sessions_count: number
}

export const reportsApi = {
  getPrePostReport: (projectId: string, semesterId?: string) =>
    api.get<PrePostReportRow[]>(`/reports/pre-post/${projectId}`, {
      params: semesterId ? { semesterId } : {},
    }),

  getFindingsByRequirement: (projectId: string) =>
    api.get<FindingsByRequirementRow[]>(`/reports/findings/by-requirement/${projectId}`),

  getFindingsByFlow: (projectId: string) =>
    api.get<FindingsByFlowRow[]>(`/reports/findings/by-flow/${projectId}`),

  getFindingsByScreen: (projectId: string) =>
    api.get<FindingsByScreenRow[]>(`/reports/findings/by-screen/${projectId}`),

  getFindingsByUiElement: (projectId: string) =>
    api.get<FindingsByUiElementRow[]>(`/reports/findings/by-ui-element/${projectId}`),

  getCriticalInteractions: (projectId: string, sessionId?: string) =>
    api.get<CriticalInteractionRow[]>(`/reports/critical-interactions/${projectId}`, {
      params: sessionId ? { sessionId } : {},
    }),

  getAffectiveByTask: (projectId: string) =>
    api.get<AffectiveByTaskRow[]>(`/reports/affective/by-task/${projectId}`),

  getSentimentsWithFindings: (projectId: string) =>
    api.get<SentimentWithFindingRow[]>(`/reports/sentiments-with-findings/${projectId}`),

  getExpertComments: (projectId: string) =>
    api.get<ExpertCommentRow[]>(`/reports/expert-comments/${projectId}`),

  getCentralizerReport: (projectId: string, sessionId?: string) =>
    api.get<CentralizerReport>(`/reports/centralizer/${projectId}`, {
      params: sessionId ? { sessionId } : {},
    }),

  getMyProjects: (userId: string) =>
    api.get<MyProject[]>('/reports/my-projects', { params: { userId } }),
}