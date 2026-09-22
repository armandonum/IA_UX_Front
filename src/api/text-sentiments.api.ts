// api/text-sentiments.api.ts

import api  from './axios'

export interface TextSentiment {
  sentimentId: string
  sessionId: string
  text: string
  originalLabel: string
  uxLabel: string
  confidence: number
  scoresJson: Record<string, number>
  elapsedMsTotal: number
  timestampReal: string
  createdAt: string
  authorId: string | null
}

export const textSentimentsApi = {
  // Obtener sentimientos de una sesión
  getBySession: (sessionId: string) =>
    api.get<TextSentiment[]>(`/text-sentiments/session/${sessionId}`),

  // Obtener sentimientos de un proyecto
  getByProject: (projectId: string) =>
    api.get<TextSentiment[]>(`/text-sentiments/project/${projectId}`),

  // Obtener sentimientos de un usuario
  getByUser: (userId: string) =>
    api.get<TextSentiment[]>(`/text-sentiments/user/${userId}`),
}