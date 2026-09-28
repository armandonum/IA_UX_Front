// types/expert/findings.dictionary.ts
/**
 * Diccionario maestro para generación de hallazgos
 * Contiene patrones, plantillas y reglas de inferencia
 */

// ============================================================
// TIPOS BASE
// ============================================================

export type EmotionKey =
  | 'happy' | 'sad' | 'angry' | 'surprise'
  | 'disgust' | 'fear' | 'neutral'
  | 'frustration' | 'confusion' | 'boredom' | 'engagement'

export type SentimentKey =
  | 'Confusión' | 'Frustración' | 'Satisfacción' | 'Desconfianza'
  | 'Dificultad / esfuerzo' | 'Rechazo' | 'Interés / motivación'
  | 'Aburrimiento' | 'Sorpresa' | 'Alivio' | 'Neutral'

export type FindingTypeKey =
  | 'usability' | 'emotional' | 'sentiment' | 'accessibility' | 'mixed' | 'expert'

export type SeverityKey = 'critical' | 'high' | 'medium' | 'low' | 'info'

// ============================================================
// 1. DICCIONARIO DE EMOCIONES → HALLAZGOS
// ============================================================

export interface EmotionFindingTemplate {
  emotion: EmotionKey
  type: FindingTypeKey
  severity: SeverityKey
  labelEs: string
  emoji: string
  color: string
  descriptionTemplates: string[]
  recommendationTemplates: string[]
  tags: string[]
  minConfidence: number
  isNegative: boolean
}

