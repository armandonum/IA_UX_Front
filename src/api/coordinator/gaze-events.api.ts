// api/gaze-events.api.ts
import api from '../axios'

// ============================================================
// TIPOS
// ============================================================
export interface GazeEvent {
  eventId: string
  sessionId: string
  elapsedMsTotal: number
  timestampReal: string
  gazeX: number      // 0-1
  gazeY: number      // 0-1
  confidence: number // 0-1
  viewportWidth: number
  viewportHeight: number
  nodeId: string | null
  eventType: 'raw' | 'fixation' | 'saccade'
  durationMs: number
  createdAt: string
}

export interface GazeHeatmapPoint {
  xPct: number    // 0-100
  yPct: number    // 0-100
  weight: number  // Cantidad de fijaciones
}

export interface AoiMetric {
  metricId: string
  sessionId: string
  aoiName: string
  aoiX1: number
  aoiY1: number
  aoiX2: number
  aoiY2: number
  timeToFirstFixationMs: number
  fixationCount: number
  totalFixationDurationMs: number
  fixationsBefore: number
  percentageFixated: number
  nodeId: string | null
  calculatedAt: string
}

export interface GazeHeatmapQuery {
  startMs?: number
  endMs?: number
  nodeId?: string
}

export interface CalculateAoiMetricsResponse {
  sessionId: string
  aoiCount: number
  metrics: AoiMetric[]
}

// ============================================================
// API
// ============================================================
export const gazeEventsApi = {
  /**
   * Obtener todos los eventos de mirada de una sesión
   */
  getBySession: (sessionId: string) =>
    api.get<GazeEvent[]>(`/gaze-events/session/${sessionId}`),

  /**
   * Obtener datos de heatmap (puntos agrupados)
   */
  getHeatmapData: (sessionId: string, query?: GazeHeatmapQuery) => {
    const params: any = {}
    if (query?.startMs !== undefined) params.startMs = query.startMs
    if (query?.endMs !== undefined) params.endMs = query.endMs
    if (query?.nodeId) params.nodeId = query.nodeId
    return api.get<GazeHeatmapPoint[]>(
      `/gaze-events/session/${sessionId}/heatmap`,
      { params },
    )
  },

  /**
   * Crear un evento de mirada
   */
  create: (data: any) =>
    api.post<GazeEvent>('/gaze-events', data),

  /**
   * Crear eventos en batch
   */
  createBatch: (events: any[]) =>
    api.post<{ count: number }>('/gaze-events/batch', { events }),

  /**
   * Eliminar un evento
   */
  delete: (eventId: string) =>
    api.delete(`/gaze-events/${eventId}`),

  /**
   * Eliminar todos los eventos de una sesión
   */
  deleteBySession: async (sessionId: string) => {
    const { data } = await gazeEventsApi.getBySession(sessionId)
    await Promise.all(data.map((e) => gazeEventsApi.delete(e.eventId)))
  },
}

// ============================================================
// AOI METRICS API
// ============================================================
export const aoiMetricsApi = {
  /**
   * Calcular métricas AOI para una sesión
   */
  calculate: (sessionId: string, startMs?: number, endMs?: number) =>
    api.post<CalculateAoiMetricsResponse>('/gaze-aoi-metrics/calculate', {
      sessionId,
      startMs,
      endMs,
    }),

  /**
   * Obtener métricas AOI de una sesión
   */
  getBySession: (sessionId: string) =>
    api.get<AoiMetric[]>(`/gaze-aoi-metrics/session/${sessionId}`),
}

// ============================================================
// AOI DEFINITIONS API
// ============================================================
export const aoiDefinitionsApi = {
  /**
   * Obtener AOIs de un proyecto
   */
  getByProject: (projectId: string) =>
    api.get<AoiMetric[]>('/aoi-definitions/project/' + projectId),
}