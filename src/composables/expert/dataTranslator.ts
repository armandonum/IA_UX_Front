// composables/expert/dataTranslator.ts
/**
 * Traduce datos crudos (JSON) a texto legible para el usuario
 */

import {
  getEmotionTemplate,
  getHumanLabel,
  normalizeScore,
} from '@/types/expert/findings.dictionary'

// ============================================================
// EMOCIONES
// ============================================================

/**
 * Traduce el objeto scoresJson de una emoción a texto legible
 * Ej: {happy: 0.8, sad: 0.1, neutral: 0.1} → "Felicidad: 80%, Tristeza: 10%, Neutral: 10%"
 */
export function formatEmotionScores(
  scoresJson: Record<string, number> | null | undefined,
): { label: string; value: number; color: string; emoji: string }[] {
  if (!scoresJson) return []

  return Object.entries(scoresJson)
    .map(([emotion, score]) => {
      const template = getEmotionTemplate(emotion)
      return {
        label: template.labelEs,
        value: normalizeScore(score),
        color: template.color,
        emoji: template.emoji,
      }
    })
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
}

/**
 * Traduce una emoción dominante a texto legible
 */
export function formatEmotion(emotion: string | null | undefined): string {
  if (!emotion) return 'No detectada'
  const template = getEmotionTemplate(emotion)
  return `${template.emoji} ${template.labelEs}`
}

/**
 * Traduce una lista de emociones agrupadas
 */
export function summarizeEmotions(
  readings: any[],
): { emotion: string; count: number; percentage: number }[] {
  if (!readings.length) return []

  const counts: Record<string, number> = {}
  readings.forEach((r) => {
    const emotion = r.dominantEmotion || r.emotion || 'neutral'
    counts[emotion] = (counts[emotion] || 0) + 1
  })

  return Object.entries(counts)
    .map(([emotion, count]) => ({
      emotion,
      count,
      percentage: Math.round((count / readings.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

// ============================================================
// SENTIMIENTOS
// ============================================================

/**
 * Traduce el objeto scoresJson de un sentimiento a texto legible
 */
export function formatSentimentScores(
  scoresJson: Record<string, number> | null | undefined,
): { label: string; value: number }[] {
  if (!scoresJson) return []

  return Object.entries(scoresJson)
    .map(([sentiment, score]) => ({
      label: sentiment,
      value: normalizeScore(score),
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
}

/**
 * Traduce un sentimiento a texto legible
 */
export function formatSentiment(sentiment: string | null | undefined): string {
  if (!sentiment) return 'No detectado'
  return sentiment
}

// ============================================================
// EVENTOS
// ============================================================

/**
 * Traduce un evento a texto legible
 */
export function formatEvent(event: any): string {
  if (!event) return 'Evento desconocido'

  const eventType = event.event_type_normalizado || event.event_type
  const translated = getHumanLabel('eventType', eventType)

  const parts: string[] = [translated]

  if (event.screen_name) {
    parts.push(`en ${event.screen_name}`)
  }

  return parts.join(' ')
}

// ============================================================
// FECHAS Y TIEMPOS
// ============================================================

export function formatTime(ms: number): string {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString('es-BO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

// ============================================================
// SESIÓN
// ============================================================

/**
 * Traduce el estado de la sesión
 */
export function formatSessionStatus(status: string): string {
  const labels: Record<string, string> = {
    in_progress: 'En progreso',
    completed: 'Completada',
    abandoned: 'Abandonada',
  }
  return labels[status] || status
}

/**
 * Traduce el tipo de dispositivo
 */
export function formatDeviceType(device: string | null): string {
  if (!device) return 'No especificado'
  const labels: Record<string, string> = {
    desktop: 'Escritorio',
    mobile: 'Móvil',
    tablet: 'Tablet',
  }
  return labels[device] || device
}

/**
 * Construye un resumen legible de la sesión
 */
export function summarizeSession(session: any): Record<string, string> {
  if (!session) return {}

  const durationMs = (session.durationSeconds || 0) * 1000
  const startedAt = session.startedAt
  const endedAt = session.endedAt

  return {
    'ID de Sesión': session.sessionId || '—',
    'Tarea': session.taskDescription || '—',
    'Estado': formatSessionStatus(session.status),
    'Dispositivo': formatDeviceType(session.deviceType),
    'Navegador': session.browser || '—',
    'Inicio': formatDate(startedAt),
    'Fin': formatDate(endedAt),
    'Duración': formatDuration(durationMs),
  }
}

// ============================================================
// HALLAZGOS
// ============================================================

/**
 * Traduce un hallazgo completo a texto legible
 */
export function formatFinding(finding: any): Record<string, string> {
  return {
    'Tipo': getHumanLabel('type', finding.type),
    'Severidad': getHumanLabel('severity', finding.severity),
    'Estado': getHumanLabel('status', finding.status),
    'Descripción': finding.description || '—',
    'Recomendación': finding.recommendation || '—',
    'Impacto': getHumanLabel('impact', finding.impact),
    'Prioridad': getHumanLabel('priority', finding.priority),
    'Frecuencia': `${finding.frequency || 1} vez/veces`,
    'Emoción': formatEmotion(finding.emotionInferred),
    'Sentimiento': formatSentiment(finding.textualSentiment),
    'Comentario del Usuario': finding.userComment || '—',
    'Comentario del Experto': finding.expertComment || '—',
    'Pantalla (Node ID)': finding.nodeId || '—',
    'Versión': finding.version || '1.0',
    'Creado': formatDate(finding.createdAt),
    'Actualizado': formatDate(finding.updatedAt),
  }
}


/**
 * Traduce un evento a texto legible para mostrar al usuario
 * Retorna un objeto con múltiples campos legibles
 */
export function formatEventFull(event: any): {
  tipo: string
  pantalla: string
  nodeId: string
  tiempo: string
  detalle: string
} {
  if (!event) {
    return { tipo: '—', pantalla: '—', nodeId: '—', tiempo: '00:00', detalle: '—' }
  }

  const eventTypeRaw = event.event_type_normalizado || event.event_type || 'unknown'
  const eventType = getHumanLabel('eventType', eventTypeRaw)

  const pantalla = event.screen_name || 'Sin nombre'
  const nodeId = event.node_id || '—'
  const tiempo = formatTime(event.elapsed_ms_total || 0)

  // Detalle adicional desde raw_payload (traducido)
  let detalle = '—'
  if (event.raw_payload && typeof event.raw_payload === 'object') {
    const payload = event.raw_payload as any
    const parts: string[] = []

    if (payload.targetNodeId) parts.push(`Nodo destino: ${payload.targetNodeId}`)
    if (payload.presentedNodeId) parts.push(`Nodo presentado: ${payload.presentedNodeId}`)
    if (payload.sourceNodeId) parts.push(`Nodo origen: ${payload.sourceNodeId}`)
    if (payload.x !== undefined && payload.y !== undefined) {
      parts.push(`Posición: (${Math.round(payload.x)}, ${Math.round(payload.y)})`)
    }
    if (payload.key) parts.push(`Tecla: ${payload.key}`)
    if (payload.target) parts.push(`Elemento: ${payload.target}`)
    if (payload.url) parts.push(`URL: ${payload.url}`)

    detalle = parts.length > 0 ? parts.join(' • ') : '—'
  }

  return { tipo: eventType, pantalla, nodeId, tiempo, detalle }
}