export const EMOTION_FINDING_TEMPLATES: Record<string, EmotionFindingTemplate> = {
  frustration: {
    emotion: 'frustration',
    type: 'emotional',
    severity: 'high',
    labelEs: 'Frustración',
    emoji: '😤',
    color: '#ef4444',
    descriptionTemplates: [
      'El usuario mostró frustración{context}. Esto indica un punto de fricción importante en el flujo.',
      'Se detectó frustración en el usuario{context}. El sistema no está cumpliendo las expectativas.',
      'La frustración del usuario{context} sugiere que el flujo no es lo suficientemente intuitivo.',
    ],
    recommendationTemplates: [
      'Revisar el flujo de {node} para eliminar puntos de fricción. Simplificar la tarea o mejorar el feedback visual.',
      'Analizar los pasos que causan frustración en {node}. Considerar reducir la carga cognitiva.',
      'Implementar mensajes de ayuda contextual y validaciones en tiempo real en {node}.',
    ],
    tags: ['frustración', 'fricción', 'ux-negativa'],
    minConfidence: 0.4,
    isNegative: true,
  },
  confusion: {
    emotion: 'confusion',
    type: 'usability',
    severity: 'high',
    labelEs: 'Confusión',
    emoji: '😕',
    color: '#f59e0b',
    descriptionTemplates: [
      'Se detectó confusión en el usuario{context}. La interfaz no está comunicando claramente su propósito.',
      'El usuario experimentó confusión{context}, lo que sugiere problemas de claridad en la información.',
      'La confusión detectada{context} indica que el usuario no entiende qué hacer a continuación.',
    ],
    recommendationTemplates: [
      'Mejorar la claridad de etiquetas y flujo de navegación en {node}. Añadir tooltips o ayudas contextuales.',
      'Revisar la arquitectura de información en {node}. Considerar simplificar el lenguaje utilizado.',
      'Añadir indicadores de progreso y guías paso a paso en {node}.',
    ],
    tags: ['confusión', 'usabilidad', 'navegación'],
    minConfidence: 0.4,
    isNegative: true,
  },
  angry: {
    emotion: 'angry',
    type: 'emotional',
    severity: 'critical',
    labelEs: 'Enojo',
    emoji: '😠',
    color: '#dc2626',
    descriptionTemplates: [
      'El usuario experimentó enojo{context}. El nivel de frustración es crítico y puede causar abandono.',
      'Se detectó enojo significativo{context}. Esta es una señal de alerta máxima.',
      'El usuario mostró enojo{context}, indicando un problema serio de experiencia.',
    ],
    recommendationTemplates: [
      'URGENTE: Revisar inmediatamente la experiencia en {node}. El nivel de frustración puede causar abandono.',
      'Priorizar la corrección del flujo en {node}. Considerar rediseño completo si es necesario.',
      'Implementar validación inmediata y feedback claro en {node} para reducir el enojo.',
    ],
    tags: ['enojo', 'crítico', 'abandono'],
    minConfidence: 0.3,
    isNegative: true,
  },
  sad: {
    emotion: 'sad',
    type: 'emotional',
    severity: 'medium',
    labelEs: 'Tristeza',
    emoji: '😔',
    color: '#6366f1',
    descriptionTemplates: [
      'El usuario mostró tristeza o desánimo{context}.',
      'Se detectó desánimo en el usuario{context}, lo que puede afectar la motivación.',
    ],
    recommendationTemplates: [
      'Revisar si el contenido o flujo genera desmotivación en {node}. Añadir refuerzo positivo.',
      'Considerar añadir mensajes de ánimo o logros en {node} para mejorar el estado emocional.',
    ],
    tags: ['tristeza', 'desmotivación'],
    minConfidence: 0.5,
    isNegative: true,
  },
  fear: {
    emotion: 'fear',
    type: 'emotional',
    severity: 'high',
    labelEs: 'Miedo',
    emoji: '😨',
    color: '#7c3aed',
    descriptionTemplates: [
      'Se detectó miedo o inseguridad en el usuario{context}.',
      'El usuario mostró aprensión{context}, posiblemente por acciones destructivas o falta de claridad.',
    ],
    recommendationTemplates: [
      'Añadir mensajes de seguridad y confirmación en {node}. Revisar acciones destructivas sin protección.',
      'Revisar si {node} comunica claramente las consecuencias de las acciones. Añadir confirmaciones.',
    ],
    tags: ['miedo', 'inseguridad', 'confianza'],
    minConfidence: 0.4,
    isNegative: true,
  },
  surprise: {
    emotion: 'surprise',
    type: 'usability',
    severity: 'medium',
    labelEs: 'Sorpresa',
    emoji: '😮',
    color: '#f97316',
    descriptionTemplates: [
      'El usuario mostró sorpresa{context}.',
      'Se detectó sorpresa en el usuario{context}, indicando comportamiento inesperado.',
    ],
    recommendationTemplates: [
      'Verificar si la sorpresa es positiva (descubrimiento) o negativa (comportamiento inesperado) en {node}.',
      'Revisar las expectativas del usuario y si {node} las está cumpliendo.',
    ],
    tags: ['sorpresa', 'expectativas'],
    minConfidence: 0.5,
    isNegative: false,
  },
  disgust: {
    emotion: 'disgust',
    type: 'emotional',
    severity: 'high',
    labelEs: 'Rechazo',
    emoji: '😖',
    color: '#84cc16',
    descriptionTemplates: [
      'El usuario mostró rechazo{context}.',
      'Se detectó aversión en el usuario{context}, indicando contenido o diseño problemático.',
    ],
    recommendationTemplates: [
      'Revisar el contenido visual o textual en {node} que puede estar generando rechazo.',
      'Considerar rediseño de {node} para eliminar elementos que causan aversión.',
    ],
    tags: ['rechazo', 'contenido'],
    minConfidence: 0.4,
    isNegative: true,
  },
  neutral: {
    emotion: 'neutral',
    type: 'emotional',
    severity: 'info',
    labelEs: 'Neutral',
    emoji: '😐',
    color: '#94a3b8',
    descriptionTemplates: [
      'El usuario mantuvo una expresión neutral{context}.',
      'No se detectaron emociones significativas{context}.',
    ],
    recommendationTemplates: [
      'La neutralidad puede indicar falta de engagement. Revisar si {node} genera suficiente interés.',
      'Considerar añadir elementos que generen engagement en {node}.',
    ],
    tags: ['neutral', 'engagement'],
    minConfidence: 0.6,
    isNegative: false,
  },
  happy: {
    emotion: 'happy',
    type: 'emotional',
    severity: 'info',
    labelEs: 'Felicidad',
    emoji: '😊',
    color: '#22c55e',
    descriptionTemplates: [
      'El usuario mostró satisfacción{context}.',
      'Se detectó felicidad en el usuario{context}, indicando una experiencia positiva.',
    ],
    recommendationTemplates: [
      'Mantener los elementos de {node} que generan satisfacción. Documentar como buena práctica.',
      'Documentar los elementos positivos de {node} para replicarlos en otras pantallas.',
    ],
    tags: ['satisfacción', 'positivo'],
    minConfidence: 0.5,
    isNegative: false,
  },
  boredom: {
    emotion: 'boredom',
    type: 'emotional',
    severity: 'medium',
    labelEs: 'Aburrimiento',
    emoji: '😑',
    color: '#78716c',
    descriptionTemplates: [
      'Se detectó aburrimiento o falta de interés{context}.',
      'El usuario mostró señales de desinterés{context}.',
    ],
    recommendationTemplates: [
      'Añadir elementos de engagement en {node}. Revisar duración de la tarea y contenido.',
      'Considerar gamificación o feedback más frecuente en {node}.',
    ],
    tags: ['aburrimiento', 'engagement'],
    minConfidence: 0.5,
    isNegative: true,
  },
  engagement: {
    emotion: 'engagement',
    type: 'emotional',
    severity: 'info',
    labelEs: 'Engagement',
    emoji: '🤩',
    color: '#06b6d4',
    descriptionTemplates: [
      'El usuario mostró alto engagement{context}.',
      'Se detectó gran interés y atención{context}.',
    ],
    recommendationTemplates: [
      'Documentar los elementos de {node} que generan engagement para replicarlos.',
      'Analizar qué hace que {node} sea atractivo y aplicar en otras pantallas.',
    ],
    tags: ['engagement', 'positivo'],
    minConfidence: 0.6,
    isNegative: false,
  },
}

