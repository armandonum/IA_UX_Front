// composables/expert/useFindingsGenerator.ts
import { ref } from 'vue'
import type { GeneratedFinding, FindingGenerationConfig } from '@/types/expert/findings.types'
import {
  getEmotionTemplate,
  getSentimentTemplate,
  findMatchingCombinationRule,
  getHumanLabel,
} from '@/types/expert/findings.dictionary'

interface TimelineData {
  events: any[]
  emotionReadings: any[]
  sentiments: any[]
  comments: any[]
  expertComments: any[]
  durationMs: number
  taskId?: string
  sessionId?: string
  evaluationId: string
  getNodeIdFromEvent: (ev: any) => string
  getEmotionLabel: (em: any) => string
  getNearestEvent: (ms: number) => any
  getNearestEmotion: (ms: number) => any
  getNearestComment: (ms: number) => any
  getNearestSentiment: (ms: number) => any
}

interface TimeWindow {
  startMs: number
  endMs: number
  emotions: any[]
  sentiments: any[]
  comments: any[]
  expertComments: any[]
}

const TYPE_MAPPING: Record<string, string> = {
  usability: 'problem',
  emotional: 'difficulty',
  sentiment: 'friction',
  expert: 'problem',
  mixed: 'problem',
  problem: 'problem',
  difficulty: 'difficulty',
  accessibility: 'accessibility',
  friction: 'friction',
  positive: 'positive',
  opportunity: 'opportunity',
}

function mapTypeToBackend(internalType: string): string {
  return TYPE_MAPPING[internalType] || 'problem'
}

let tempIdCounter = 0
function generateTempId(prefix: string = 'gen'): string {
  return `${prefix}_${Date.now()}_${tempIdCounter++}`
}

