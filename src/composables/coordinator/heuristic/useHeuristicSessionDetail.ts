// composables/coordinador/heuristic/useHeuristicSessionDetail.ts
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import api from '@/api/axios'
import { heuristicApi } from '@/api/heuristic.api'
import type {
  HeuristicObservation,
  HeuristicPositiveAspect,
  HeuristicRating,
  HeuristicTask,
  HeuristicEvaluator,
  HeuristicEvaluation,
  HeuristicTaskProgress,
} from '@/api/heuristic.api'
import {
  getEmotionLabel as getEmotionLabelFromDict,
  getEventTypeLabel as getEventTypeLabelFromDict,
} from '@/data/heuristicFindingsDictionary'

// ============================================================
// TIPOS
// ============================================================
export interface UsabilitySession {
  sessionId: string
  proyectId: string
  userId: string
  taskId: string | null
  fileKey: string
  nodeIdInicial: string | null
  taskDescription: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number
  status: 'in_progress' | 'completed' | 'abandoned'
  deviceType: string | null
  browser: string | null
  faceVideoKey: string | null
  screenVideKey: string | null
  evaluationType: string
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
  raw_payload: any
}

export interface EmotionReading {
  readingId: string
  sessionId: string
  elapsedMsTotal: number
  timestampReal: string
  dominantEmotion: string
  scoresJson: Record<string, number>
}

export interface TextSentiment {
  sentimentId: string
  sessionId: string
  text: string
  originalLabel: string
  uxLabel: string
  confidence: number
  scoresJson: Record<string, number>
  elapsedMsTotal: number
  timestampReal: string
  authorId: string | null
}

export interface ExpertComment {
  commentId: string
  projectId: string
  sessionId: string | null
  taskId: string | null
  authorId: string
  commentType: 'observation' | 'problem' | 'recommendation' | 'positive' | 'question'
  comment: string
  nodeId: string | null
  screenIdentifier: string | null
  severity: number | null
  elapsedMsTotal: number
  createdAt: string
  updatedAt: string
}

export interface SessionComment {
  commentId: string
  sessionId: string
  elapsedMsTotal: number
  text: string
  authorId?: string
  createdAt: string
}

