// data/heuristicFindingsDictionary.ts

/**
 * Diccionario de clasificación para generación automática de hallazgos
 * en evaluaciones heurísticas.
 *
 * Cada entrada define cómo se debe clasificar un disparador
 * (emoción, sentimiento, observación, aspecto positivo, comentario experto)
 * en un hallazgo con sus atributos completos.
 */

// ============================================================
// TIPOS
// ============================================================
export type FindingType =
  | 'problem'
  | 'difficulty'
  | 'accessibility'
  | 'friction'
  | 'positive'
  | 'opportunity'

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low'

export type FindingImpact = 'high' | 'medium' | 'low'

export type FindingPriority = 'high' | 'medium' | 'low'

export type FindingClass =
  | 'emotional'
  | 'sentiment'
  | 'usability'
  | 'expert'
  | 'mixed'
  | 'positive'

export type TriggerSource =
  | 'emotion'
  | 'sentiment'
  | 'observation'
  | 'positive'
  | 'expertComment'
  | 'userComment'

export interface FindingTemplate {
  type: FindingType
  severity: FindingSeverity
  impact: FindingImpact
  priority: FindingPriority
  class: FindingClass
  recommendation?: string
  descriptionPrefix?: string
}

export interface TriggerContext {
  ms: number
  nodeId?: string | null
  screenName?: string | null
  taskId?: string | null
  sessionId?: string | null
  description?: string
  source: TriggerSource
}

// ============================================================
// DICCIONARIO: EMOCIONES
// ============================================================
export const EMOTION_TO_FINDING: Record<string, FindingTemplate> = {
  angry: {
    type: 'problem',
    severity: 'high',
    impact: 'high',
    priority: 'high',
    class: 'emotional',
    descriptionPrefix: 'Enojo detectado',
    recommendation:
      'Revisar el flujo que provocó enojo. Identificar el punto de fricción y simplificarlo.',
  },
  sad: {
    type: 'difficulty',
    severity: 'medium',
    impact: 'medium',
    priority: 'medium',
    class: 'emotional',
    descriptionPrefix: 'Tristeza detectada',
    recommendation:
      'Analizar si el usuario experimentó frustración o desmotivación. Considerar mejoras en feedback positivo.',
  },
  fear: {
    type: 'problem',
    severity: 'high',
    impact: 'high',
    priority: 'high',
    class: 'emotional',
    descriptionPrefix: 'Miedo detectado',
    recommendation:
      'Revisar posibles fuentes de ansiedad (errores irreversibles, falta de claridad). Añadir confirmaciones y mensajes tranquilizadores.',
  },
  disgust: {
    type: 'problem',
    severity: 'medium',
    impact: 'medium',
    priority: 'medium',
    class: 'emotional',
    descriptionPrefix: 'Asco detectado',
    recommendation:
      'Revisar el elemento visual o de contenido que provocó rechazo.',
  },
  surprise: {
    type: 'opportunity',
    severity: 'low',
    impact: 'medium',
    priority: 'low',
    class: 'emotional',
    descriptionPrefix: 'Sorpresa detectada',
    recommendation:
      'Evaluar si la sorpresa fue positiva o negativa. Si fue negativa, agregar expectativas claras.',
  },
  happy: {
    type: 'positive',
    severity: 'low',
    impact: 'low',
    priority: 'low',
    class: 'positive',
    descriptionPrefix: 'Felicidad detectada',
    recommendation: 'Mantener el elemento que provocó esta emoción positiva.',
  },
  neutral: {
    type: 'opportunity',
    severity: 'low',
    impact: 'low',
    priority: 'low',
    class: 'emotional',
    descriptionPrefix: 'Neutralidad detectada',
    recommendation:
      'Considerar si el usuario está desinteresado o simplemente concentrado.',
  },
}

