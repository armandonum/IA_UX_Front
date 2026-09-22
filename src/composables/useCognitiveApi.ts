// composables/useCognitiveApi.ts
import api from "@/api/axios"

export interface CognitiveEvaluation {
  cognitiveEvaluationId: string
  projectId: string
  projectName?: string
  name: string
  description: string | null
  supervisorId: string
  supervisorName?: string
  status: 'draft' | 'planning' | 'in_progress' | 'completed' | 'archived'
  maxDurationMinutes: number
  targetUserDescription: string | null
  systemDescription: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  totalTasks?: number
  totalEvaluators?: number
  progress?: number
}

export interface CognitiveTask {
  id: string
  evaluationId: string
  projectTaskId: string | null
  title: string
  description: string | null
  userGoal: string | null
  orderIndex: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface CognitiveRule {
  id: string
  evaluationId: string
  ruleOrder: number
  description: string
  createdAt: string
  updatedAt: string
}

export interface CognitiveEvaluator {
  id: string
  evaluationId: string
  userId: string
  userFullName?: string
  userEmail?: string
  evaluatorRole: 'supervisor' | 'evaluator' | 'observer'
  assignedAt: string
  completedAt: string | null
  notes: string | null
  hasCompleted: boolean
  progress?: number
}

export interface CognitiveResponse {
  id: string
  evaluationId: string
  evaluatorId: string
  taskId: string
  taskTitle?: string
  responseDescription: string | null
  systemResponse: string | null
  q1WillUserTryCorrectOutcome: 'yes' | 'no' | 'uncertain' | null
  q1Reasoning: string | null
  q2WillUserNoticeAction: 'yes' | 'no' | 'uncertain' | null
  q2Reasoning: string | null
  q3WillUserAssociateAction: 'yes' | 'no' | 'uncertain' | null
  q3Reasoning: string | null
  q4WillUserSeeProgress: 'yes' | 'no' | 'uncertain' | null
  q4Reasoning: string | null
  problemIdentified: string | null
  designSuggestion: string | null
  otherComments: string | null
  timeSpentSeconds: number | null
  success: boolean | null
  status: 'pending' | 'completed' | 'skipped'
  createdAt: string
  updatedAt: string
  hasIssues?: boolean
  issueCount?: number
  answerSummary?: string
}

export interface CognitiveProblem {
  id: string
  evaluationId: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'design' | 'functionality' | 'navigation' | 'content' | 'performance' | 'accessibility' | 'usability' | 'other' | null
  reportedBy: string | null
  reportedByName?: string
  affectedTasks: string[]
  affectedTaskTitles?: string[]
  status: 'identified' | 'analyzing' | 'resolved' | 'rejected'
  resolutionNotes: string | null
  createdAt: string
  updatedAt: string
  isCritical?: boolean
  isActive?: boolean
}

export interface CognitiveRecommendation {
  id: string
  evaluationId: string
  problemId: string | null
  problemTitle?: string
  title: string
  description: string
  recommendationType: 'design_change' | 'feature_addition' | 'content_update' | 'connectivity_improvement' | null
  priority: 'high' | 'medium' | 'low'
  implemented: boolean
  implementedAt: string | null
  implementedBy: string | null
  implementationNotes: string | null
  createdBy: string | null
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export const useCognitiveApi = () => {
  // ============================================================
  // EVALUATIONS
  // ============================================================
  const getEvaluations = async (projectId?: string) => {
    const url = projectId 
      ? `/cognitive-evaluations/project/${projectId}`
      : '/cognitive-evaluations'
    const { data } = await api.get(url)
    return data
  }

  const getEvaluationById = async (id: string) => {
    const { data } = await api.get(`/cognitive-evaluations/${id}`)
    return data
  }

  const createEvaluation = async (payload: any) => {
    const { data } = await api.post('/cognitive-evaluations', payload)
    return data
  }

  const updateEvaluation = async (id: string, payload: any) => {
    const { data } = await api.put(`/cognitive-evaluations/${id}`, payload)
    return data
  }

  const updateEvaluationStatus = async (id: string, status: string) => {
    const { data } = await api.put(`/cognitive-evaluations/${id}/status`, { status })
    return data
  }

  const deleteEvaluation = async (id: string) => {
    await api.delete(`/cognitive-evaluations/${id}`)
  }

  // ============================================================
  // PROJECTS (para obtener file_key)
  // ============================================================
  const getProjectById = async (projectId: string) => {
    const { data } = await api.get(`/figma-projects/${projectId}`)
    return data
  }

  // ============================================================
  // TASKS
  // ============================================================
  const getTasks = async (evaluationId?: string) => {
    const url = evaluationId 
      ? `/cognitive-tasks/evaluation/${evaluationId}`
      : '/cognitive-tasks'
    const { data } = await api.get(url)
    return data
  }

  const getTaskById = async (id: string) => {
    const { data } = await api.get(`/cognitive-tasks/${id}`)
    return data
  }

  const createTask = async (payload: any) => {
    const { data } = await api.post('/cognitive-tasks', payload)
    return data
  }

  const updateTask = async (id: string, payload: any) => {
    const { data } = await api.put(`/cognitive-tasks/${id}`, payload)
    return data
  }

  const updateTaskStatus = async (id: string, status: string) => {
    const { data } = await api.put(`/cognitive-tasks/${id}/status`, { status })
    return data
  }

  const reorderTasks = async (evaluationId: string, taskIds: string[]) => {
    const { data } = await api.put(`/cognitive-tasks/reorder/${evaluationId}`, { taskIds })
    return data
  }

  const deleteTask = async (id: string) => {
    await api.delete(`/cognitive-tasks/${id}`)
  }

  // ============================================================
  // RULES
  // ============================================================
  const getRules = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive-rules/evaluation/${evaluationId}?ordered=true`)
    return data
  }

  const createRule = async (payload: any) => {
    const { data } = await api.post('/cognitive-rules', payload)
    return data
  }

  const createRulesBatch = async (payload: any) => {
    const { evaluationId, rules } = payload
    const results = []
    
    for (const rule of rules) {
      try {
        const { data } = await api.post('/cognitive-rules', {
          evaluationId,
          description: rule.description,
          ruleOrder: rule.ruleOrder
        })
        results.push(data)
      } catch (error) {
        console.error('Error creating rule:', error)
        throw error
      }
    }
    
    return results
  }

  const updateRule = async (id: string, payload: any) => {
    const { data } = await api.put(`/cognitive-rules/${id}`, payload)
    return data
  }

  const reorderRules = async (evaluationId: string, ruleIds: string[]) => {
    const { data } = await api.put(`/cognitive-rules/reorder/${evaluationId}`, { ruleIds })
    return data
  }

  const deleteRule = async (id: string) => {
    await api.delete(`/cognitive-rules/${id}`)
  }

  // ============================================================
  // EVALUATORS
  // ============================================================
  const getEvaluators = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive-evaluators/evaluation/${evaluationId}`)
    return data
  }

