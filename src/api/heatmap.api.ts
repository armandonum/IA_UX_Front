// api/heatmap.api.ts

import  api  from './axios'

export interface HeatmapEvent {
  sessionId: string
  projectId: string
  userId?: string
  eventType: 'click' | 'move' | 'scroll' | 'dwell' | 'resize'
  nodeId?: string
  screenIdentifier?: string
  xPct: number
  yPct: number
  viewportWidth: number
  viewportHeight: number
  scrollDepth?: number
  elementSelector?: string
  dwellMs?: number
  elapsedMsTotal: number
  userAgent?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet'
  browser?: string
}

export interface HeatmapData {
  xPct: number
  yPct: number
  intensity: number
}

export interface HeatmapSummary {
  totalEvents: number
  totalClicks: number
  totalMoves: number
  totalScrolls: number
  uniqueSessions: number
  topNodes: { nodeId: string; clicks: number }[]
  averageClicksPerSession: number
  deviceDistribution: Record<string, number>
  eventTypeDistribution: {
    click: number
    move: number
    scroll: number
    dwell: number
    resize: number
  }
}

export interface HeatmapImageResponse {
  heatmapImageId: string
  imageUrl?: string
  imageData?: string
  projectId: string
  nodeId: string
  eventType: string
}

export const heatmapApi = {
  // Registrar evento
  createEvent: (data: HeatmapEvent) =>
    api.post<{ eventId: string }>('/heatmap/events', data),

  // Obtener datos agregados para mapa de calor
  getHeatmapData: (params: {
    projectId: string
    nodeId?: string
    eventType: 'click' | 'move' | 'scroll'
    dateRangeStart?: string
    dateRangeEnd?: string
    deviceType?: 'desktop' | 'mobile' | 'tablet'
  }) =>
    api.get<HeatmapData[]>('/heatmap/data', { params }),

  // Obtener resumen de estadísticas
  getSummary: (projectId: string) =>
    api.get<HeatmapSummary>(`/heatmap/summary/${projectId}`),

  // 🔥 GENERAR IMAGEN DE MAPA DE CALOR (NUEVO)
  getHeatmapImage: (params: {
    projectId: string
    nodeId: string
    eventType: 'click' | 'move' | 'scroll'
    deviceType?: 'desktop' | 'mobile' | 'tablet'
    dateRangeStart?: string
    dateRangeEnd?: string
    minSessions?: number
  }) =>
    api.post<HeatmapImageResponse>('/heatmap/generate', params),

  // 🔥 OBTENER IMAGEN EXISTENTE (si ya fue generada)
  getHeatmapImageExisting: (params: {
    projectId: string
    nodeId: string
    eventType: 'click' | 'move' | 'scroll'
    deviceType?: 'desktop' | 'mobile' | 'tablet'
  }) =>
    api.get<HeatmapImageResponse>('/heatmap/image', { params }),

  // Eliminar eventos de una sesión
  deleteBySession: (sessionId: string) =>
    api.delete(`/heatmap/session/${sessionId}`),
}