// ============================================================
// 2. DICCIONARIO DE SENTIMIENTOS → HALLAZGOS
// ============================================================

export interface SentimentFindingTemplate {
  sentiment: SentimentKey
  type: FindingTypeKey
  severity: SeverityKey
  color: string
  descriptionTemplates: string[]
  recommendationTemplates: string[]
  tags: string[]
  keywords: string[]
  isNegative: boolean
}

export const SENTIMENT_FINDING_TEMPLATES: Record<string, SentimentFindingTemplate> = {
  'Frustración': {
    sentiment: 'Frustración',
    type: 'sentiment',
    severity: 'high',
    color: '#ef4444',
    descriptionTemplates: [
      'El usuario expresó frustración en su comentario: "{text}"{context}',
      'Comentario con frustración detectado: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Analizar el punto de fricción mencionado. Considerar rediseño de la interacción en {node}.',
      'Revisar el flujo completo en {node} para eliminar la causa de la frustración.',
    ],
    tags: ['frustración', 'comentario-negativo'],
    keywords: ['no puedo', 'no funciona', 'error', 'falla', 'imposible', 'harto', 'molesto'],
    isNegative: true,
  },
  'Confusión': {
    sentiment: 'Confusión',
    type: 'sentiment',
    severity: 'high',
    color: '#f59e0b',
    descriptionTemplates: [
      'El usuario expresó confusión: "{text}"{context}',
      'Comentario con confusión detectado: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Revisar la claridad de la información presentada en {node}. Añadir guías o simplificar el lenguaje.',
      'Mejorar el etiquetado y las instrucciones en {node}.',
    ],
    tags: ['confusión', 'claridad'],
    keywords: ['no entiendo', 'confuso', 'no sé', 'qué es', 'cómo', 'dónde', 'no aparece'],
    isNegative: true,
  },
  'Satisfacción': {
    sentiment: 'Satisfacción',
    type: 'sentiment',
    severity: 'info',
    color: '#22c55e',
    descriptionTemplates: [
      'El usuario expresó satisfacción: "{text}"{context}',
      'Comentario positivo detectado: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Documentar como buena práctica. Mantener el elemento que generó esta respuesta en {node}.',
      'Registrar los factores de éxito en {node} para replicarlos.',
    ],
    tags: ['satisfacción', 'positivo'],
    keywords: ['me gusta', 'excelente', 'genial', 'perfecto', 'bueno', 'fácil', 'intuitivo'],
    isNegative: false,
  },
  'Desconfianza': {
    sentiment: 'Desconfianza',
    type: 'sentiment',
    severity: 'medium',
    color: '#64748b',
    descriptionTemplates: [
      'El usuario mostró desconfianza: "{text}"{context}',
      'Comentario con desconfianza detectado: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Revisar elementos de confianza en {node}: seguridad, privacidad, transparencia.',
      'Añadir señales de seguridad y claridad sobre el uso de datos en {node}.',
    ],
    tags: ['desconfianza', 'confianza'],
    keywords: ['seguro', 'privacidad', 'datos', 'confiar', 'sospechoso'],
    isNegative: true,
  },
  'Dificultad / esfuerzo': {
    sentiment: 'Dificultad / esfuerzo',
    type: 'sentiment',
    severity: 'high',
    color: '#f97316',
    descriptionTemplates: [
      'El usuario encontró dificultad: "{text}"{context}',
      'Comentario con dificultad detectado: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Simplificar el flujo o añadir asistencia en {node}. Revisar carga cognitiva.',
      'Reducir el número de pasos o campos requeridos en {node}.',
    ],
    tags: ['dificultad', 'esfuerzo', 'carga-cognitiva'],
    keywords: ['difícil', 'complicado', 'cuesta', 'trabajo', 'esfuerzo', 'lento'],
    isNegative: true,
  },
  'Rechazo': {
    sentiment: 'Rechazo',
    type: 'sentiment',
    severity: 'high',
    color: '#dc2626',
    descriptionTemplates: [
      'El usuario rechazó el elemento: "{text}"{context}',
      'Comentario con rechazo detectado: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Revisar por qué el usuario rechaza {node}. Considerar rediseño o eliminación.',
      'Analizar si {node} aporta valor al usuario o si es percibido como innecesario.',
    ],
    tags: ['rechazo', 'negativo'],
    keywords: ['no me gusta', 'odio', 'malo', 'pésimo', 'feo', 'no sirve'],
    isNegative: true,
  },
  'Interés / motivación': {
    sentiment: 'Interés / motivación',
    type: 'sentiment',
    severity: 'info',
    color: '#3b82f6',
    descriptionTemplates: [
      'El usuario mostró interés: "{text}"{context}',
      'Comentario con interés detectado: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Documentar elementos que generan interés en {node}. Considerar expandir esta funcionalidad.',
      'Registrar qué motiva al usuario en {node} para potenciarlo.',
    ],
    tags: ['interés', 'motivación', 'positivo'],
    keywords: ['interesante', 'quiero', 'necesito', 'útil', 'ayuda', 'me sirve'],
    isNegative: false,
  },
  'Aburrimiento': {
    sentiment: 'Aburrimiento',
    type: 'sentiment',
    severity: 'medium',
    color: '#78716c',
    descriptionTemplates: [
      'El usuario expresó aburrimiento: "{text}"{context}',
      'Comentario con aburrimiento detectado: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Añadir elementos de engagement en {node}. Revisar duración y contenido.',
      'Reducir tiempos de espera o añadir feedback visual en {node}.',
    ],
    tags: ['aburrimiento', 'engagement'],
    keywords: ['aburrido', 'largo', 'monótono', 'repetitivo', 'siempre lo mismo'],
    isNegative: true,
  },
  'Sorpresa': {
    sentiment: 'Sorpresa',
    type: 'sentiment',
    severity: 'medium',
    color: '#f97316',
    descriptionTemplates: [
      'El usuario expresó sorpresa: "{text}"{context}',
      'Comentario con sorpresa detectado: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Verificar si la sorpresa es positiva o negativa. Revisar expectativas del usuario en {node}.',
      'Analizar si el comportamiento de {node} coincide con lo que el usuario espera.',
    ],
    tags: ['sorpresa'],
    keywords: ['wow', 'increíble', 'no esperaba', 'sorpresa', 'inesperado'],
    isNegative: false,
  },
  'Alivio': {
    sentiment: 'Alivio',
    type: 'sentiment',
    severity: 'info',
    color: '#14b8a6',
    descriptionTemplates: [
      'El usuario expresó alivio: "{text}"{context}',
      'Comentario con alivio detectado: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Documentar el momento de alivio en {node}. Revisar qué lo causó (¿resolución de problema?).',
      'Identificar el punto de resolución en {node} para optimizar el flujo previo.',
    ],
    tags: ['alivio', 'positivo'],
    keywords: ['finalmente', 'por fin', 'al fin', 'listo', 'ya está'],
    isNegative: false,
  },
  'Neutral': {
    sentiment: 'Neutral',
    type: 'sentiment',
    severity: 'info',
    color: '#94a3b8',
    descriptionTemplates: [
      'Comentario neutral del usuario: "{text}"{context}',
    ],
    recommendationTemplates: [
      'Analizar si el comentario neutral oculta insatisfacción. Revisar contexto de {node}.',
    ],
    tags: ['neutral'],
    keywords: [],
    isNegative: false,
  },
}

