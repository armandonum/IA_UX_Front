// api/heuristic.mock.ts

import type { HeuristicObservation } from '@/data/heuristicPrinciples'
import type { Task } from '@/types/usability'

// ============================================================
// DATOS MOCK
// ============================================================

let mockSessionId: string | null = null
let mockObservations: HeuristicObservation[] = []
let mockTasks: Task[] = []

// ============================================================
// FUNCIONES MOCK
// ============================================================

export const heuristicMock = {
  // Simular creación de sesión
  createSession: (data: {
    projectId: string
    userId: string
    fileKey: string
  }): Promise<{ data: { sessionId: string } }> => {
    mockSessionId = `mock-session-${Date.now()}`
    mockObservations = []
    
    return Promise.resolve({
      data: {
        sessionId: mockSessionId
      }
    })
  },

  // Simular finalización de sesión
  finishSession: (sessionId: string, data: {
    status: 'completed' | 'abandoned'
    durationSeconds: number
  }): Promise<{ data: { success: boolean } }> => {
    console.log('📝 Sesión finalizada:', { sessionId, ...data })
    console.log('📊 Observaciones totales:', mockObservations.length)
    console.log('📋 Observaciones:', mockObservations)
    
    return Promise.resolve({
      data: { success: true }
    })
  },

  // Simular guardar observaciones
  saveObservations: (observations: HeuristicObservation[]): Promise<{ data: { count: number } }> => {
    mockObservations = observations
    return Promise.resolve({
      data: { count: observations.length }
    })
  },

  // Obtener observaciones de una sesión
  getObservations: (sessionId: string): Promise<{ data: HeuristicObservation[] }> => {
    return Promise.resolve({
      data: mockObservations
    })
  },

  // Limpiar datos mock (para reiniciar)
  clear: () => {
    mockSessionId = null
    mockObservations = []
    mockTasks = []
  }
}