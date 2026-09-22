import api from './axios'

// ============================================================
// TIPOS
// ============================================================
export interface HeuristicFramework {
  frameworkId: string
  name: string
  description: string | null
  author: string | null
  year: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface HeuristicPrinciple {
  principleId: string
  frameworkId: string
  code: string
  name: string
  description: string
  orderIndex: number
  isActive: boolean
}

export interface HeuristicEvaluation {
  evaluationId: string
  projectId: string
  frameworkId: string
  supervisorId: string
  name: string
  description: string | null
  status: 'draft' | 'planning' | 'in_progress' | 'completed' | 'archived'
  systemDescription: string | null
  targetUserDescription: string | null
  maxDurationMinutes: number
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface HeuristicEvaluator {
  id: string
  evaluationId: string
  userId: string
  role: 'supervisor' | 'evaluator' | 'observer'
  assignedAt: string
  completedAt: string | null
  notes: string | null
}

export interface HeuristicTask {
  id: string
  evaluationId: string
  projectTaskId: string | null
  title: string
  description: string | null
  userGoal: string | null
  orderIndex: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

export interface HeuristicObservation {
  observationId: string
  sessionId: string
  evaluationId: string
  evaluatorId: string
  taskId: string | null
  principleId: string
  description: string
  severity: number
  frequency: string
  recommendation: string | null
  nodeId: string | null
  screenIdentifier: string | null
  createdAt: string
  updatedAt: string
}

export interface HeuristicPositiveAspect {
  aspectId: string
  sessionId: string
  evaluationId: string
  evaluatorId: string
  taskId: string | null
  description: string
  createdAt: string
}

export interface HeuristicRating {
  ratingId: string
  evaluationId: string
  sessionId: string
  evaluatorId: string
  problemId: string
  severity: number
  frequency: number
  criticality: number
}

export interface HeuristicFinalResult {
  resultId: string
  evaluationId: string
  totalProblems: number
  totalPositiveAspects: number
  totalEvaluators: number
  completedEvaluators: number
  rankingJson: any[] | null
  criticalProblems: any[] | null
  recommendations: any[] | null
  avgSeverity: number | null
  avgFrequency: number | null
  avgCriticality: number | null
  status: 'pending' | 'completed' | 'reviewed'
  calculatedAt: string
  updatedAt: string
}


export interface HeuristicTaskProgress {
  progressId: string
  evaluatorId: string
  taskId: string
  evaluationId: string
  sessionId: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
// ============================================================
// API
// ============================================================
export const heuristicApi = {
  // ============================================================
  // 1. FRAMEWORKS
  // ============================================================
  getFrameworks: () =>
    api.get<HeuristicFramework[]>('/heuristic-frameworks'),

  getFramework: (id: string) =>
    api.get<HeuristicFramework>(`/heuristic-frameworks/${id}`),

  createFramework: (data: Partial<HeuristicFramework>) =>
    api.post<HeuristicFramework>('/heuristic-frameworks', data),

  updateFramework: (id: string, data: Partial<HeuristicFramework>) =>
    api.put<HeuristicFramework>(`/heuristic-frameworks/${id}`, data),

  deleteFramework: (id: string) =>
    api.delete(`/heuristic-frameworks/${id}`),

  // ============================================================
  // 2. PRINCIPLES
  // ============================================================
  getPrinciples: () =>
    api.get<HeuristicPrinciple[]>('/heuristic-principles'),

  getPrinciplesByFramework: (frameworkId: string) =>
    api.get<HeuristicPrinciple[]>(`/heuristic-principles/framework/${frameworkId}`),

  getPrinciple: (id: string) =>
    api.get<HeuristicPrinciple>(`/heuristic-principles/${id}`),

  createPrinciple: (data: Partial<HeuristicPrinciple>) =>
    api.post<HeuristicPrinciple>('/heuristic-principles', data),

  updatePrinciple: (id: string, data: Partial<HeuristicPrinciple>) =>
    api.put<HeuristicPrinciple>(`/heuristic-principles/${id}`, data),

  deletePrinciple: (id: string) =>
    api.delete(`/heuristic-principles/${id}`),

  // ============================================================
  // 3. EVALUATIONS
  // ============================================================
  getEvaluations: () =>
    api.get<HeuristicEvaluation[]>('/heuristic-evaluations'),

  getEvaluationsBySupervisor: (supervisorId: string) =>
    api.get<HeuristicEvaluation[]>(`/heuristic-evaluations/supervisor/${supervisorId}`),

  getEvaluationsByProject: (projectId: string) =>
    api.get<HeuristicEvaluation[]>(`/heuristic-evaluations/project/${projectId}`),

  getEvaluation: (id: string) =>
    api.get<HeuristicEvaluation>(`/heuristic-evaluations/${id}`),

  createEvaluation: (data: Partial<HeuristicEvaluation>) =>
    api.post<HeuristicEvaluation>('/heuristic-evaluations', data),

  updateEvaluation: (id: string, data: Partial<HeuristicEvaluation>) =>
    api.put<HeuristicEvaluation>(`/heuristic-evaluations/${id}`, data),

  updateEvaluationStatus: (id: string, status: string) =>
    api.patch<HeuristicEvaluation>(`/heuristic-evaluations/${id}/status`, { status }),

  deleteEvaluation: (id: string) =>
    api.delete(`/heuristic-evaluations/${id}`),

  // ============================================================
  // 4. EVALUATORS
  // ============================================================
  assignEvaluator: (data: { evaluationId: string; userId: string; role?: string; notes?: string }) =>
    api.post<HeuristicEvaluator>('/heuristic-evaluators', data),

  getEvaluatorsByEvaluation: (evaluationId: string) =>
    api.get<HeuristicEvaluator[]>(`/heuristic-evaluators/evaluation/${evaluationId}`),

  getEvaluator: (id: string) =>
    api.get<HeuristicEvaluator>(`/heuristic-evaluators/${id}`),

  updateEvaluator: (id: string, data: { role?: string; notes?: string }) =>
    api.put<HeuristicEvaluator>(`/heuristic-evaluators/${id}`, data),

  markEvaluatorCompleted: (id: string) =>
    api.patch<HeuristicEvaluator>(`/heuristic-evaluators/${id}/complete`),

  deleteEvaluator: (id: string) =>
    api.delete(`/heuristic-evaluators/${id}`),

  // ============================================================
  // 5. TASKS
  // ============================================================
  createTask: (data: Partial<HeuristicTask>) =>
    api.post<HeuristicTask>('/heuristic-tasks', data),

  getTasksByEvaluation: (evaluationId: string) =>
    api.get<HeuristicTask[]>(`/heuristic-tasks/evaluation/${evaluationId}`),

  getTask: (id: string) =>
    api.get<HeuristicTask>(`/heuristic-tasks/${id}`),

  updateTask: (id: string, data: Partial<HeuristicTask>) =>
    api.put<HeuristicTask>(`/heuristic-tasks/${id}`, data),

  updateTaskStatus: (id: string, status: string) =>
    api.patch<HeuristicTask>(`/heuristic-tasks/${id}/status`, { status }),

  reorderTasks: (evaluationId: string, taskIds: string[]) =>
    api.patch(`/heuristic-tasks/evaluation/${evaluationId}/reorder`, { taskIds }),

  deleteTask: (id: string) =>
    api.delete(`/heuristic-tasks/${id}`),

  // ============================================================
  // 6. OBSERVATIONS
  // ============================================================
  createObservation: (data: Partial<HeuristicObservation>) =>
    api.post<HeuristicObservation>('/heuristic-observations', data),

  getObservationsByEvaluation: (evaluationId: string) =>
    api.get<HeuristicObservation[]>(`/heuristic-observations/evaluation/${evaluationId}`),

  getObservationsBySession: (sessionId: string) =>
    api.get<HeuristicObservation[]>(`/heuristic-observations/session/${sessionId}`),

  getObservationsByPrinciple: (principleId: string) =>
    api.get<HeuristicObservation[]>(`/heuristic-observations/principle/${principleId}`),

  getObservation: (id: string) =>
    api.get<HeuristicObservation>(`/heuristic-observations/${id}`),

  updateObservation: (id: string, data: Partial<HeuristicObservation>) =>
    api.put<HeuristicObservation>(`/heuristic-observations/${id}`, data),

  deleteObservation: (id: string) =>
    api.delete(`/heuristic-observations/${id}`),

  // ============================================================
  // 7. POSITIVE ASPECTS
  // ============================================================
  createPositiveAspect: (data: Partial<HeuristicPositiveAspect>) =>
    api.post<HeuristicPositiveAspect>('/heuristic-positive-aspects', data),

  getPositiveAspectsByEvaluation: (evaluationId: string) =>
    api.get<HeuristicPositiveAspect[]>(`/heuristic-positive-aspects/evaluation/${evaluationId}`),

  getPositiveAspectsBySession: (sessionId: string) =>
    api.get<HeuristicPositiveAspect[]>(`/heuristic-positive-aspects/session/${sessionId}`),

  updatePositiveAspect: (id: string, data: Partial<HeuristicPositiveAspect>) =>
    api.put<HeuristicPositiveAspect>(`/heuristic-positive-aspects/${id}`, data),

  deletePositiveAspect: (id: string) =>
    api.delete(`/heuristic-positive-aspects/${id}`),

  // ============================================================
  // 8. RATINGS
  // ============================================================
  createRating: (data: Partial<HeuristicRating>) =>
    api.post<HeuristicRating>('/heuristic-ratings', data),

  getRatingsByEvaluation: (evaluationId: string) =>
    api.get<HeuristicRating[]>(`/heuristic-ratings/evaluation/${evaluationId}`),

  getRatingsByObservation: (problemId: string) =>
    api.get<HeuristicRating[]>(`/heuristic-ratings/observation/${problemId}`),

  getAverageRatingByObservation: (problemId: string) =>
    api.get(`/heuristic-ratings/observation/${problemId}/average`),

  updateRating: (id: string, data: Partial<HeuristicRating>) =>
    api.put<HeuristicRating>(`/heuristic-ratings/${id}`, data),

  deleteRating: (id: string) =>
    api.delete(`/heuristic-ratings/${id}`),

  // ============================================================
  // 9. FINAL RESULTS
  // ============================================================
  generateFinalResults: (data: { evaluationId: string; totalEvaluators?: number; completedEvaluators?: number }) =>
    api.post<HeuristicFinalResult>('/heuristic-final-results/generate', data),

  getFinalResultsByEvaluation: (evaluationId: string) =>
    api.get<HeuristicFinalResult>(`/heuristic-final-results/evaluation/${evaluationId}`),

  getFinalResult: (id: string) =>
    api.get<HeuristicFinalResult>(`/heuristic-final-results/${id}`),

  recalculateFinalResults: (evaluationId: string) =>
    api.post<HeuristicFinalResult>(`/heuristic-final-results/evaluation/${evaluationId}/recalculate`),

  updateFinalResultStatus: (id: string, status: string) =>
    api.patch<HeuristicFinalResult>(`/heuristic-final-results/${id}/status`, { status }),

  deleteFinalResult: (id: string) =>
    api.delete(`/heuristic-final-results/${id}`),




upsertTaskProgress: (data: {
  evaluatorId: string
  taskId: string
  evaluationId: string
  sessionId?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'failed'
}) => api.post<HeuristicTaskProgress>('/heuristic-task-progress/upsert', data),

findMyProgress: (evaluationId: string, evaluatorId: string) =>
  api.get<HeuristicTaskProgress[]>(
    `/heuristic-task-progress/evaluation/${evaluationId}/evaluator/${evaluatorId}`,
  ),

findProgressByTask: (taskId: string) =>
  api.get<HeuristicTaskProgress[]>(`/heuristic-task-progress/task/${taskId}`),

findProgressByEvaluator: (evaluatorId: string) =>
  api.get<HeuristicTaskProgress[]>(`/heuristic-task-progress/evaluator/${evaluatorId}`),

findProgressByEvaluation: (evaluationId: string) =>
  api.get<HeuristicTaskProgress[]>(`/heuristic-task-progress/evaluation/${evaluationId}`),

updateTaskProgressStatus: (
  id: string,
  data: { status: string; sessionId?: string },
) => api.patch<HeuristicTaskProgress>(`/heuristic-task-progress/${id}/status`, data),

deleteTaskProgress: (id: string) =>
  api.delete(`/heuristic-task-progress/${id}`),
}