  const assignEvaluator = async (payload: any) => {
    const { data } = await api.post('/cognitive-evaluators', payload)
    return data
  }

  const assignEvaluatorsBatch = async (payload: any) => {
    const { evaluationId, evaluators } = payload
    const results = []
    
    for (const evaluator of evaluators) {
      try {
        const { data } = await api.post('/cognitive-evaluators', {
          evaluationId,
          userId: evaluator.userId || evaluator.user_id,
          evaluatorRole: evaluator.evaluatorRole || 'evaluator',
          notes: evaluator.notes || null
        })
        results.push(data)
      } catch (error: any) {
        console.error('Error assigning evaluator:', error)
        throw new Error(`Error al asignar evaluador: ${error.response?.data?.message || error.message}`)
      }
    }
    
    return results
  }

  const updateEvaluator = async (id: string, payload: any) => {
    const { data } = await api.put(`/cognitive-evaluators/${id}`, payload)
    return data
  }

  const getEvaluatorProgress = async (id: string) => {
    const { data } = await api.get(`/cognitive-evaluators/${id}/progress`)
    return data
  }

  const removeEvaluator = async (id: string) => {
    await api.delete(`/cognitive-evaluators/${id}`)
  }

  // ============================================================
  // RESPONSES
  // ============================================================
  const getResponses = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive-responses/evaluation/${evaluationId}`)
    return data
  }

  const getResponseSummary = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive-responses/summary/${evaluationId}`)
    return data
  }

  const getResponseStats = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive-responses/stats/${evaluationId}`)
    return data
  }

  // ============================================================
  // PROBLEMS
  // ============================================================
  const getProblems = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive-problems/evaluation/${evaluationId}`)
    return data
  }

  const getProblemSummary = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive-problems/summary/${evaluationId}`)
    return data
  }

  const createProblem = async (payload: any) => {
    const { data } = await api.post('/cognitive-problems', payload)
    return data
  }

  const updateProblem = async (id: string, payload: any) => {
    const { data } = await api.put(`/cognitive-problems/${id}`, payload)
    return data
  }

  const updateProblemStatus = async (id: string, status: string, notes?: string) => {
    const { data } = await api.put(`/cognitive-problems/${id}/status?status=${status}`, { notes })
    return data
  }

  const unifyProblems = async (payload: any) => {
    const { data } = await api.post('/cognitive-problems/unify', payload)
    return data
  }

  const deleteProblem = async (id: string) => {
    await api.delete(`/cognitive-problems/${id}`)
  }

  // ============================================================
  // RECOMMENDATIONS
  // ============================================================
  const getRecommendations = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive-recommendations/evaluation/${evaluationId}`)
    return data
  }

  const createRecommendation = async (payload: any) => {
    const { data } = await api.post('/cognitive-recommendations', payload)
    return data
  }

  const updateRecommendation = async (id: string, payload: any) => {
    const { data } = await api.put(`/cognitive-recommendations/${id}`, payload)
    return data
  }

  const implementRecommendation = async (id: string, notes: string) => {
    const { data } = await api.put(`/cognitive-recommendations/${id}/implement`, { implementationNotes: notes })
    return data
  }

  const deleteRecommendation = async (id: string) => {
    await api.delete(`/cognitive-recommendations/${id}`)
  }

  // ============================================================
  // DASHBOARD & REPORTS
  // ============================================================
  const getDashboard = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive/dashboard/${evaluationId}`)
    return data
  }

  const getReport = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive/report/${evaluationId}`)
    return data
  }

  const exportReport = async (evaluationId: string, format: 'pdf' | 'docx' = 'pdf') => {
    const { data } = await api.get(`/cognitive/report/${evaluationId}/export?format=${format}`, {
      responseType: 'blob'
    })
    return data
  }

  // ============================================================
  // SECCIÓN PARA EL EVALUADOR
  // ============================================================
  
  // ✅ EXISTE: /cognitive-evaluations/assigned/:userId
  const getMyEvaluations = async (user_id: string | undefined) => {
    const { data } = await api.get(`/cognitive-evaluations/assigned/${user_id}`)
    return data
  }

  // ✅ EXISTE: /cognitive-tasks/evaluation/:evaluationId
  const getEvaluationTasks = async (evaluationId: string) => {
    const { data } = await api.get(`/cognitive-tasks/evaluation/${evaluationId}`)
    return data
  }

