// composables/coordinador/heuristic/useHeuristicFindingsGenerator.ts
import {
  classifyEmotion,
  classifySentiment,
  classifyObservation,
  classifyExpertComment,
  POSITIVE_TO_FINDING,
  AGGREGATION_THRESHOLDS,
  GENERATOR_CONFIG,
  getEmotionLabel,
  getEventTypeLabel,
} from '@/data/heuristicFindingsDictionary'
import type {
  FindingTemplate,
  TriggerSource,
} from '@/data/heuristicFindingsDictionary'

// ============================================================
// TIPOS
// ============================================================
export interface GeneratedFinding {
  _tempId: string
  // Identificadores
  evaluationId: string
  sessionId: string | null
  taskId: string | null
  requirementId?: string | null
  flowId?: string | null
  nodeId: string | null
  version: string
  // Clasificación
  type: 'problem' | 'difficulty' | 'accessibility' | 'friction' | 'positive' | 'opportunity'
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  priority: 'high' | 'medium' | 'low'
  class: string
  frequency: number
  // Contenido
  recommendation: string | null
  status: 'pending'
  // Contexto afectivo
  emotionInferred: string | null
  textualSentiment: string | null
  userComment: string | null
  expertComment: string | null
  userCommentId: string | null
  expertCommentId: string | null
  // Agrupación
  aggregatedFrom: string[]
  occurrences: number
  // Contexto temporal (interno, no se envía al backend)
  _ms: number
  _source: TriggerSource
  _context: {
    nodeName?: string
    eventType?: string
    taskTitle?: string
  }
}

export interface TimelineData {
  events: any[]
  emotionReadings: any[]
  sentiments: any[]
  comments: any[]
  expertComments: any[]
  observations: any[]
  positiveAspects: any[]
  durationMs: number
  evaluationId: string
  sessionId: string
  taskId: string | null
  getNodeIdFromEvent: (ev: any) => string
  getEmotionLabel: (em: any) => string
  getNearestEvent: (ms: number) => any
  getNearestEmotion: (ms: number) => any
  getNearestComment: (ms: number) => any
  getNearestSentiment: (ms: number) => any
}

export interface GeneratorOptions {
  minConfidence: number
  includeEmotions: boolean
  includeSentiments: boolean
  includeUserComments: boolean
  includeExpertComments: boolean
  includeObservations: boolean
  includePositives: boolean
  includeEvents: boolean
}

