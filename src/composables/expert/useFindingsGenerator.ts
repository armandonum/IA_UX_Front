// composables/useFindingsGenerator.ts
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import type { GeneratedFinding, FindingGenerationConfig } from '@/types/expert/findings.types'

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
export const useFindingsGenerator = () => {
  const $q = useQuasar()
  const isGenerating = ref(false)
  const generatedFindings = ref<GeneratedFinding[]>([])
  const generationProgress = ref(0)

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================
  const defaultConfig: FindingGenerationConfig = {
    minConfidence: 0.6,
    minFrequency: 1,
    maxTimeGap: 5000, // 5 segundos
    includeEmotions: true,
    includeSentiments: true,
    includeUserComments: true,
    includeExpertComments: true,
  }

  // ============================================================
  // DETECTORES DE PATRONES
  // ============================================================

  /**
   * Detecta problemas de usabilidad basados en comentarios de usuarios
   */

function detectUserCommentIssues(data: TimelineData): GeneratedFinding[] {
  const findings: GeneratedFinding[] = []
  const { 
    comments, 
    getNearestEmotion, 
    getNearestSentiment, 
    getNearestEvent,
    getNodeIdFromEvent,
    evaluationId, 
    sessionId, 
    taskId 
  } = data

  console.log('🔍 detectUserCommentIssues - comentarios:', comments?.length)

  if (!comments || comments.length === 0) {
    console.log('⚠️ No hay comentarios para analizar')
    return []
  }

  if (typeof getNodeIdFromEvent !== 'function') {
    console.warn('⚠️ getNodeIdFromEvent no está definido en detectUserCommentIssues')
    return []
  }

  const problemKeywords = [
    // Problemas directos
    'problema', 'error', 'fallo', 'falla', 'bug', 'incidente',
    // Dificultad
    'difícil', 'complicado', 'confuso', 'lento', 'tarda', 'demora',
    'no funciona', 'no sirve', 'no responde', 'no carga', 'no guarda',
    'no entiendo', 'no sé', 'no puedo', 'no me deja', 'no aparece',
    // Acciones fallidas
    'no logro', 'no puedo ver', 'no veo', 'no encuentro', 'no localizo',
    'no me permite', 'no me deja', 'no me muestra', 'no me aparece',
    // Frustración
    'ayuda', 'socorro', 'qué hago', 'cómo hago', 'dónde está',
    'mal', 'feo', 'horrible', 'terrible', 'pésimo',
    // Negaciones
    'no', 'ni', 'sin', 'falta', 'falta', 'ausente'
  ]


  const TYPE_MAPPING: Record<string, string> = {
  // Nuestros tipos internos → Tipos del backend
  usability: 'problem',
  emotional: 'difficulty',
  sentiment: 'friction',
  expert: 'problem',
  mixed: 'problem',
  
  // Ya son válidos
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
  for (const comment of comments) {
    const text = comment.text?.toLowerCase() || ''
    console.log(`🔍 Evaluando comentario: "${text}"`)
    
    // ✅ Buscar cualquier palabra clave
    const hasProblem = problemKeywords.some(keyword => text.includes(keyword))
    console.log(`  - Contiene palabras clave de problema: ${hasProblem}`)

    // ✅ También detectar si el comentario es negativo por contexto
    const isNegative = text.includes('no') || text.includes('mal') || text.includes('error')
    const hasIssue = hasProblem || (isNegative && text.length > 10)

    if (hasIssue) {
      console.log(`✅ Comentario con problema detectado: "${comment.text}"`)
      
      const nearestEmotion = getNearestEmotion(comment.elapsedMsTotal)
      const nearestSentiment = getNearestSentiment(comment.elapsedMsTotal)
      const nearestEvent = getNearestEvent(comment.elapsedMsTotal)
      
      console.log(`  - Emoción cercana:`, nearestEmotion)
      console.log(`  - Sentimiento cercano:`, nearestSentiment)
      console.log(`  - Evento cercano:`, nearestEvent)

      // ✅ Obtener nodeId desde el evento
      const nodeId = nearestEvent ? getNodeIdFromEvent(nearestEvent) : null

      findings.push({
        _tempId: `uc-${comment.commentId}`,
        evaluationId: evaluationId,  // ✅ SIEMPRE tiene valor
        sessionId: sessionId || null,  // ✅ Si no hay, null
        taskId: taskId || null,  // ✅ Si no hay, null
        requirementId: null,  // ✅ Por ahora null
        flowId: null,  // ✅ Por ahora null
        nodeId: nodeId,
        version: nearestEvent?.version || '1.0',
        type: 'problem',
        description: `Usuario reportó problema: "${comment.text}"`,
        severity: determineSeverity(nearestEmotion, nearestSentiment, text),
        frequency: 1,
        impact: determineImpact(nearestEmotion, nearestSentiment),
        priority: 'medium',
        recommendation: generateRecommendation('usability', comment.text, nearestEmotion),
        status: 'pending',
        emotionInferred: nearestEmotion?.dominantEmotion || nearestEmotion?.emotion || null,
        textualSentiment: nearestSentiment?.uxLabel || null,
        userComment: comment.text,
        expertComment: null,
        userCommentId: comment.commentId,
        expertCommentId: null,
        aggregatedFrom: [comment.commentId],
        occurrences: 1,
        source: 'user_comment',
        confidence: calculateConfidence(nearestEmotion, nearestSentiment),
        relatedEvents: nearestEvent ? [nearestEvent] : [],
        relatedEmotions: nearestEmotion ? [nearestEmotion] : [],
        relatedSentiments: nearestSentiment ? [nearestSentiment] : [],
        relatedComments: [comment],
        relatedExpertComments: [],
      })
    }
  }
  console.log(`📊 Hallazgos de comentarios de usuario generados: ${findings.length}`)
  return findings
}

// ============================================================
// DETECTOR DE PROBLEMAS EMOCIONALES
// ============================================================
function detectEmotionalIssues(data: TimelineData): GeneratedFinding[] {
  const findings: GeneratedFinding[] = []
  const { 
    emotionReadings, 
    comments, 
    getNearestComment, 
    getNearestEvent, 
    getNearestSentiment, 
    getEmotionLabel,
    getNodeIdFromEvent,  // ✅ AGREGAR AQUÍ
    evaluationId, 
    sessionId, 
    taskId 
  } = data

  // ✅ Verificar que getEmotionLabel existe
  if (typeof getEmotionLabel !== 'function') {
    console.warn('⚠️ getEmotionLabel no está definido en detectEmotionalIssues')
    return []
  }

  // ✅ Verificar que getNodeIdFromEvent existe
  if (typeof getNodeIdFromEvent !== 'function') {
    console.warn('⚠️ getNodeIdFromEvent no está definido en detectEmotionalIssues')
    return []
  }

  const negativeEmotions = ['frustration', 'anger', 'confusion', 'disappointment', 'anxiety', 'sadness']

  for (const emotion of emotionReadings) {
    const emotionLabel = getEmotionLabel(emotion).toLowerCase()
    const isNegative = negativeEmotions.some(ne => emotionLabel.includes(ne))

    if (isNegative && emotion.confidence && emotion.confidence > 0.6) {
      const nearestComment = getNearestComment(emotion.elapsedMsTotal)
      const nearestEvent = getNearestEvent(emotion.elapsedMsTotal)
      const nearestSentiment = getNearestSentiment(emotion.elapsedMsTotal)

      // Verificar si ya hay un hallazgo similar
      const existing = findings.find(f =>
        f.source === 'emotion' &&
        Math.abs(getEmotionMs(f.relatedEmotions[0]) - getEmotionMs(emotion)) < 5000
      )

      if (existing) {
        existing.frequency += 1
        existing.occurrences += 1
        existing.relatedEmotions.push(emotion)
        continue
      }

      // ✅ Usar getNodeIdFromEvent desde data
      const nodeId = nearestEvent ? getNodeIdFromEvent(nearestEvent) : null

      findings.push({
        _tempId: `em-${Date.now()}-${findings.length}`,
        evaluationId,
        sessionId,
        taskId,
        nodeId: nodeId,
        version: nearestEvent?.version || '1.0',
        type: 'difficulty',
        description: `Usuario experimentó ${emotionLabel} durante la interacción`,
        severity: determineSeverity(emotion, null, emotionLabel),
        frequency: 1,
        impact: 'medium',
        priority: 'medium',
        recommendation: generateRecommendation('emotional', emotionLabel, emotion),
        status: 'pending',
        emotionInferred: emotionLabel,
        textualSentiment: nearestSentiment?.uxLabel || null,
        userComment: nearestComment?.text || null,
        expertComment: null,
        userCommentId: nearestComment?.commentId || null,
        expertCommentId: null,
        aggregatedFrom: [],
        occurrences: 1,
        source: 'emotion',
        confidence: emotion.confidence || 0.7,
        relatedEvents: nearestEvent ? [nearestEvent] : [],
        relatedEmotions: [emotion],
        relatedSentiments: nearestSentiment ? [nearestSentiment] : [],
        relatedComments: nearestComment ? [nearestComment] : [],
        relatedExpertComments: [],
      })
    }
  }

  return findings
}

  /**
   * Detecta problemas basados en sentimientos negativos
   */
  function detectSentimentIssues(data: TimelineData): GeneratedFinding[] {
    const findings: GeneratedFinding[] = []
    const { sentiments, getNearestComment, getNearestEvent, getNearestEmotion, evaluationId, sessionId, taskId } = data

    const negativeSentiments = ['frustration', 'difficulty', 'confusion', 'dissatisfaction']

    for (const sentiment of sentiments) {
      const isNegative = negativeSentiments.some(ns =>
        sentiment.uxLabel?.toLowerCase().includes(ns) ||
        sentiment.sentiment?.toLowerCase().includes(ns)
      )

      if (isNegative && sentiment.confidence && sentiment.confidence > 0.6) {
        const nearestComment = getNearestComment(sentiment.elapsedMsTotal)
        const nearestEvent = getNearestEvent(sentiment.elapsedMsTotal)
        const nearestEmotion = getNearestEmotion(sentiment.elapsedMsTotal)

        findings.push({
          _tempId: `st-${Date.now()}-${findings.length}`,
          evaluationId,
          sessionId,
          taskId,
          nodeId: getNodeIdFromEvent(nearestEvent),
          version: nearestEvent?.version || '1.0',
          type: 'friction',
          description: `Sentimiento negativo detectado: ${sentiment.uxLabel || sentiment.sentiment}`,
          severity: determineSeverity(nearestEmotion, sentiment, ''),
          frequency: 1,
          impact: 'medium',
          priority: 'medium',
          recommendation: generateRecommendation('sentiment', sentiment.text || '', nearestEmotion),
          status: 'pending',
          emotionInferred: nearestEmotion?.dominantEmotion || nearestEmotion?.emotion || null,
          textualSentiment: sentiment.uxLabel || null,
          userComment: nearestComment?.text || null,
          expertComment: null,
          userCommentId: nearestComment?.commentId || null,
          expertCommentId: null,
          aggregatedFrom: [],
          occurrences: 1,
          source: 'sentiment',
          confidence: sentiment.confidence || 0.7,
          relatedEvents: nearestEvent ? [nearestEvent] : [],
          relatedEmotions: nearestEmotion ? [nearestEmotion] : [],
          relatedSentiments: [sentiment],
          relatedComments: nearestComment ? [nearestComment] : [],
          relatedExpertComments: [],
        })
      }
    }

    return findings
  }

  /**
   * Detecta problemas basados en comentarios de expertos
   */
  
function detectExpertIssues(data: TimelineData): GeneratedFinding[] {
  const findings: GeneratedFinding[] = []
  const { 
    expertComments, 
    getNearestComment, 
    getNearestEvent, 
    getNearestEmotion, 
    getNearestSentiment,
    getNodeIdFromEvent,
    evaluationId, 
    sessionId, 
    taskId 
  } = data

  console.log('🔍 detectExpertIssues - comentarios de experto:', expertComments?.length)

  if (!expertComments || expertComments.length === 0) {
    console.log('⚠️ No hay comentarios de experto para analizar')
    return []
  }

  if (typeof getNodeIdFromEvent !== 'function') {
    console.warn('⚠️ getNodeIdFromEvent no está definido en detectExpertIssues')
    return []
  }

  for (const expertComment of expertComments) {
    console.log(`🔍 Evaluando comentario de experto: "${expertComment.comment}"`)
    console.log(`  - Tipo: ${expertComment.commentType}`)
    
    // ✅ Incluir comentarios de tipo 'problem', 'recommendation', o cualquier comentario que tenga severidad
    const isRelevant = expertComment.commentType === 'problem' || 
                       expertComment.commentType === 'recommendation' ||
                       expertComment.severity

    if (isRelevant) {
      console.log(`✅ Comentario de experto relevante detectado`)
      
      const severity = determineSeverity(expertComment)
      const nearestEvent = getNearestEvent(expertComment.elapsedMsTotal)
      const nearestEmotion = getNearestEmotion(expertComment.elapsedMsTotal)
      const nearestSentiment = getNearestSentiment(expertComment.elapsedMsTotal)

      const nodeId = nearestEvent ? getNodeIdFromEvent(nearestEvent) : null

      findings.push({
        _tempId: `ec-${expertComment.commentId}`,
        evaluationId,
        sessionId,
        taskId,
        nodeId: nodeId,
        version: nearestEvent?.version || '1.0',
        type: 'problem',
        description: `Experto identificó: ${expertComment.comment}`,
        severity: severity,
        frequency: 1,
        impact: determineImpact(nearestEmotion, nearestSentiment),
        priority: severity === 'critical' ? 'high' : severity === 'high' ? 'high' : 'medium',
        recommendation: expertComment.commentType === 'recommendation' ? expertComment.comment : null,
        status: 'pending',
        emotionInferred: nearestEmotion?.dominantEmotion || nearestEmotion?.emotion || null,
        textualSentiment: nearestSentiment?.uxLabel || null,
        userComment: null,
        expertComment: expertComment.comment,
        userCommentId: null,
        expertCommentId: expertComment.commentId,
        aggregatedFrom: [expertComment.commentId],
        occurrences: 1,
        source: 'expert_comment',
        confidence: 0.9,
        relatedEvents: nearestEvent ? [nearestEvent] : [],
        relatedEmotions: nearestEmotion ? [nearestEmotion] : [],
        relatedSentiments: nearestSentiment ? [nearestSentiment] : [],
        relatedComments: [],
        relatedExpertComments: [expertComment],
      })
    }
  }

  console.log(`📊 Hallazgos de expertos generados: ${findings.length}`)
  return findings
}

  /**
   * Agrupa hallazgos similares
   */
  function groupSimilarFindings(findings: GeneratedFinding[]): GeneratedFinding[] {
    const grouped: GeneratedFinding[] = []
    const used = new Set<string>()

    for (const finding of findings) {
      if (used.has(finding._tempId)) continue

      const similar = findings.filter(f =>
        !used.has(f._tempId) &&
        f.nodeId === finding.nodeId &&
        Math.abs(getEmotionMs(f.relatedEmotions[0]) - getEmotionMs(finding.relatedEmotions[0])) < 5000 &&
        f.type === finding.type
      )

      if (similar.length > 1) {
        // Combinar hallazgos similares
        const combined = { ...finding }
        combined.frequency = similar.reduce((sum, f) => sum + f.frequency, 0)
        combined.occurrences = similar.length
        combined.aggregatedFrom = similar.flatMap(f => f.aggregatedFrom || [])
        combined.relatedEvents = similar.flatMap(f => f.relatedEvents)
        combined.relatedEmotions = similar.flatMap(f => f.relatedEmotions)
        combined.relatedSentiments = similar.flatMap(f => f.relatedSentiments)
        combined.relatedComments = similar.flatMap(f => f.relatedComments)
        combined.relatedExpertComments = similar.flatMap(f => f.relatedExpertComments)
        combined.confidence = combined.confidence * (1 + (similar.length - 1) * 0.1)

        // Actualizar severidad basada en frecuencia
        if (combined.frequency > 3) {
          combined.severity = 'high'
        } else if (combined.frequency > 1) {
          combined.severity = 'medium'
        }

        similar.forEach(f => used.add(f._tempId))
        grouped.push(combined)
      } else {
        used.add(finding._tempId)
        grouped.push(finding)
      }
    }

    return grouped
  }

  // ============================================================
  // FUNCIONES DE CÁLCULO
  // ============================================================

  function getEmotionMs(emotion: any): number {
    return emotion?.elapsedMsTotal ?? emotion?.elapsedMs ?? 0
  }

  function determineSeverity(emotion: any, sentiment: any, text: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    // Basado en emociones
    if (emotion) {
      const label = emotion.dominantEmotion || emotion.emotion || ''
      if (['anger', 'frustration'].some(e => label.includes(e))) return 'high'
      if (['confusion', 'anxiety'].some(e => label.includes(e))) return 'medium'
      if (['disappointment', 'sadness'].some(e => label.includes(e))) return 'low'
    }

    // Basado en sentimientos
    if (sentiment) {
      const label = sentiment.uxLabel || sentiment.sentiment || ''
      if (label.includes('critical') || label.includes('severe')) return 'critical'
      if (label.includes('frustration') || label.includes('difficulty')) return 'high'
      if (label.includes('confusion')) return 'medium'
    }

    // Basado en texto
    if (text) {
      const lower = text.toLowerCase()
      if (lower.includes('no funciona') || lower.includes('error grave')) return 'critical'
      if (lower.includes('confuso') || lower.includes('difícil')) return 'medium'
      if (lower.includes('lento') || lower.includes('tarda')) return 'low'
    }

    return 'medium'
  }

  function determineImpact(emotion: any, sentiment: any): 'high' | 'medium' | 'low' {
    if (emotion) {
      const label = emotion.dominantEmotion || emotion.emotion || ''
      if (['anger', 'frustration'].some(e => label.includes(e))) return 'high'
      if (['confusion', 'anxiety'].some(e => label.includes(e))) return 'medium'
    }
    if (sentiment) {
      const label = sentiment.uxLabel || sentiment.sentiment || ''
      if (label.includes('critical')) return 'high'
      if (label.includes('frustration')) return 'medium'
    }
    return 'medium'
  }

  function calculateConfidence(emotion: any, sentiment: any): number {
    let confidence = 0.5
    if (emotion?.confidence) confidence = Math.max(confidence, emotion.confidence)
    if (sentiment?.confidence) confidence = Math.max(confidence, sentiment.confidence)
    return Math.min(1, confidence + 0.2)
  }

  function generateRecommendation(type: string, data: string, emotion: any): string {
    const recommendations: Record<string, string[]> = {
      usability: [
        'Simplificar la interfaz para reducir la confusión del usuario',
        'Agregar indicadores visuales más claros',
        'Mejorar la retroalimentación del sistema',
        'Reducir el número de pasos necesarios',
      ],
      emotional: [
        'Rediseñar la experiencia para reducir la frustración del usuario',
        'Agregar mensajes de ayuda contextual',
        'Mejorar el flujo de navegación',
        'Proveer retroalimentación positiva inmediata',
      ],
      sentiment: [
        'Abordar las preocupaciones del usuario sobre la usabilidad',
        'Mejorar la claridad de la información presentada',
        'Optimizar el rendimiento de la aplicación',
        'Agregar tutoriales o guías introductorias',
      ],
    }

    const list = recommendations[type] || recommendations.usability
    return list[Math.floor(Math.random() * list.length)]
  }

  // ============================================================
  // GENERACIÓN PRINCIPAL
  // ============================================================

async function generateFindings(data: TimelineData, config: Partial<FindingGenerationConfig> = {}): Promise<GeneratedFinding[]> {
  isGenerating.value = true
  generationProgress.value = 0

  try {
    console.log('📡 ========== INICIO GENERACIÓN HALLAZGOS ==========')
    console.log('📌 Datos recibidos:')
    console.log('  - events:', data.events?.length || 0)
    console.log('  - emotionReadings:', data.emotionReadings?.length || 0)
    console.log('  - sentiments:', data.sentiments?.length || 0)
    console.log('  - comments:', data.comments?.length || 0)
    console.log('  - expertComments:', data.expertComments?.length || 0)
    console.log('  - durationMs:', data.durationMs)
    console.log('  - evaluationId:', data.evaluationId)
    console.log('  - sessionId:', data.sessionId)
    console.log('  - taskId:', data.taskId)
    console.log('  - getEmotionLabel:', typeof data.getEmotionLabel)
    console.log('  - getNodeIdFromEvent:', typeof data.getNodeIdFromEvent)
    
    // ✅ Verificar que las funciones existen
    if (typeof data.getEmotionLabel !== 'function') {
      console.error('❌ getEmotionLabel NO es una función')
    }
    if (typeof data.getNodeIdFromEvent !== 'function') {
      console.error('❌ getNodeIdFromEvent NO es una función')
    }
    if (typeof data.getNearestEvent !== 'function') {
      console.error('❌ getNearestEvent NO es una función')
    }
    if (typeof data.getNearestEmotion !== 'function') {
      console.error('❌ getNearestEmotion NO es una función')
    }
    if (typeof data.getNearestComment !== 'function') {
      console.error('❌ getNearestComment NO es una función')
    }
    if (typeof data.getNearestSentiment !== 'function') {
      console.error('❌ getNearestSentiment NO es una función')
    }

    const finalConfig = { ...defaultConfig, ...config }

    const allFindings: GeneratedFinding[] = []

    // 🔍 PROBAR CADA DETECTOR INDIVIDUALMENTE

    // 1. Emociones
    if (finalConfig.includeEmotions && data.emotionReadings?.length > 0) {
      console.log('🔍 Ejecutando detector de emociones...')
      console.log('  - Lecturas de emociones:', data.emotionReadings.length)
      console.log('  - Primera emoción:', JSON.stringify(data.emotionReadings[0], null, 2))
      
      const emotionalFindings = detectEmotionalIssues(data)
      console.log(`  - Hallazgos emocionales encontrados: ${emotionalFindings.length}`)
      allFindings.push(...emotionalFindings)
      generationProgress.value = 25
    } else {
      console.log('⚠️ Detector de emociones saltado (sin datos o desactivado)')
    }

    // 2. Sentimientos
    if (finalConfig.includeSentiments && data.sentiments?.length > 0) {
      console.log('🔍 Ejecutando detector de sentimientos...')
      console.log('  - Sentimientos:', data.sentiments.length)
      console.log('  - Primer sentimiento:', JSON.stringify(data.sentiments[0], null, 2))
      
      const sentimentFindings = detectSentimentIssues(data)
      console.log(`  - Hallazgos de sentimiento encontrados: ${sentimentFindings.length}`)
      allFindings.push(...sentimentFindings)
      generationProgress.value = 50
    } else {
      console.log('⚠️ Detector de sentimientos saltado (sin datos o desactivado)')
    }

    // 3. Comentarios de usuario
    if (finalConfig.includeUserComments && data.comments?.length > 0) {
      console.log('🔍 Ejecutando detector de comentarios de usuario...')
      console.log('  - Comentarios:', data.comments.length)
      console.log('  - Primer comentario:', JSON.stringify(data.comments[0], null, 2))
      
      const userCommentFindings = detectUserCommentIssues(data)
      console.log(`  - Hallazgos de comentarios encontrados: ${userCommentFindings.length}`)
      allFindings.push(...userCommentFindings)
      generationProgress.value = 75
    } else {
      console.log('⚠️ Detector de comentarios de usuario saltado (sin datos o desactivado)')
    }

    // 4. Comentarios de experto
    if (finalConfig.includeExpertComments && data.expertComments?.length > 0) {
      console.log('🔍 Ejecutando detector de comentarios de experto...')
      console.log('  - Comentarios de experto:', data.expertComments.length)
      console.log('  - Primer comentario experto:', JSON.stringify(data.expertComments[0], null, 2))
      
      const expertFindings = detectExpertIssues(data)
      console.log(`  - Hallazgos de experto encontrados: ${expertFindings.length}`)
      allFindings.push(...expertFindings)
      generationProgress.value = 90
    } else {
      console.log('⚠️ Detector de comentarios de experto saltado (sin datos o desactivado)')
    }

    console.log(`📊 Total hallazgos antes de agrupar: ${allFindings.length}`)
    if (allFindings.length > 0) {
      console.log('📋 Hallazgos encontrados:', allFindings.map(f => ({
        type: f.type,
        description: f.description,
        source: f.source,
        confidence: f.confidence
      })))
    }

    // 2. Agrupar hallazgos similares
    const groupedFindings = groupSimilarFindings(allFindings)
    console.log(`📊 Hallazgos después de agrupar: ${groupedFindings.length}`)

    // 3. Filtrar por confianza mínima
    const filtered = groupedFindings.filter(f =>
      f.confidence >= finalConfig.minConfidence
    )
    console.log(`📊 Hallazgos después de filtrar (confianza >= ${finalConfig.minConfidence}): ${filtered.length}`)

    generationProgress.value = 100
    generatedFindings.value = filtered

    console.log('✅ Generación completada. Hallazgos:', filtered.length)
    console.log('📡 ========== FIN GENERACIÓN HALLAZGOS ==========')

    return filtered
  } catch (error) {
    console.error('❌ Error generating findings:', error)
    console.error('❌ Stack:', error.stack)
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