// ============================================================
// 3. PLANTILLAS DE CONTEXTO
// ============================================================

export const CONTEXT_TEMPLATES = {
  withEvent: ' justo después de {eventType}',
  withNode: ' en la pantalla "{nodeName}"',
  withComment: ' y lo expresó diciendo: "{commentText}"',
  withSentiment: ' (sentimiento detectado: {sentimentLabel})',
  withFrequency: ' Esto ocurrió {frequency} veces durante la sesión',
  withEmotion: ' (emoción detectada: {emotionLabel})',
}

// ============================================================
// 4. REGLAS DE COMBINACIÓN (emoción + sentimiento + comentario)
// ============================================================

export interface CombinationRule {
  id: string
  emotions: string[]
  sentiments: string[]
  hasComment: boolean
  type: FindingTypeKey
  severity: SeverityKey
  descriptionTemplate: string
  recommendationTemplate: string
  priority: number
}

export const COMBINATION_RULES: CombinationRule[] = [
  {
    id: 'frustration_confusion_critical',
    emotions: ['frustration', 'angry'],
    sentiments: ['Frustración', 'Confusión', 'Dificultad / esfuerzo'],
    hasComment: true,
    type: 'mixed',
    severity: 'critical',
    descriptionTemplate:
      'El usuario mostró alta frustración y expresó dificultad con el comentario: "{comment}". Este patrón indica un problema crítico de usabilidad en "{nodeName}".',
    recommendationTemplate:
      'PRIORIDAD CRÍTICA: Rediseñar completamente el flujo en "{nodeName}". El usuario no solo tuvo dificultad, sino que lo expresó explícitamente.',
    priority: 10,
  },
  {
    id: 'confusion_usability',
    emotions: ['confusion', 'surprise'],
    sentiments: ['Confusión'],
    hasComment: true,
    type: 'usability',
    severity: 'high',
    descriptionTemplate:
      'El usuario experimentó confusión y lo manifestó: "{comment}". La interfaz no está comunicando claramente su propósito en "{nodeName}".',
    recommendationTemplate:
      'Revisar arquitectura de información y etiquetado en "{nodeName}". Considerar pruebas de usabilidad adicionales.',
    priority: 8,
  },
  {
    id: 'positive_engagement',
    emotions: ['happy', 'engagement'],
    sentiments: ['Satisfacción', 'Interés / motivación'],
    hasComment: true,
    type: 'emotional',
    severity: 'info',
    descriptionTemplate:
      'El usuario mostró satisfacción y engagement: "{comment}". Este es un patrón positivo a documentar en "{nodeName}".',
    recommendationTemplate:
      'Documentar como caso de éxito. Replicar elementos de "{nodeName}" en otras pantallas.',
    priority: 3,
  },
  {
    id: 'fear_desconfianza',
    emotions: ['fear', 'surprise'],
    sentiments: ['Desconfianza'],
    hasComment: true,
    type: 'emotional',
    severity: 'high',
    descriptionTemplate:
      'El usuario mostró miedo o desconfianza: "{comment}". Revisar elementos que generan inseguridad en "{nodeName}".',
    recommendationTemplate:
      'Añadir señales de seguridad, transparencia y confirmación en "{nodeName}".',
    priority: 9,
  },
  {
    id: 'boredom_neutral',
    emotions: ['boredom', 'neutral'],
    sentiments: ['Aburrimiento', 'Neutral'],
    hasComment: false,
    type: 'emotional',
    severity: 'medium',
    descriptionTemplate:
      'El usuario mostró falta de engagement (aburrimiento/neutralidad) durante la interacción con "{nodeName}".',
    recommendationTemplate:
      'Revisar duración y contenido de la tarea en "{nodeName}". Considerar añadir elementos de gamificación o feedback.',
    priority: 5,
  },
  {
    id: 'difficulty_alone',
    emotions: ['confusion', 'frustration'],
    sentiments: ['Dificultad / esfuerzo'],
    hasComment: false,
    type: 'usability',
    severity: 'high',
    descriptionTemplate:
      'El usuario mostró signos de dificultad al interactuar con "{nodeName}" sin expresarlo verbalmente.',
    recommendationTemplate:
      'Revisar carga cognitiva y claridad del flujo en "{nodeName}". Considerar simplificar la tarea.',
    priority: 7,
  },
]

