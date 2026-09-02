// api/heuristic.api.ts

import api from './axios' // 🔥 Sin llaves, exportación por defecto
import type { 
  HeuristicEvaluation, 
  HeuristicAnswer, 
  HeuristicSession,
  HeuristicPrinciple
} from '@/types/heuristic.types'

export const heuristicApi = {
  // ============================================================
  // SESIONES
  // ============================================================

  /**
   * Crear una nueva sesión de evaluación heurística
   */
  createSession: (data: {
    projectId: string
    userId: string
    fileKey: string
  }) => api.post<{ sessionId: string }>('/heuristic-sessions', data),

  /**
   * Obtener una sesión por ID
   */
  getSession: (sessionId: string) =>
    api.get<HeuristicSession>(`/heuristic-sessions/${sessionId}`),

  /**
   * Finalizar una sesión
   */
  finishSession: (sessionId: string, data: {
    status: 'completed' | 'abandoned'
    durationSeconds: number
  }) => api.patch<{ success: boolean }>(`/heuristic-sessions/${sessionId}/finish`, data),

  /**
   * Obtener todas las sesiones de un proyecto
   */
  getProjectSessions: (projectId: string) =>
    api.get<HeuristicSession[]>(`/heuristic-sessions/project/${projectId}`),

  /**
   * Obtener todas las sesiones de un usuario
   */
  getUserSessions: (userId: string) =>
    api.get<HeuristicSession[]>(`/heuristic-sessions/user/${userId}`),

  /**
   * Eliminar una sesión
   */
  deleteSession: (sessionId: string) =>
    api.delete<{ success: boolean }>(`/heuristic-sessions/${sessionId}`),

  // ============================================================
  // RESPUESTAS
  // ============================================================

  /**
   * Guardar una respuesta individual
   */
  saveAnswer: (data: {
    sessionId: string
    principleId: string
    questionId: string
    value: number | boolean | string
    comment?: string
    timestampMs: number
  }) => api.post<{ answerId: string }>('/heuristic-answers', data),

  /**
   * Guardar todas las respuestas de un principio de una vez
   */
  savePrincipleAnswers: (data: {
    sessionId: string
    principleId: string
    answers: {
      questionId: string
      value: number | boolean | string
      comment?: string
    }[]
  }) => api.post<{ count: number }>('/heuristic-answers/batch', data),

  /**
   * Obtener todas las respuestas de una sesión
   */
  getSessionAnswers: (sessionId: string) =>
    api.get<HeuristicAnswer[]>(`/heuristic-answers/session/${sessionId}`),

  /**
   * Obtener respuestas de un principio específico
   */
  getPrincipleAnswers: (sessionId: string, principleId: string) =>
    api.get<HeuristicAnswer[]>(`/heuristic-answers/session/${sessionId}/principle/${principleId}`),

  /**
   * Actualizar una respuesta
   */
  updateAnswer: (answerId: string, data: {
    value?: number | boolean | string
    comment?: string
  }) => api.patch<{ success: boolean }>(`/heuristic-answers/${answerId}`, data),

  /**
   * Eliminar una respuesta
   */
  deleteAnswer: (answerId: string) =>
    api.delete<{ success: boolean }>(`/heuristic-answers/${answerId}`),

  // ============================================================
  // EVALUACIONES COMPLETAS
  // ============================================================

  /**
   * Obtener una evaluación completa (sesión + respuestas)
   */
  getFullEvaluation: (sessionId: string) =>
    api.get<{
      session: HeuristicSession
      answers: HeuristicAnswer[]
      principles: HeuristicPrinciple[]
    }>(`/heuristic-sessions/${sessionId}/full`),

  /**
   * Obtener todas las evaluaciones de un proyecto (con respuestas)
   */
  getProjectEvaluations: (projectId: string) =>
    api.get<{
      sessions: HeuristicSession[]
      answers: HeuristicAnswer[]
    }>(`/heuristic-sessions/project/${projectId}/evaluations`),

  /**
   * Obtener resumen de evaluaciones de un proyecto
   */
  getProjectSummary: (projectId: string) =>
    api.get<{
      totalEvaluations: number
      completed: number
      averageDuration: number
      principlesScores: {
        principleId: string
        code: string
        name: string
        averageScore: number
        totalAnswers: number
      }[]
    }>(`/heuristic-sessions/project/${projectId}/summary`),

  // ============================================================
  // PRINCIPIOS HEURÍSTICOS
  // ============================================================

  /**
   * Obtener todos los principios heurísticos (con preguntas)
   */
  getPrinciples: () =>
    api.get<HeuristicPrinciple[]>('/heuristic-principles'),

  /**
   * Obtener un principio específico
   */
  getPrinciple: (principleId: string) =>
    api.get<HeuristicPrinciple>(`/heuristic-principles/${principleId}`),

  // ============================================================
  // EXPORTAR
  // ============================================================

  /**
   * Exportar evaluación a PDF
   */
  exportEvaluation: (sessionId: string) =>
    api.get(`/heuristic-sessions/${sessionId}/export`, {
      responseType: 'blob',
    }),

  /**
   * Exportar todas las evaluaciones de un proyecto
   */
  exportProjectEvaluations: (projectId: string) =>
    api.get(`/heuristic-sessions/project/${projectId}/export`, {
      responseType: 'blob',
    }),
}