const getTaskFlow = async (taskId: string) => {
  try {
    const { data } = await api.get(`/flows/task/${taskId}`)
    console.log('📦 Flow data:', data)
    
    // Si la respuesta es un array, devolverlo directamente
    if (Array.isArray(data)) {
      return data
    }
    
    // Si es un objeto, devolverlo como array
    if (data && data.flowId) {
      return [data]
    }
    
    return []
  } catch (error) {
    console.warn('⚠️ No se encontró flujo para la tarea:', taskId)
    return []
  }
}

  // ✅ EXISTE: /flow-clicks/flow/:flowId
  const getFlowClicks = async (flowId: string) => {
    const { data } = await api.get(`/flow-clicks/flow/${flowId}`)
    return data
  }

  // ✅ EXISTE: /figma-projects/:projectId
  const getProjectFileKey = async (projectId: string) => {
    const { data } = await api.get(`/figma-projects/${projectId}`)
    return data.fileKey || data.file_key
  }

  // ============================================================
  // SESIONES
  // ============================================================

const createCognitiveSession = async (payload: any) => {
  const sessionPayload = {
    proyectId: payload.proyectId || payload.evaluationId,
    userId: payload.userId,
    taskId: payload.taskId,
    fileKey: payload.fileKey,
    nodeIdInicial: payload.nodeIdInicial || '0-1',
    taskDescription: payload.taskDescription || 'Recorrido cognitivo',
    deviceType: payload.deviceType || 'desktop',
    browser: payload.browser || navigator.userAgent,
    evaluationType: payload.evaluationType || 'cognitive',
  }
  
  console.log('📤 Enviando a /usability-sessions:', sessionPayload)
  
  try {
    const { data } = await api.post('/usability-sessions', sessionPayload)
    console.log('📥 Respuesta del backend:', data)
    
    // 🔥 Si la respuesta es un string, devolverlo como objeto
    if (typeof data === 'string') {
      return {
        sessionId: data,
        id: data,
      }
    }
    
    // Si es un objeto, devolverlo tal cual
    return data
  } catch (error: any) {
    console.error('❌ Error en createCognitiveSession:', error.response?.data || error.message)
    throw error
  }
}

  const finishCognitiveSession = async (sessionId: string, payload: any) => {
    const { data } = await api.patch(`/usability-sessions/${sessionId}/finish`, payload)
    return data
  }

  const getSession = async (sessionId: string) => {
    const { data } = await api.get(`/usability-sessions/${sessionId}`)
    return data
  }

  // ============================================================
  // RESPUESTAS COGNITIVAS (4 preguntas)
  // ============================================================
  const createCognitiveResponse = async (payload: any) => {
    const { data } = await api.post('/cognitive-responses', payload)
    return data
  }

  const updateCognitiveResponse = async (id: string, payload: any) => {
    const { data } = await api.put(`/cognitive-responses/${id}`, payload)
    return data
  }

  // ============================================================
  // EMOCIONES
  // ============================================================
  const saveEmotionReading = async (payload: any) => {
    const { data } = await api.post('/emotion-readings', payload)
    return data
  }

  // ============================================================
  // SENTIMIENTOS DE TEXTO
  // ============================================================
  const saveTextSentiment = async (payload: any) => {
    const { data } = await api.post('/text-sentiments', payload)
    return data
  }

  // ============================================================
  // EVENTOS
  // ============================================================
  const saveUsabilityEvent = async (payload: any) => {
    const { data } = await api.post('/usability-events', payload)
    return data
  }

  // ============================================================
  // COMENTARIOS
  // ============================================================
  const saveSessionComment = async (payload: any) => {
    const { data } = await api.post('/session-comments', payload)
    return data
  }

  // ============================================================
  // VIDEOS
  // ============================================================
  const uploadVideo = async (sessionId: string, formData: FormData) => {
    const { data } = await api.post(`/usability-sessions/${sessionId}/upload-video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  }

  return {
    // Evaluations
    getEvaluations,
    getEvaluationById,
    createEvaluation,
    updateEvaluation,
    updateEvaluationStatus,
    deleteEvaluation,
    // Projects
    getProjectById,
    getProjectFileKey,
    // Tasks
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    updateTaskStatus,
    reorderTasks,
    deleteTask,
    // Rules
    getRules,
    createRule,
    createRulesBatch,
    updateRule,
    reorderRules,
    deleteRule,
    // Evaluators
    getEvaluators,
    assignEvaluator,
    assignEvaluatorsBatch,
    updateEvaluator,
    getEvaluatorProgress,
    removeEvaluator,
    // Responses
    getResponses,
    getResponseSummary,
    getResponseStats,
    // Problems
    getProblems,
    getProblemSummary,
    createProblem,
    updateProblem,
    updateProblemStatus,
    unifyProblems,
    deleteProblem,
    // Recommendations
    getRecommendations,
    createRecommendation,
    updateRecommendation,
    implementRecommendation,
    deleteRecommendation,
    // Dashboard & Reports
    getDashboard,
    getReport,
    exportReport,
    // Sección evaluador
    getMyEvaluations,
    getEvaluationTasks,
    getTaskFlow,
    getFlowClicks,
    createCognitiveSession,
    finishCognitiveSession,
    getSession,
    createCognitiveResponse,
    updateCognitiveResponse,
    saveEmotionReading,
    saveTextSentiment,
    saveUsabilityEvent,
    saveSessionComment,
    uploadVideo,
  }
}