// ============================================================
// 5. TRADUCCIONES PARA EXPORTACIÓN (JSON → humano)
// ============================================================

export const HUMAN_READABLE_LABELS: Record<string, Record<string, string>> = {
  emotion: {
    happy: 'Felicidad',
    sad: 'Tristeza',
    angry: 'Enojo',
    surprise: 'Sorpresa',
    disgust: 'Rechazo',
    fear: 'Miedo',
    neutral: 'Neutral',
    frustration: 'Frustración',
    confusion: 'Confusión',
    boredom: 'Aburrimiento',
    engagement: 'Engagement',
  },
  severity: {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
    info: 'Informativo',
  },
  status: {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    not_resolved: 'No Resuelto',
    kept: 'Conservado',
    reviewed: 'Revisado',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  },
  type: {
    usability: 'Usabilidad',
    emotional: 'Emocional',
    sentiment: 'Sentimiento',
    expert: 'Experto',
    mixed: 'Mixto',
    problem: 'Problema',
    difficulty: 'Dificultad',
    accessibility: 'Accesibilidad',
    friction: 'Fricción',
    positive: 'Positivo',
    opportunity: 'Oportunidad',
  },
  impact: {
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
  },
  priority: {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  },
eventType: {
  INITIAL_LOAD: 'Carga inicial',
  PRESENTED_NODE_CHANGED: 'Cambio de pantalla',
  NEW_STATE: 'Nuevo estado',
  MOUSE_PRESS_OR_RELEASE: 'Click del mouse',
  MOUSE_MOVE: 'Movimiento del mouse',
  CLICK: 'Click',
  SCROLL: 'Desplazamiento',
  NAVIGATION: 'Navegación',
  WINDOW_RESIZE: 'Redimensionar ventana',
  KEY_PRESS: 'Tecla presionada',
  KEY_RELEASE: 'Tecla liberada',
  INPUT_CHANGE: 'Cambio en campo',
  FOCUS: 'Foco en elemento',
  BLUR: 'Pérdida de foco',
  HOVER: 'Hover sobre elemento',
  DRAG_START: 'Inicio de arrastre',
  DRAG_END: 'Fin de arrastre',
  DROP: 'Soltar elemento',
  ZOOM: 'Zoom',
  OVERLAY_CLICK: 'Click en overlay',
  PROTOTYPE_NAVIGATION: 'Navegación en prototipo',
  HOTSPOT_CLICK: 'Click en hotspot',
  CHANGE_PAGE: 'Cambio de página',
  LOADED: 'Cargado',
  UNLOAD: 'Descargado',
  FORM_SUBMIT: 'Envío de formulario',
  BEFORE_UNLOAD: 'Antes de salir',
}
}

