// api/comment-experts.api.ts

import  api  from './axios'

export interface ExpertComment {
  commentId: string
  projectId: string
  sessionId: string
  taskId?: string | null
  authorId: string
  commentType: 'observation' | 'problem' | 'recommendation' | 'positive' | 'question'
  comment: string
  nodeId?: string | null
  screenIdentifier?: string | null
  severity: number // 1-5
  elapsedMsTotal: number
  createdAt: string
  updatedAt: string
  author?: {
    displayName: string
    email: string
  }
}

export const commentExpertsApi = {
  // Crear comentario de experto
  create: (data: {
    projectId: string
    sessionId: string
    taskId?: string
    authorId: string
    commentType: 'observation' | 'problem' | 'recommendation' | 'positive' | 'question'
    comment: string
    nodeId?: string
    screenIdentifier?: string
    severity?: number
    elapsedMsTotal: number
  }) =>
    api.post<ExpertComment>('/comment-experts', data),

  // Obtener comentarios de un proyecto
  getByProject: (projectId: string) =>
    api.get<ExpertComment[]>(`/comment-experts/project/${projectId}`),

  // Obtener comentarios de una sesión
  getBySession: (sessionId: string) =>
    api.get<ExpertComment[]>(`/comment-experts/session/${sessionId}`),

  // Obtener comentarios de una tarea
  getByTask: (taskId: string) =>
    api.get<ExpertComment[]>(`/comment-experts/task/${taskId}`),

  // Actualizar comentario
  update: (commentId: string, data: {
    comment?: string
    commentType?: string
    severity?: number
  }) =>
    api.patch<ExpertComment>(`/comment-experts/${commentId}`, data),

  // Eliminar comentario
  delete: (commentId: string) =>
    api.delete(`/comment-experts/${commentId}`),
}