// ============================================================
// DICCIONARIO: SENTIMIENTOS UX
// ============================================================
export const SENTIMENT_TO_FINDING: Record<string, FindingTemplate> = {
  Confusión: {
    type: 'difficulty',
    severity: 'medium',
    impact: 'medium',
    priority: 'medium',
    class: 'sentiment',
    descriptionPrefix: 'Confusión expresada por el usuario',
    recommendation:
      'Revisar la claridad de las instrucciones y los textos. Simplificar el flujo.',
  },
  Frustración: {
    type: 'problem',
    severity: 'high',
    impact: 'high',
    priority: 'high',
    class: 'sentiment',
    descriptionPrefix: 'Frustración expresada por el usuario',
    recommendation:
      'Identificar el bloqueo y proporcionar retroalimentación clara. Añadir ayuda contextual.',
  },
  Rechazo: {
    type: 'problem',
    severity: 'high',
    impact: 'high',
    priority: 'high',
    class: 'sentiment',
    descriptionPrefix: 'Rechazo expresado por el usuario',
    recommendation:
      'Revisar el diseño visual o el contenido que provocó rechazo.',
  },
  'Dificultad / esfuerzo': {
    type: 'difficulty',
    severity: 'medium',
    impact: 'medium',
    priority: 'medium',
    class: 'sentiment',
    descriptionPrefix: 'Dificultad o esfuerzo elevado',
    recommendation:
      'Reducir el número de pasos y la carga cognitiva.',
  },
  Aburrimiento: {
    type: 'friction',
    severity: 'low',
    impact: 'medium',
    priority: 'low',
    class: 'sentiment',
    descriptionPrefix: 'Aburrimiento expresado por el usuario',
    recommendation:
      'Añadir elementos de engagement o hacer el flujo más ágil.',
  },
  Satisfacción: {
    type: 'positive',
    severity: 'low',
    impact: 'low',
    priority: 'low',
    class: 'positive',
    descriptionPrefix: 'Satisfacción expresada por el usuario',
    recommendation: 'Mantener el patrón que generó satisfacción.',
  },
  'Interés / motivación': {
    type: 'opportunity',
    severity: 'low',
    impact: 'low',
    priority: 'low',
    class: 'positive',
    descriptionPrefix: 'Interés o motivación expresada',
    recommendation: 'Aprovechar este interés para mejorar la experiencia.',
  },
  Sorpresa: {
    type: 'opportunity',
    severity: 'low',
    impact: 'medium',
    priority: 'low',
    class: 'sentiment',
    descriptionPrefix: 'Sorpresa expresada por el usuario',
    recommendation:
      'Asegurar que las sorpresas sean positivas y no confusas.',
  },
  Alivio: {
    type: 'positive',
    severity: 'low',
    impact: 'low',
    priority: 'low',
    class: 'positive',
    descriptionPrefix: 'Alivio expresado por el usuario',
    recommendation: 'Mantener la solución que generó alivio.',
  },
  Desconfianza: {
    type: 'problem',
    severity: 'medium',
    impact: 'medium',
    priority: 'medium',
    class: 'sentiment',
    descriptionPrefix: 'Desconfianza expresada por el usuario',
    recommendation:
      'Revisar transparencia de acciones y confirmaciones. Añadir información clara.',
  },
  Neutral: {
    type: 'opportunity',
    severity: 'low',
    impact: 'low',
    priority: 'low',
    class: 'sentiment',
    descriptionPrefix: 'Sentimiento neutral',
    recommendation: 'Analizar si la neutralidad implica indiferencia.',
  },
}

// ============================================================
// DICCIONARIO: OBSERVACIONES HEURÍSTICAS (por severidad)
// ============================================================
export const OBSERVATION_SEVERITY_TO_FINDING: Record<number, FindingTemplate> = {
  1: {
    type: 'opportunity',
    severity: 'low',
    impact: 'low',
    priority: 'low',
    class: 'usability',
    descriptionPrefix: 'Observación heurística (leve)',
    recommendation: 'Considerar mejora opcional.',
  },
  2: {
    type: 'opportunity',
    severity: 'low',
    impact: 'medium',
    priority: 'low',
    class: 'usability',
    descriptionPrefix: 'Observación heurística (menor)',
    recommendation: 'Implementar cuando haya oportunidad.',
  },
  3: {
    type: 'difficulty',
    severity: 'medium',
    impact: 'medium',
    priority: 'medium',
    class: 'usability',
    descriptionPrefix: 'Observación heurística (moderada)',
    recommendation:
      'Resolver en el próximo ciclo de mejora.',
  },
  4: {
    type: 'problem',
    severity: 'high',
    impact: 'high',
    priority: 'high',
    class: 'usability',
    descriptionPrefix: 'Observación heurística (grave)',
    recommendation:
      'Priorizar su resolución. Afecta significativamente la usabilidad.',
  },
  5: {
    type: 'problem',
    severity: 'critical',
    impact: 'high',
    priority: 'high',
    class: 'usability',
    descriptionPrefix: 'Observación heurística (crítica)',
    recommendation:
      'Resolver de inmediato. Bloquea o impide completar la tarea.',
  },
}