// ============================================================
// COMPOSABLE
// ============================================================
export function useHeuristicFindingsGenerator() {
  let tempIdCounter = 0

  function generateTempId(): string {
    tempIdCounter++
    return `finding_${Date.now()}_${tempIdCounter}`
  }

  /**
   * Genera hallazgos automáticamente a partir del timeline.
   */
  async function generateFindings(
    timeline: TimelineData,
    options: Partial<GeneratorOptions> = {},
  ): Promise<GeneratedFinding[]> {
    const opts: GeneratorOptions = {
      minConfidence: AGGREGATION_THRESHOLDS.minSentimentConfidence,
      includeEmotions: true,
      includeSentiments: true,
      includeUserComments: true,
      includeExpertComments: true,
      includeObservations: true,
      includePositives: true,
      includeEvents: false,
      ...options,
    }

    const findings: GeneratedFinding[] = []

    // 1. Procesar emociones
    if (opts.includeEmotions) {
      const emotionFindings = processEmotions(timeline)
      findings.push(...emotionFindings)
    }

    // 2. Procesar sentimientos
    if (opts.includeSentiments) {
      const sentimentFindings = processSentiments(timeline, opts.minConfidence)
      findings.push(...sentimentFindings)
    }

    // 3. Procesar observaciones heurísticas
    if (opts.includeObservations) {
      const observationFindings = processObservations(timeline)
      findings.push(...observationFindings)
    }

    // 4. Procesar aspectos positivos
    if (opts.includePositives) {
      const positiveFindings = processPositiveAspects(timeline)
      findings.push(...positiveFindings)
    }

    // 5. Procesar comentarios expertos
    if (opts.includeExpertComments) {
      const expertFindings = processExpertComments(timeline)
      findings.push(...expertFindings)
    }

    // 6. Agrupar hallazgos similares
    const grouped = GENERATOR_CONFIG.groupSimilarTriggers
      ? groupSimilarFindings(findings)
      : findings

    // 7. Ordenar por severidad y momento
    const sorted = sortFindings(grouped)

    // 8. Aplicar límite máximo si está configurado
    const limited =
      GENERATOR_CONFIG.maxFindingsPerSession > 0
        ? sorted.slice(0, GENERATOR_CONFIG.maxFindingsPerSession)
        : sorted

    return limited
  }

  // ============================================================
  // PROCESAR EMOCIONES
  // ============================================================
  function processEmotions(timeline: TimelineData): GeneratedFinding[] {
    const findings: GeneratedFinding[] = []

    // 🔥 Solo usar los cambios de emoción (ya filtrados en el composable)
    for (const em of timeline.emotionReadings) {
      const emotion = em.dominantEmotion || em.emotion
      if (!emotion || emotion === 'neutral') continue

      const template = classifyEmotion(emotion)
      if (!template) continue

      const ms = em.elapsedMsTotal ?? em.elapsedMs ?? 0
      const nearestEvent = timeline.getNearestEvent(ms)
      const nodeId = nearestEvent
        ? timeline.getNodeIdFromEvent(nearestEvent)
        : null

      findings.push(
        buildFinding({
          template,
          source: 'emotion',
          ms,
          evaluationId: timeline.evaluationId,
          sessionId: timeline.sessionId,
          taskId: timeline.taskId,
          nodeId,
          description: `${template.descriptionPrefix}: "${getEmotionLabel(emotion)}"`,
          emotionInferred: emotion,
          context: {
            eventType: nearestEvent?.event_type,
          },
        }),
      )
    }

    return findings
  }

  // ============================================================
  // PROCESAR SENTIMIENTOS
  // ============================================================
  function processSentiments(
    timeline: TimelineData,
    minConfidence: number,
  ): GeneratedFinding[] {
    const findings: GeneratedFinding[] = []

    for (const s of timeline.sentiments) {
      if (!s.uxLabel || s.uxLabel === 'Neutral') continue
      if ((s.confidence ?? 0) < minConfidence) continue

      const template = classifySentiment(s.uxLabel)
      if (!template) continue

      const ms = s.elapsedMsTotal ?? 0
      const nearestEvent = timeline.getNearestEvent(ms)
      const nodeId = nearestEvent
        ? timeline.getNodeIdFromEvent(nearestEvent)
        : null

      findings.push(
        buildFinding({
          template,
          source: 'sentiment',
          ms,
          evaluationId: timeline.evaluationId,
          sessionId: timeline.sessionId,
          taskId: timeline.taskId,
          nodeId,
          description: `${template.descriptionPrefix}: "${s.text}"`,
          textualSentiment: s.uxLabel,
          context: {
            eventType: nearestEvent?.event_type,
          },
        }),
      )
    }

    return findings
  }

  // ============================================================
  // PROCESAR OBSERVACIONES HEURÍSTICAS
  // ============================================================
  function processObservations(timeline: TimelineData): GeneratedFinding[] {
    const findings: GeneratedFinding[] = []

    for (const obs of timeline.observations) {
      const template = classifyObservation(obs.severity)
      if (!template) continue

      // Estimar ms desde createdAt
      const ms = estimateMsFromCreatedAt(obs.createdAt, timeline)

      findings.push(
        buildFinding({
          template,
          source: 'observation',
          ms,
          evaluationId: timeline.evaluationId,
          sessionId: obs.sessionId || timeline.sessionId,
          taskId: obs.taskId || timeline.taskId,
          nodeId: obs.nodeId || null,
          description: `${template.descriptionPrefix}: ${obs.description}`,
          recommendation: obs.recommendation || template.recommendation || null,
          context: {},
        }),
      )
    }

    return findings
  }

  // ============================================================
  // PROCESAR ASPECTOS POSITIVOS
  // ============================================================
  function processPositiveAspects(timeline: TimelineData): GeneratedFinding[] {
    const findings: GeneratedFinding[] = []

    for (const pos of timeline.positiveAspects) {
      const ms = estimateMsFromCreatedAt(pos.createdAt, timeline)

      findings.push(
        buildFinding({
          template: POSITIVE_TO_FINDING,
          source: 'positive',
          ms,
          evaluationId: timeline.evaluationId,
          sessionId: pos.sessionId || timeline.sessionId,
          taskId: pos.taskId || timeline.taskId,
          nodeId: null,
          description: `${POSITIVE_TO_FINDING.descriptionPrefix}: ${pos.description}`,
          context: {},
        }),
      )
    }

    return findings
  }

  // ============================================================
  // PROCESAR COMENTARIOS DE EXPERTO
  // ============================================================
  function processExpertComments(timeline: TimelineData): GeneratedFinding[] {
    const findings: GeneratedFinding[] = []

    for (const ec of timeline.expertComments) {
      const template = classifyExpertComment(ec.commentType)
      if (!template) continue

      const ms = ec.elapsedMsTotal ?? 0

      findings.push(
        buildFinding({
          template: {
            ...template,
            severity: ec.severity
              ? mapSeverityNumber(ec.severity)
              : template.severity,
          },
          source: 'expertComment',
          ms,
          evaluationId: timeline.evaluationId,
          sessionId: ec.sessionId || timeline.sessionId,
          taskId: ec.taskId || timeline.taskId,
          nodeId: ec.nodeId || null,
          description: `${template.descriptionPrefix}: ${ec.comment}`,
          expertComment: ec.comment,
          expertCommentId: ec.commentId,
          context: {},
        }),
      )
    }

    return findings
  }

  // ============================================================
  // BUILD FINDING
  // ============================================================
  function buildFinding(params: {
    template: FindingTemplate
    source: TriggerSource
    ms: number
    evaluationId: string
    sessionId: string | null
    taskId: string | null
    nodeId: string | null
    description: string
    recommendation?: string | null
    emotionInferred?: string | null
    textualSentiment?: string | null
    userComment?: string | null
    userCommentId?: string | null
    expertComment?: string | null
    expertCommentId?: string | null
    context: {
      nodeName?: string
      eventType?: string
      taskTitle?: string
    }
  }): GeneratedFinding {
    const t = params.template

    return {
      _tempId: generateTempId(),
      evaluationId: params.evaluationId,
      sessionId: params.sessionId,
      taskId: params.taskId,
      requirementId: null,
      flowId: null,
      nodeId: params.nodeId,
      version: GENERATOR_CONFIG.defaultVersion,
      type: t.type,
      description: params.description,
      severity: t.severity,
      impact: t.impact,
      priority: t.priority,
      class: t.class,
      frequency: 1,
      recommendation:
        params.recommendation ??
        (GENERATOR_CONFIG.autoRecommendation ? t.recommendation ?? null : null),
      status: 'pending',
      emotionInferred: params.emotionInferred ?? null,
      textualSentiment: params.textualSentiment ?? null,
      userComment: params.userComment ?? null,
      expertComment: params.expertComment ?? null,
      userCommentId: params.userCommentId ?? null,
      expertCommentId: params.expertCommentId ?? null,
      aggregatedFrom: [],
      occurrences: 1,
      _ms: params.ms,
      _source: params.source,
      _context: params.context,
    }
  }

  // ============================================================
  // AGRUPACIÓN DE HALLAZGOS SIMILARES
  // ============================================================
  function groupSimilarFindings(
    findings: GeneratedFinding[],
  ): GeneratedFinding[] {
    const grouped: GeneratedFinding[] = []
    const used = new Set<string>()

    for (let i = 0; i < findings.length; i++) {
      const current = findings[i]
      if (used.has(current._tempId)) continue

      // Buscar otros hallazgos similares (misma fuente + tipo + class) dentro de la ventana
      const similar = findings.filter((f, j) => {
        if (i === j) return false
        if (used.has(f._tempId)) return false
        if (f._source !== current._source) return false
        if (f.type !== current.type) return false
        if (f.class !== current.class) return false
        return (
          Math.abs(f._ms - current._ms) <= AGGREGATION_THRESHOLDS.timeWindowMs
        )
      })

      if (similar.length > 0) {
        // Agrupar
        const group = [current, ...similar]
        const merged = mergeFindings(group)
        grouped.push(merged)
        group.forEach(f => used.add(f._tempId))
      } else {
        grouped.push(current)
        used.add(current._tempId)
      }
    }

    return grouped
  }

  function mergeFindings(group: GeneratedFinding[]): GeneratedFinding {
    const base = group[0]
    const occurrences = group.length
    const avgMs = Math.round(
      group.reduce((sum, f) => sum + f._ms, 0) / group.length,
    )

    // Ajustar severidad si se repite mucho
    let severity = base.severity
    if (occurrences >= 3) {
      severity = adjustSeverityUp(severity)
    }

    return {
      ...base,
      _tempId: generateTempId(),
      severity,
      occurrences,
      frequency: occurrences,
      aggregatedFrom: group.map(f => f._tempId),
      _ms: avgMs,
      description: `${base.description} (${occurrences} veces en ${Math.round(
        AGGREGATION_THRESHOLDS.timeWindowMs / 1000,
      )}s)`,
    }
  }

  // ============================================================
  // ORDENAR HALLAZGOS
  // ============================================================
  function sortFindings(findings: GeneratedFinding[]): GeneratedFinding[] {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return [...findings].sort((a, b) => {
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (sevDiff !== 0) return sevDiff
      return a._ms - b._ms
    })
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Estima el ms de un createdAt aproximando con la sesión.
   * Si tenemos startedAt en el timeline, calculamos el delta.
   */
  function estimateMsFromCreatedAt(
    createdAt: string,
    timeline: TimelineData,
  ): number {
    // Si tenemos el startedAt del primer evento, lo usamos
    const firstEvent = timeline.events[0]
    if (!firstEvent?.timestamp_real) return 0

    const sessionStart = new Date(firstEvent.timestamp_real).getTime()
    const createdMs = new Date(createdAt).getTime()
    return Math.max(0, createdMs - sessionStart)
  }

  function mapSeverityNumber(n: number): 'critical' | 'high' | 'medium' | 'low' {
    if (n >= 5) return 'critical'
    if (n >= 4) return 'high'
    if (n >= 3) return 'medium'
    return 'low'
  }

  function adjustSeverityUp(
    s: 'critical' | 'high' | 'medium' | 'low',
  ): 'critical' | 'high' | 'medium' | 'low' {
    const order = ['low', 'medium', 'high', 'critical']
    const idx = order.indexOf(s)
    return order[Math.min(idx + 1, order.length - 1)] as any
  }

  return {
    generateFindings,
  }
}