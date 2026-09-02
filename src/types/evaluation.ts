export interface FigmaProject {
  projectId: string
  fileKey: string
  projectName: string
  lastModified: string
  version: string
  thumbnailUrl: string | null
  fetchedAt: string
  rawJsonPath: string | null
  createdAt: string
}

// OJO: el backend tiene el typo "proyectId" (no "projectId") en este objeto,
// y "screenVideKey" (sin la segunda "o") — se respetan tal cual vienen.
export interface UsabilitySession {
  sessionId: string
  proyectId: string
  userId: string | null
  taskId: string | null
  fileKey: string
  nodeIdInicial: string | null
  taskDescription: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number
  status: 'in_progress' | 'completed' | 'abandoned'
  deviceType: 'desktop' | 'mobile' | 'tablet' | null
  browser: string | null
  faceVideoKey: string | null
  screenVideKey: string | null
  createdAt: string
  updatedAt: string
}

export interface UsabilityEvent {
  event_id: string
  session_id: string
  event_type: string
  event_type_normalizado: string
  node_id: string | null
  screen_name: string | null
  elapsed_minute: number
  elapsed_second: number
  elapsed_ms_total: number
  timestamp_real: string
  raw_payload: unknown
  created_at?: string
}

export interface EmotionReading {
  readingId: string
  sessionId: string
  elapsedMsTotal: number
  timestampReal: string
  dominantEmotion: string | null
  scoresJson: Record<string, number> | null
  createdAt: string
}