// ============================================================
// COMPOSABLE
// ============================================================
export function useHeuristicSessionDetail() {
  const $q = useQuasar()

  // ============================================================
  // ESTADO
  // ============================================================
  const loading = ref(false)
  const error = ref<string | null>(null)

  const session = ref<UsabilitySession | null>(null)
  const events = ref<UsabilityEvent[]>([])
  const emotionReadings = ref<EmotionReading[]>([])
  const sentiments = ref<TextSentiment[]>([])
  const comments = ref<SessionComment[]>([])
  const expertComments = ref<ExpertComment[]>([])

  // Datos heurísticos específicos
  const evaluation = ref<HeuristicEvaluation | null>(null)
  const task = ref<HeuristicTask | null>(null)
  const evaluator = ref<HeuristicEvaluator | null>(null)
  const observations = ref<HeuristicObservation[]>([])
  const positiveAspects = ref<HeuristicPositiveAspect[]>([])
  const ratings = ref<HeuristicRating[]>([])
  const taskProgress = ref<HeuristicTaskProgress | null>(null)

  // ============================================================
  // COMPUTED — Emociones filtradas por cambio
  // ============================================================
  const emotionChanges = computed(() => {
    const changes: EmotionReading[] = []
    let lastEmotion: string | null = null

    // Ordenar por tiempo por seguridad
    const sorted = [...emotionReadings.value].sort(
      (a, b) => a.elapsedMsTotal - b.elapsedMsTotal,
    )

    for (const reading of sorted) {
      if (reading.dominantEmotion !== lastEmotion) {
        changes.push(reading)
        lastEmotion = reading.dominantEmotion
      }
    }

    return changes
  })

  // ============================================================
  // COMPUTED — Observaciones de esta sesión
  // ============================================================
  const sessionObservations = computed(() => {
    if (!session.value) return []
    return observations.value.filter(
      (o) => o.sessionId === session.value!.sessionId,
    )
  })

  // ============================================================
  // COMPUTED — Aspectos positivos de esta sesión
  // ============================================================
  const sessionPositiveAspects = computed(() => {
    if (!session.value) return []
    return positiveAspects.value.filter(
      (a) => a.sessionId === session.value!.sessionId,
    )
  })

  // ============================================================
  // COMPUTED — Comentarios de experto de esta sesión
  // ============================================================
  const sessionExpertComments = computed(() => {
    if (!session.value) return []
    return expertComments.value.filter(
      (c) => c.sessionId === session.value!.sessionId,
    )
  })

  // ============================================================
  // COMPUTED — URLs de video
  // ============================================================
  const API_BASE_URL = 'http://localhost:3000'
  const STATIC_BASE_URL = `${API_BASE_URL}/storage/`

  const screenVideoUrl = computed(() => {
    if (!session.value) return null
    const key = session.value.screenVideKey || (session.value as any).screenVideoKey
    return buildVideoUrl(key)
  })

  const faceVideoUrl = computed(() => {
    if (!session.value) return null
    return buildVideoUrl(session.value.faceVideoKey)
  })

  function buildVideoUrl(key: string | null | undefined): string | null {
    if (!key) return null
    const clean = key.replace(/^\/+/, '')
    return `${STATIC_BASE_URL}${clean}`
  }

  // ============================================================
  // COMPUTED — Duración total
  // ============================================================
  const durationMs = computed(() => {
    if (!session.value) return 0
    return (session.value.durationSeconds || 0) * 1000
  })

  // ============================================================
  // CARGA DE DATOS
  // ============================================================
  async function loadSession(sessionId: string) {
    loading.value = true
    error.value = null

    try {
      // 1. Cargar sesión
      const sessionRes = await fetch(`${API_BASE_URL}/api/usability-sessions/${sessionId}`)
      if (!sessionRes.ok) {
        throw new Error(`No se pudo cargar la sesión (HTTP ${sessionRes.status})`)
      }
      const sessionData = await sessionRes.json()
      session.value = sessionData

      // 2. Cargar datos en paralelo
      const [
        eventsRes,
        emotionsRes,
        sentimentsRes,
        commentsRes,
        expertCommentsRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/usability-events/session/${sessionId}`).catch(() => null),
        fetch(`${API_BASE_URL}/api/emotion-readings/session/${sessionId}`).catch(() => null),
        fetch(`${API_BASE_URL}/api/text-sentiments/session/${sessionId}`).catch(() => null),
        fetch(`${API_BASE_URL}/api/session-comments/session/${sessionId}`).catch(() => null),
        fetch(`${API_BASE_URL}/api/comment-experts/session/${sessionId}`).catch(() => null),
      ])

      // 3. Procesar eventos
      if (eventsRes && eventsRes.ok) {
        const data = await eventsRes.json()
        events.value = data.sort(
          (a: UsabilityEvent, b: UsabilityEvent) =>
            a.elapsed_ms_total - b.elapsed_ms_total,
        )
      }

      // 4. Procesar emociones
      if (emotionsRes && emotionsRes.ok) {
        emotionReadings.value = await emotionsRes.json()
      }

      // 5. Procesar sentimientos
      if (sentimentsRes && sentimentsRes.ok) {
        sentiments.value = await sentimentsRes.json()
      }

      // 6. Procesar comentarios de usuario
      if (commentsRes && commentsRes.ok) {
        comments.value = await commentsRes.json()
      }

      // 7. Procesar comentarios de experto
      if (expertCommentsRes && expertCommentsRes.ok) {
        expertComments.value = await expertCommentsRes.json()
      }

      // 8. Cargar datos heurísticos si es una sesión heurística
      if (sessionData.evaluationType === 'heuristic') {
        await loadHeuristicData(sessionData)
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar la sesión'
      console.error('Error loading session:', e)
      $q.notify({ type: 'negative', message: error.value })
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // CARGA DE DATOS HEURÍSTICOS
  // ============================================================
  async function loadHeuristicData(sessionData: UsabilitySession) {
    try {
      // 1. Cargar tarea heurística (si tiene taskId)
      if (sessionData.taskId) {
        try {
          const taskRes = await heuristicApi.getTask(sessionData.taskId)
          task.value = taskRes.data
        } catch (e) {
          console.warn('No se pudo cargar la tarea heurística:', e)
        }
      }

      // 2. Si tenemos la tarea, cargar la evaluación
      if (task.value?.evaluationId) {
        try {
          const evalRes = await heuristicApi.getEvaluation(task.value.evaluationId)
          evaluation.value = evalRes.data

          const evalId = task.value.evaluationId

          // 3. Cargar todos los datos de la evaluación
          const [
            observationsRes,
            positiveAspectsRes,
            ratingsRes,
            evaluatorsRes,
          ] = await Promise.all([
            heuristicApi.getObservationsByEvaluation(evalId),
            heuristicApi.getPositiveAspectsByEvaluation(evalId),
            heuristicApi.getRatingsByEvaluation(evalId),
            heuristicApi.getEvaluatorsByEvaluation(evalId),
          ])

          observations.value = observationsRes.data
          positiveAspects.value = positiveAspectsRes.data
          ratings.value = ratingsRes.data

          // 4. Encontrar el evaluador actual
          const me = evaluatorsRes.data.find(
            (e) => e.userId === sessionData.userId,
          )
          evaluator.value = me || null

          // 5. Cargar el progreso de la tarea para este evaluador
          if (evaluator.value) {
            try {
              const progressRes = await heuristicApi.findMyProgress(
                task.value.evaluationId,
                evaluator.value.id,
              )
              const progressList = progressRes.data || []
              taskProgress.value =
                progressList.find((p) => p.taskId === task.value!.id) || null
            } catch (e) {
              console.warn('No se pudo cargar el progreso:', e)
            }
          }
        } catch (e) {
          console.warn('No se pudo cargar la evaluación:', e)
        }
      }
    } catch (e) {
      console.error('Error al cargar datos heurísticos:', e)
    }
  }

  // ============================================================
  // HELPERS DE CONTEXTO
  // ============================================================

  /**
   * Obtiene el evento más cercano a un momento dado
   */
  function getNearestEvent(ms: number): UsabilityEvent | null {
    if (!events.value.length) return null
    return events.value.reduce((closest, ev) =>
      Math.abs(ev.elapsed_ms_total - ms) <
      Math.abs(closest.elapsed_ms_total - ms)
        ? ev
        : closest,
    )
  }

  /**
   * Obtiene el cambio de emoción más cercano a un momento dado
   */
  function getNearestEmotion(ms: number): EmotionReading | null {
    if (!emotionChanges.value.length) return null
    return emotionChanges.value.reduce((closest, em) =>
      Math.abs(em.elapsedMsTotal - ms) <
      Math.abs(closest.elapsedMsTotal - ms)
        ? em
        : closest,
    )
  }

  /**
   * Obtiene el sentimiento más cercano a un momento dado
   */
  function getNearestSentiment(ms: number): TextSentiment | null {
    if (!sentiments.value.length) return null
    return sentiments.value.reduce((closest, s) =>
      Math.abs(s.elapsedMsTotal - ms) < Math.abs(closest.elapsedMsTotal - ms)
        ? s
        : closest,
    )
  }

  /**
   * Obtiene el comentario más cercano a un momento dado
   */
  function getNearestComment(ms: number): SessionComment | null {
    if (!comments.value.length) return null
    return comments.value.reduce((closest, c) =>
      Math.abs(c.elapsedMsTotal - ms) < Math.abs(closest.elapsedMsTotal - ms)
        ? c
        : closest,
    )
  }

  /**
   * Obtiene el comentario de experto más cercano
   */
  function getNearestExpertComment(ms: number): ExpertComment | null {
    if (!expertComments.value.length) return null
    return expertComments.value.reduce((closest, c) =>
      Math.abs(c.elapsedMsTotal - ms) < Math.abs(closest.elapsedMsTotal - ms)
        ? c
        : closest,
    )
  }

  /**
   * Obtiene la observación heurística más cercana
   */
  function getNearestObservation(ms: number): HeuristicObservation | null {
    if (!observations.value.length) return null

    // Filtrar solo las observaciones de esta sesión
    const sessionObs = sessionObservations.value
    if (!sessionObs.length) return null

    return sessionObs.reduce((closest, o) => {
      const closestMs = new Date(closest.createdAt).getTime()
      const oMs = new Date(o.createdAt).getTime()
      return Math.abs(oMs - ms) < Math.abs(closestMs - ms) ? o : closest
    })
  }

  /**
   * Comentarios en una ventana de tiempo
   */
  function commentsNear(ms: number, windowMs = 2000): SessionComment[] {
    return comments.value.filter(
      (c) => Math.abs(c.elapsedMsTotal - ms) <= windowMs,
    )
  }

  /**
   * Obtiene el node_id de un evento
   */
  function getNodeIdFromEvent(ev: any): string {
    if (!ev) return ''

    if (ev.node_id) return ev.node_id

    if (ev.raw_payload) {
      const keys = [
        'targetNodeId',
        'nodeId',
        'presentedNodeId',
        'sourceNodeId',
        'currentNodeId',
      ]
      for (const key of keys) {
        if (ev.raw_payload[key]) return ev.raw_payload[key]
      }

      // Búsqueda genérica
      if (typeof ev.raw_payload === 'object') {
        for (const k of Object.keys(ev.raw_payload)) {
          const lower = k.toLowerCase()
          if (lower.includes('node') && typeof ev.raw_payload[k] === 'string') {
            const value = ev.raw_payload[k]
            if (value.includes(':') || value.includes('-')) {
              return value
            }
          }
        }
      }
    }

    return ev.nodeId || ev.targetNodeId || ev.presentedNodeId || ''
  }

  /**
   * Etiqueta legible de emoción
   */
  function getEmotionLabel(em: any): string {
    const emotion = em?.dominantEmotion || em?.emotion || em?.label || 'N/A'
    return getEmotionLabelFromDict(emotion)
  }

  /**
   * Momento (ms) de una lectura de emoción
   */
  function getEmotionMs(em: any): number {
    return em?.elapsedMsTotal ?? em?.elapsedMs ?? 0
  }

  /**
   * Etiqueta legible de evento
   */
  function getEventLabel(eventType: string): string {
    return getEventTypeLabelFromDict(eventType)
  }

  /**
   * Formatea una fecha ISO
   */
  function formatDate(iso: string): string {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString('es-BO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  /**
   * Formatea un momento (ms) en mm:ss
   */
  function formatTimeMs(ms: number): string {
    if (!isFinite(ms) || ms < 0) ms = 0
    const totalSeconds = Math.floor(ms / 1000)
    const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const sec = (totalSeconds % 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  }

  // ============================================================
  // COMPUTED — Timeline data (para FindingsGenerator)
  // ============================================================
  const timelineData = computed(() => ({
    events: events.value,
    emotionReadings: emotionChanges.value, // 🔥 Solo cambios
    sentiments: sentiments.value,
    comments: comments.value,
    expertComments: sessionExpertComments.value,
    observations: sessionObservations.value,
    positiveAspects: sessionPositiveAspects.value,
    durationMs: durationMs.value,
    evaluationId: evaluation.value?.evaluationId || '',
    sessionId: session.value?.sessionId || '',
    taskId: task.value?.id || null,
    // Funciones de contexto
    getNodeIdFromEvent,
    getEmotionLabel,
    getNearestEvent,
    getNearestEmotion,
    getNearestComment,
    getNearestSentiment,
  }))

  // ============================================================
  // RESET
  // ============================================================
  function reset() {
    session.value = null
    events.value = []
    emotionReadings.value = []
    sentiments.value = []
    comments.value = []
    expertComments.value = []
    evaluation.value = null
    task.value = null
    evaluator.value = null
    observations.value = []
    positiveAspects.value = []
    ratings.value = []
    taskProgress.value = null
    error.value = null
  }

  return {
    // Estado
    loading,
    error,
    session,
    events,
    emotionReadings,
    emotionChanges,
    sentiments,
    comments,
    expertComments,
    evaluation,
    task,
    evaluator,
    observations,
    positiveAspects,
    ratings,
    taskProgress,

    // Computed
    sessionObservations,
    sessionPositiveAspects,
    sessionExpertComments,
    screenVideoUrl,
    faceVideoUrl,
    durationMs,
    timelineData,

    // Métodos
    loadSession,
    reset,

    // Helpers de contexto
    getNearestEvent,
    getNearestEmotion,
    getNearestSentiment,
    getNearestComment,
    getNearestExpertComment,
    getNearestObservation,
    commentsNear,
    getNodeIdFromEvent,
    getEmotionLabel,
    getEmotionMs,
    getEventLabel,
    formatDate,
    formatTimeMs,
  }
}