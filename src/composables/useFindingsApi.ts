// composables/useFindingsApi.ts
import api from '@/api/axios'

export interface Finding {
  findingId: string
  evaluationId: string
  sessionId: string | null
  taskId: string | null
  requirementId: string | null
  flowId: string | null
  nodeId: string | null
  version: string | null
  type: 'problem' | 'difficulty' | 'accessibility' | 'friction' | 'positive' | 'opportunity'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  frequency: number
  impact: 'low' | 'medium' | 'high'
  priority: 'low' | 'medium' | 'high'
  recommendation: string | null
  status: 'pending' | 'in_progress' | 'resolved' | 'not_resolved' | 'kept'
  emotionInferred: string | null
  textualSentiment: string | null
  userComment: string | null
  expertComment: string | null
  userCommentId: string | null
  expertCommentId: string | null
  aggregatedFrom: string[]
  occurrences: number
  createdAt: string
  updatedAt: string
  isCritical?: boolean
  isActive?: boolean
  severityScore?: number
}

export interface FindingSummary {
  total: number
  byStatus: {
    pending: number
    in_progress: number
    resolved: number
    not_resolved: number
    kept: number
  }
  bySeverity: {
    low: number
    medium: number
    high: number
    critical: number
  }
  byType: {
    problem: number
    difficulty: number
    accessibility: number
    friction: number
    positive: number
    opportunity: number
  }
  active: number
  resolved: number
  critical: number
  high: number
  medium: number
  low: number
  resolutionRate: number
}

export const useFindingsApi = () => {
  // ============================================================
  // FINDINGS
  // ============================================================
  const getFindings = async (params?: any) => {
    const { data } = await api.get('/findings', { params })
    return data
  }

  const getFindingsByEvaluation = async (evaluationId: string, params?: any) => {
    const { data } = await api.get(`/findings/evaluation/${evaluationId}`, { params })
    return data
  }

  const getFindingsBySession = async (sessionId: string) => {
    const { data } = await api.get(`/findings/session/${sessionId}`)
    return data
  }

  const getFindingsByTask = async (taskId: string) => {
    const { data } = await api.get(`/findings/task/${taskId}`)
    return data
  }

  const getFindingSummary = async (evaluationId: string) => {
    const { data } = await api.get(`/findings/summary/${evaluationId}`)
    return data
  }

  const getFindingById = async (id: string) => {
    const { data } = await api.get(`/findings/${id}`)
    return data
  }

  const createFinding = async (payload: any) => {
    const { data } = await api.post('/findings', payload)
    return data
  }

  const updateFinding = async (id: string, payload: any) => {
    const { data } = await api.put(`/findings/${id}`, payload)
    return data
  }

  const updateFindingStatus = async (id: string, status: string) => {
    const { data } = await api.put(`/findings/${id}/status`, { status })
    return data
  }

  const deleteFinding = async (id: string) => {
    await api.delete(`/findings/${id}`)
  }

  return {
    getFindings,
    getFindingsByEvaluation,
    getFindingsBySession,
    getFindingsByTask,
    getFindingSummary,
    getFindingById,
    createFinding,
    updateFinding,
    updateFindingStatus,
    deleteFinding,
  }
}