export const useFindingsGenerator = () => {
  const isGenerating = ref(false)
  const generatedFindings = ref<GeneratedFinding[]>([])
  const generationProgress = ref(0)

  const defaultConfig: FindingGenerationConfig = {
    minConfidence: 0.5,
    minFrequency: 1,
    maxTimeGap: 5000,
    includeEmotions: true,
    includeSentiments: true,
    includeUserComments: true,
    includeExpertComments: true,
    emotionChangeThreshold: 0.3,
  }

  // ============================================================
  // FILTRAR EMOCIONES - solo cambios significativos
  // ============================================================
  function filterSignificantEmotionChanges(
    emotionReadings: any[],
    threshold: number,
  ): any[] {
    if (!emotionReadings.length) return []

    const result: any[] = []
    let lastSignificantEmotion: any = null

    for (const reading of emotionReadings) {
      const currentEmotion = (reading.dominantEmotion || reading.emotion || 'neutral').toLowerCase()
      const currentScores = reading.scoresJson || {}

      if (!lastSignificantEmotion) {
        result.push(reading)
        lastSignificantEmotion = reading
        continue
      }

      const lastEmotion = (
        lastSignificantEmotion.dominantEmotion ||
        lastSignificantEmotion.emotion ||
        'neutral'
      ).toLowerCase()

      // Cambió la emoción dominante → significativo
      if (currentEmotion !== lastEmotion) {
        result.push(reading)
        lastSignificantEmotion = reading
        continue
      }

      // Misma emoción pero con cambio significativo en score
      const lastScores = lastSignificantEmotion.scoresJson || {}
      const currentScore = currentScores[currentEmotion] || 0
      const lastScore = lastScores[lastEmotion] || 0

      if (Math.abs(currentScore - lastScore) > threshold) {
        result.push(reading)
        lastSignificantEmotion = reading
      }
    }

    return result
  }

  // ============================================================
  // AGRUPAR POR VENTANAS DE TIEMPO
  // ============================================================
  function groupByTimeWindows(
    emotions: any[],
    sentiments: any[],
    comments: any[],
    expertComments: any[],
    maxGap: number,
  ): TimeWindow[] {
    const allItems = [
      ...emotions.map((e) => ({ type: 'emotion' as const, ms: e.elapsedMsTotal || 0, data: e })),
      ...sentiments.map((s) => ({ type: 'sentiment' as const, ms: s.elapsedMsTotal || 0, data: s })),
      ...comments.map((c) => ({ type: 'comment' as const, ms: c.elapsedMsTotal || 0, data: c })),
      ...expertComments.map((e) => ({ type: 'expert' as const, ms: e.elapsedMsTotal || 0, data: e })),
    ].sort((a, b) => a.ms - b.ms)

    const windows: TimeWindow[] = []
    let currentWindow: TimeWindow | null = null

    for (const item of allItems) {
      if (!currentWindow || item.ms - currentWindow.endMs > maxGap) {
        if (currentWindow) windows.push(currentWindow)
        currentWindow = {
          startMs: item.ms,
          endMs: item.ms,
          emotions: [],
          sentiments: [],
          comments: [],
          expertComments: [],
        }
      }

      currentWindow.endMs = item.ms

      switch (item.type) {
        case 'emotion':
          currentWindow.emotions.push(item.data)
          break
        case 'sentiment':
          currentWindow.sentiments.push(item.data)
          break
        case 'comment':
          currentWindow.comments.push(item.data)
          break
        case 'expert':
          currentWindow.expertComments.push(item.data)
          break
      }
    }

    if (currentWindow) windows.push(currentWindow)
    return windows
  }

  // ============================================================
  // GENERAR HALLAZGOS POR VENTANA
  // ============================================================
 function generateFindingsFromWindow(
  window: TimeWindow,
  data: TimelineData,
  config: FindingGenerationConfig,
): GeneratedFinding[] {
  const findings: GeneratedFinding[] = []
  const midMs = (window.startMs + window.endMs) / 2

  const nearestEvent = data.getNearestEvent(midMs)
  const nodeId = nearestEvent ? data.getNodeIdFromEvent(nearestEvent) : null
  const nodeName = nearestEvent?.screen_name || nodeId || 'pantalla desconocida'
  const eventType = getHumanLabel(
    'eventType',
    nearestEvent?.event_type || 'interacción',
  )

  const emotionKeys = window.emotions.map((e) =>
    (e.dominantEmotion || e.emotion || 'neutral').toLowerCase(),
  )
  const sentimentKeys = window.sentiments.map((s) => s.uxLabel || 'Neutral')
  const commentTexts = window.comments.map((c) => c.text).filter(Boolean)
  const expertTexts = window.expertComments.map((e) => e.comment).filter(Boolean)

  // ============================================================
  // REGLA 1: Combinación específica
  // ============================================================
  const combinationRule = findMatchingCombinationRule(
    emotionKeys,
    sentimentKeys,
    commentTexts.length > 0,
  )

  if (combinationRule) {
    const description = combinationRule.descriptionTemplate
      .replace('{comment}', commentTexts[0] || '')
      .replace(/{nodeName}/g, nodeName)

    const recommendation = combinationRule.recommendationTemplate.replace(
      /{nodeName}/g,
      nodeName,
    )

    findings.push(
      createFinding({
        type: combinationRule.type,
        severity: combinationRule.severity,
        description,
        recommendation,
        source: 'mixed',
        confidence: 0.9,
        nodeId,
        window,
        evaluationId: data.evaluationId,
        sessionId: data.sessionId || null,
        taskId: data.taskId || null,
        emotionInferred: emotionKeys[0],
        textualSentiment: sentimentKeys[0],
        userComment: commentTexts[0],
        eventType,
        getNearestSentiment: data.getNearestSentiment, // ✅ NUEVO
      }),
    )
  }

  // ============================================================
  // REGLA 2: Emoción significativa
  // ============================================================
  if (config.includeEmotions && window.emotions.length > 0) {
    const dominantEmotion = getMostFrequent(emotionKeys)
    const template = getEmotionTemplate(dominantEmotion)

    if (template.minConfidence <= 0.5) {
      const templateIdx = Math.floor(
        Math.random() * template.descriptionTemplates.length,
      )
      const recIdx = Math.floor(
        Math.random() * template.recommendationTemplates.length,
      )

      const description = template.descriptionTemplates[templateIdx]
        .replace('{context}', ` en la pantalla "${nodeName}"`)
        .replace('{detail}', '')

      const recommendation = template.recommendationTemplates[recIdx].replace(
        /{node}/g,
        nodeName,
      )

      findings.push(
        createFinding({
          type: template.type,
          severity: template.severity,
          description,
          recommendation,
          source: 'emotion',
          confidence: window.emotions[0]?.confidence || 0.7,
          nodeId,
          window,
          evaluationId: data.evaluationId,
          sessionId: data.sessionId || null,
          taskId: data.taskId || null,
          emotionInferred: dominantEmotion,
          eventType,
          getNearestSentiment: data.getNearestSentiment, // ✅ NUEVO
        }),
      )
    }
  }

  // ============================================================
  // REGLA 3: Sentimiento
  // ============================================================
  if (config.includeSentiments && window.sentiments.length > 0) {
    const dominantSentiment = getMostFrequent(sentimentKeys)
    const template = getSentimentTemplate(dominantSentiment)

    const commentText = commentTexts[0] || window.sentiments[0]?.text || ''
    const templateIdx = Math.floor(
      Math.random() * template.descriptionTemplates.length,
    )
    const recIdx = Math.floor(
      Math.random() * template.recommendationTemplates.length,
    )

    const description = template.descriptionTemplates[templateIdx]
      .replace('{text}', commentText)
      .replace('{context}', ` en "${nodeName}"`)

    const recommendation = template.recommendationTemplates[recIdx].replace(
      /{node}/g,
      nodeName,
    )

    findings.push(
      createFinding({
        type: template.type,
        severity: template.severity,
        description,
        recommendation,
        source: 'sentiment',
        confidence: window.sentiments[0]?.confidence || 0.7,
        nodeId,
        window,
        evaluationId: data.evaluationId,
        sessionId: data.sessionId || null,
        taskId: data.taskId || null,
        textualSentiment: dominantSentiment,
        userComment: commentText,
        eventType,
        getNearestSentiment: data.getNearestSentiment, // ✅ NUEVO
      }),
    )
  }

  // ============================================================
  // REGLA 4: Solo comentario de usuario
  // ============================================================
  if (
    config.includeUserComments &&
    commentTexts.length > 0 &&
    window.emotions.length === 0 &&
    window.sentiments.length === 0
  ) {
    findings.push(
      createFinding({
        type: 'usability',
        severity: 'medium',
        description: `El usuario comentó: "${commentTexts[0]}" en la pantalla "${nodeName}".`,
        recommendation: `Revisar el feedback del usuario y considerar mejoras en "${nodeName}".`,
        source: 'user_comment',
        confidence: 0.6,
        nodeId,
        window,
        evaluationId: data.evaluationId,
        sessionId: data.sessionId || null,
        taskId: data.taskId || null,
        userComment: commentTexts[0],
        eventType,
        getNearestSentiment: data.getNearestSentiment, // ✅ NUEVO
      }),
    )
  }

  // ============================================================
  // REGLA 5: Comentario de experto
  // ============================================================
  if (config.includeExpertComments && expertTexts.length > 0) {
    const expertComment = window.expertComments[0]
    findings.push(
      createFinding({
        type: 'expert',
        severity: mapExpertSeverity(expertComment.severity),
        description: expertComment.comment,
        recommendation: `Atender observación del experto en "${nodeName}".`,
        source: 'expert_comment',
        confidence: 0.9,
        nodeId,
        window,
        evaluationId: data.evaluationId,
        sessionId: data.sessionId || null,
        taskId: data.taskId || null,
        expertComment: expertComment.comment,
        expertCommentId: expertComment.commentId,
        eventType,
        getNearestSentiment: data.getNearestSentiment, // ✅ NUEVO
      }),
    )
  }

  return findings
}
  // ============================================================
  // HELPERS
  // ============================================================
  function createFinding(params: {
  type: string
  severity: string
  description: string
  recommendation: string
  source: string
  confidence: number
  nodeId: string | null
  window: TimeWindow
  evaluationId: string
  sessionId: string | null
  taskId: string | null
  emotionInferred?: string
  textualSentiment?: string
  userComment?: string
  expertComment?: string
  expertCommentId?: string
  eventType?: string
  // ✅ NUEVO: función para obtener el sentimiento más cercano
  getNearestSentiment?: (ms: number) => any
}): GeneratedFinding {
  const midMs = (params.window.startMs + params.window.endMs) / 2

  // ✅ FIX: Si no vino sentimiento, buscar el más cercano en el tiempo
  let finalSentiment = params.textualSentiment
  let finalUserComment = params.userComment

  if (!finalSentiment && params.getNearestSentiment) {
    const nearest = params.getNearestSentiment(midMs)
    if (nearest) {
      // Solo si está razonablemente cerca (< 15s)
      const diff = Math.abs((nearest.elapsedMsTotal || 0) - midMs)
      if (diff <= 15000) {
        finalSentiment = nearest.uxLabel || null
        // Si no hay comentario, usar el texto del sentimiento
        if (!finalUserComment && nearest.text) {
          finalUserComment = nearest.text
        }
      }
    }
  }

  return {
    _tempId: generateTempId(params.source),
    evaluationId: params.evaluationId,
    sessionId: params.sessionId,
    taskId: params.taskId,
    requirementId: null,
    flowId: null,
    nodeId: params.nodeId,
    version: '1.0',
    type: mapTypeToBackend(params.type) as any,
    description: params.description,
    severity: params.severity as any,
    frequency: 1,
    impact: mapSeverityToImpact(params.severity),
    priority: mapSeverityToPriority(params.severity),
    recommendation: params.recommendation,
    status: 'pending',
    emotionInferred: params.emotionInferred || null,
    textualSentiment: finalSentiment || null,          // ✅ AHORA SÍ
    userComment: finalUserComment || null,             // ✅ AHORA SÍ
    expertComment: params.expertComment || null,
    userCommentId: params.window.comments[0]?.commentId || null,
    expertCommentId: params.expertCommentId || null,
    aggregatedFrom: [],
    occurrences: 1,
    source: params.source as any,
    confidence: params.confidence,
    relatedEvents: [],
    relatedEmotions: params.window.emotions,
    relatedSentiments: params.window.sentiments,
    relatedComments: params.window.comments,
    relatedExpertComments: params.window.expertComments,
  }
}

  function getMostFrequent(arr: string[]): string {
    if (!arr.length) return ''
    const counts: Record<string, number> = {}
    arr.forEach((item) => {
      counts[item] = (counts[item] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  function mapSeverityToImpact(severity: string): 'high' | 'medium' | 'low' {
    if (severity === 'critical' || severity === 'high') return 'high'
    if (severity === 'medium') return 'medium'
    return 'low'
  }

  function mapSeverityToPriority(severity: string): 'high' | 'medium' | 'low' {
    if (severity === 'critical' || severity === 'high') return 'high'
    if (severity === 'medium') return 'medium'
    return 'low'
  }

  function mapExpertSeverity(severity: number | undefined): string {
    if (!severity) return 'medium'
    if (severity >= 5) return 'critical'
    if (severity >= 4) return 'high'
    if (severity >= 3) return 'medium'
    if (severity >= 2) return 'low'
    return 'info'
  }

  // ============================================================
  // DEDUPLICAR
  // ============================================================
  function deduplicateFindings(findings: GeneratedFinding[]): GeneratedFinding[] {
    const result: GeneratedFinding[] = []
    const used = new Set<number>()

    for (let i = 0; i < findings.length; i++) {
      if (used.has(i)) continue

      const current = findings[i]
      const similar: number[] = [i]

      for (let j = i + 1; j < findings.length; j++) {
        if (used.has(j)) continue
        const other = findings[j]

        const sameNode = current.nodeId === other.nodeId
        const sameType = current.type === other.type
        const sameSource = current.source === other.source

        if (sameNode && sameType && sameSource) {
          similar.push(j)
        }
      }

      if (similar.length > 1) {
        const merged = { ...current }
        merged.frequency = similar.length
        merged.occurrences = similar.length
        merged.confidence = Math.min(0.99, current.confidence * (1 + (similar.length - 1) * 0.1))

        similar.forEach((idx) => used.add(idx))
        result.push(merged)
      } else {
        used.add(i)
        result.push(current)
      }
    }

    return result
  }

  // ============================================================
  // GENERACIÓN PRINCIPAL
  // ============================================================
  async function generateFindings(
    data: TimelineData,
    config: Partial<FindingGenerationConfig> = {},
  ): Promise<GeneratedFinding[]> {
    isGenerating.value = true
    generationProgress.value = 0

    try {
      const cfg: FindingGenerationConfig = { ...defaultConfig, ...config }

      // 1. Filtrar emociones significativas (solo cambios)
      const significantEmotions = filterSignificantEmotionChanges(
        data.emotionReadings || [],
        cfg.emotionChangeThreshold,
      )
      generationProgress.value = 20

      // 2. Agrupar en ventanas
      const windows = groupByTimeWindows(
        cfg.includeEmotions ? significantEmotions : [],
        cfg.includeSentiments ? data.sentiments || [] : [],
        cfg.includeUserComments ? data.comments || [] : [],
        cfg.includeExpertComments ? data.expertComments || [] : [],
        cfg.maxTimeGap,
      )
      generationProgress.value = 50

      // 3. Generar hallazgos por ventana
      const allFindings: GeneratedFinding[] = []
      for (const window of windows) {
        const windowFindings = generateFindingsFromWindow(window, data, cfg)
        allFindings.push(...windowFindings)
      }
      generationProgress.value = 80

      // 4. Deduplicar
      const deduplicated = deduplicateFindings(allFindings)

      // 5. Filtrar por confianza
      const filtered = deduplicated.filter((f) => f.confidence >= cfg.minConfidence)

      generationProgress.value = 100
      generatedFindings.value = filtered
      return filtered
    } catch (error) {
      console.error('❌ Error generando hallazgos:', error)
      throw error
    } finally {
      isGenerating.value = false
    }
  }

  return {
    isGenerating,
    generatedFindings,
    generationProgress,
    generateFindings,
  }
}