// ============================================================
// DICCIONARIO: FRECUENCIA DE OBSERVACIÓN
// ============================================================
export const OBSERVATION_FREQUENCY_WEIGHT: Record<string, number> = {
  Siempre: 3,
  Frecuentemente: 2,
  Ocasionalmente: 1,
  Raramente: 0.5,
  Nunca: 0,
}

// ============================================================
// DICCIONARIO: ASPECTOS POSITIVOS
// ============================================================
export const POSITIVE_TO_FINDING: FindingTemplate = {
  type: 'positive',
  severity: 'low',
  impact: 'low',
  priority: 'low',
  class: 'positive',
  descriptionPrefix: 'Aspecto positivo identificado',
  recommendation: 'Mantener y reforzar este elemento.',
}

// ============================================================
// DICCIONARIO: COMENTARIOS DE EXPERTO
// ============================================================
export const EXPERT_COMMENT_TO_FINDING: Record<string, FindingTemplate> = {
  observation: {
    type: 'opportunity',
    severity: 'low',
    impact: 'low',
    priority: 'low',
    class: 'expert',
    descriptionPrefix: 'Observación de experto',
  },
  problem: {
    type: 'problem',
    severity: 'high',
    impact: 'high',
    priority: 'high',
    class: 'expert',
    descriptionPrefix: 'Problema identificado por experto',
  },
  recommendation: {
    type: 'opportunity',
    severity: 'medium',
    impact: 'medium',
    priority: 'medium',
    class: 'expert',
    descriptionPrefix: 'Recomendación de experto',
  },
  positive: {
    type: 'positive',
    severity: 'low',
    impact: 'low',
    priority: 'low',
    class: 'positive',
    descriptionPrefix: 'Aspecto positivo destacado por experto',
  },
  question: {
    type: 'difficulty',
    severity: 'medium',
    impact: 'medium',
    priority: 'medium',
    class: 'expert',
    descriptionPrefix: 'Pregunta abierta del experto',
  },
}

// ============================================================
// DICCIONARIO: TIPOS DE EVENTOS DE NAVEGACIÓN
// ============================================================
export const EVENT_TYPE_LABELS: Record<string, string> = {
  INITIAL_LOAD: 'Carga inicial',
  PRESENTED_NODE_CHANGED: 'Cambio de pantalla',
  NEW_STATE: 'Nuevo estado',
  MOUSE_PRESS_OR_RELEASE: 'Click del mouse',
  CLICK: 'Click',
  SCROLL: 'Desplazamiento',
  NAVIGATION: 'Navegación',
  KEYDOWN: 'Tecla presionada',
  KEYUP: 'Tecla liberada',
  MOUSE_MOVE: 'Movimiento del mouse',
  MOUSE_ENTER: 'Mouse entró',
  MOUSE_LEAVE: 'Mouse salió',
  FOCUS: 'Enfocado',
  BLUR: 'Perdió foco',
  CHANGE: 'Cambio de valor',
  SUBMIT: 'Envío',
  RESET: 'Reinicio',
  SELECT: 'Selección',
  INPUT: 'Entrada de texto',
  DRAG: 'Arrastre',
  DROP: 'Soltar',
  LOAD: 'Carga',
  ERROR: 'Error',
  RESIZE: 'Redimensionado',
  TOUCH_START: 'Inicio de toque',
  TOUCH_END: 'Fin de toque',
  TOUCH_MOVE: 'Movimiento táctil',
  GESTURE: 'Gesto',
}

// ============================================================
// DICCIONARIO: EMOCIONES (etiquetas en español)
// ============================================================
export const EMOTION_LABELS_ES: Record<string, string> = {
  happy: 'Felicidad',
  sad: 'Tristeza',
  angry: 'Enojo',
  surprise: 'Sorpresa',
  disgust: 'Asco',
  fear: 'Miedo',
  neutral: 'Neutral',
  confusion: 'Confusión',
  frustration: 'Frustración',
}