// ============================================================
// 6. HELPERS
// ============================================================

export function getEmotionTemplate(emotion: string): EmotionFindingTemplate {
  const key = (emotion || 'neutral').toLowerCase()
  return EMOTION_FINDING_TEMPLATES[key] || EMOTION_FINDING_TEMPLATES.neutral
}

export function getSentimentTemplate(sentiment: string): SentimentFindingTemplate {
  return (
    SENTIMENT_FINDING_TEMPLATES[sentiment] ||
    SENTIMENT_FINDING_TEMPLATES['Neutral']
  )
}

export function getHumanLabel(category: string, key: string): string {
  return HUMAN_READABLE_LABELS[category]?.[key] || key
}

export function findMatchingCombinationRule(
  emotions: string[],
  sentiments: string[],
  hasComment: boolean,
): CombinationRule | null {
  const sortedRules = [...COMBINATION_RULES].sort((a, b) => b.priority - a.priority)
  const lowerEmotions = emotions.map((e) => e.toLowerCase())

  for (const rule of sortedRules) {
    const emotionMatch =
      rule.emotions.length === 0 ||
      rule.emotions.some((e) => lowerEmotions.includes(e.toLowerCase()))
    const sentimentMatch =
      rule.sentiments.length === 0 ||
      rule.sentiments.some((s) => sentiments.includes(s))
    const commentMatch = !rule.hasComment || hasComment

    if (emotionMatch && sentimentMatch && commentMatch) {
      return rule
    }
  }

  return null
}

/**
 * Detecta si un sentimiento es negativo
 */
export function isNegativeSentiment(sentiment: string): boolean {
  const template = SENTIMENT_FINDING_TEMPLATES[sentiment]
  return template?.isNegative ?? false
}

/**
 * Detecta si una emoción es negativa
 */
export function isNegativeEmotion(emotion: string): boolean {
  const template = getEmotionTemplate(emotion)
  return template.isNegative
}

/**
 * Obtiene colores para gráficos
 */
export function getEmotionColor(emotion: string): string {
  return getEmotionTemplate(emotion).color
}

export function getSentimentColor(sentiment: string): string {
  return getSentimentTemplate(sentiment).color
}


/**
 * Normaliza un score a porcentaje 0-100
 * Acepta: 0.659 (fracción), 65.9 (porcentaje), 6590 (porcentaje x100 con error)
 */
export function normalizeScore(score: number | null | undefined): number {
  if (score === null || score === undefined || isNaN(score)) return 0

  // Si es mayor a 100, dividir entre 100 (por error de escala)
  if (score > 100) return Math.round(score / 100)

  // Si es mayor a 1, ya está en escala 0-100
  if (score > 1) return Math.round(score)

  // Si es <= 1, multiplicar por 100
  return Math.round(score * 100)
}