export const EMOTION_EMOJIS: Record<string, string> = {
  happy: '🙂',
  sad: '🙁',
  angry: '😠',
  surprise: '😮',
  disgust: '😖',
  fear: '😨',
  neutral: '😐',
}

// ============================================================
// DICCIONARIO: COLORES DE SEVERIDAD / TIPO
// ============================================================
export const SEVERITY_COLORS: Record<FindingSeverity, string> = {
  critical: 'negative',
  high: 'orange',
  medium: 'warning',
  low: 'info',
}

export const TYPE_COLORS: Record<FindingType, string> = {
  problem: 'negative',
  difficulty: 'warning',
  accessibility: 'orange',
  friction: 'deep-orange',
  positive: 'positive',
  opportunity: 'info',
}

export const IMPACT_COLORS: Record<FindingImpact, string> = {
  high: 'negative',
  medium: 'warning',
  low: 'info',
}

export const PRIORITY_COLORS: Record<FindingPriority, string> = {
  high: 'negative',
  medium: 'warning',
  low: 'info',
}

// ============================================================
// HELPERS DE CLASIFICACIÓN
// ============================================================

/**
 * Clasifica una emoción en una plantilla de hallazgo.
 */
export function classifyEmotion(emotion: string): FindingTemplate | null {
  if (!emotion) return null
  return EMOTION_TO_FINDING[emotion.toLowerCase()] || null
}

/**
 * Clasifica un sentimiento UX en una plantilla de hallazgo.
 */
export function classifySentiment(sentiment: string): FindingTemplate | null {
  if (!sentiment) return null
  return SENTIMENT_TO_FINDING[sentiment] || null
}

/**
 * Clasifica una observación heurística por severidad.
 */
export function classifyObservation(severity: number): FindingTemplate {
  const clamped = Math.max(1, Math.min(5, Math.round(severity)))
  return OBSERVATION_SEVERITY_TO_FINDING[clamped]
}

/**
 * Clasifica un comentario experto por tipo.
 */
export function classifyExpertComment(
  commentType: string,
): FindingTemplate | null {
  if (!commentType) return null
  return EXPERT_COMMENT_TO_FINDING[commentType] || null
}

/**
 * Obtiene el peso de una frecuencia de observación.
 */
export function getFrequencyWeight(frequency: string): number {
  return OBSERVATION_FREQUENCY_WEIGHT[frequency] ?? 1
}

/**
 * Genera un label legible desde un tipo de evento de Figma.
 */
export function getEventTypeLabel(eventType: string): string {
  if (!eventType) return '—'
  return (
    EVENT_TYPE_LABELS[eventType] ||
    eventType.replace(/_/g, ' ').toLowerCase()
  )
}

/**
 * Genera un label legible desde una emoción.
 */
export function getEmotionLabel(emotion: string): string {
  if (!emotion) return '—'
  const label = EMOTION_LABELS_ES[emotion.toLowerCase()] || emotion
  const emoji = EMOTION_EMOJIS[emotion.toLowerCase()] || ''
  return `${emoji} ${label}`.trim()
}

// ============================================================
// UMBRALES DE AGRUPACIÓN
// ============================================================
export const AGGREGATION_THRESHOLDS = {
  // Ventana de tiempo (ms) para agrupar disparadores del mismo tipo
  timeWindowMs: 5000,

  // Máximo de disparadores antes de agrupar en un solo hallazgo
  maxTriggersPerGroup: 3,

  // Confianza mínima del sentimiento para considerarlo
  minSentimentConfidence: 0.4,

  // Confianza mínima de emoción para considerarla
  minEmotionConfidence: 0.3,
}

// ============================================================
// CONFIGURACIÓN GENERAL
// ============================================================
export const GENERATOR_CONFIG = {
  // Si se debe incluir el contexto de eventos cercanos
  includeNearbyEvents: true,

  // Ventana de tiempo (ms) para considerar eventos cercanos
  nearbyEventWindowMs: 3000,

  // Si se debe agrupar disparadores similares
  groupSimilarTriggers: true,

  // Si se debe incluir recomendación automática
  autoRecommendation: true,

  // Máximo de hallazgos a generar por sesión (0 = sin límite)
  maxFindingsPerSession: 0,

  // Versión por defecto
  defaultVersion: '1.0',
}