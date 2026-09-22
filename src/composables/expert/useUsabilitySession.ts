// composables/useUsabilitySession.ts

import { ref, computed } from 'vue'
import api from '@/api/axios'

// ============================================================
// TIPOS
// ============================================================
export interface UsabilitySession {
  session_id: string
  project_id: string
  user_id: string | null
  task_id: string | null
  file_key: string
  node_id_inicial: string | null
  task_description: string
  started_at: string
  ended_at: string | null
  duration_seconds: number
  status: 'in_progress' | 'completed' | 'abandoned'
  device_type: string | null
  browser: string | null
  face_video_key: string | null
  screen_video_key: string | null
  evaluation_type: string
  created_at: string
  updated_at: string
}

export interface CreateSessionPayload {
  projectId: string
  userId: string
  fileKey: string
  taskId?: string
  taskDescription?: string
  nodeIdInicial?: string
  evaluationType?: string
}

// ============================================================
// COMPOSABLE
// ============================================================
export function useUsabilitySession() {
  // ============================================================
  // ESTADO
  // ============================================================
  const sessionId = ref<string | null>(null)
  const currentSession = ref<UsabilitySession | null>(null)
  const startTimestamp = ref<number | null>(null)
  const elapsedMs = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let timerInterval: ReturnType<typeof setInterval> | null = null

  // ============================================================
  // COMPUTED
  // ============================================================
  const isActive = computed(
    () => currentSession.value?.status === 'in_progress',
  )

  const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))

  const elapsedFormatted = computed(() => {
    const totalSeconds = elapsedSeconds.value
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  })

  // ============================================================
  // MÉTODOS
  // ============================================================
// ============================================================
// HELPERS: DETECCIÓN DE DISPOSITIVO Y NAVEGADOR
// ============================================================
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase()

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      navigator.userAgent,
    )
  ) {
    return 'mobile'
  }
  return 'desktop'
}

function getBrowserName(): string {
  const ua = navigator.userAgent
  let browserName = 'Unknown'

  if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox'
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browserName = 'Opera'
  } else if (ua.indexOf('Trident') > -1) {
    browserName = 'Internet Explorer'
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge'
  } else if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome'
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari'
  }

  return browserName
}
  /**
   * Crear una nueva sesión de usabilidad
   */
  async function createSession(
  payload: CreateSessionPayload,
): Promise<UsabilitySession | null> {
  loading.value = true
  error.value = null

  try {
    // 🔥 Detectar dispositivo y navegador
    const deviceType = getDeviceType()
    const browser = getBrowserName()

    const response = await api.post<UsabilitySession>(
      '/usability-sessions',
      {
        // ✅ camelCase (como espera el backend NestJS)
        proyectId: payload.projectId,
        userId: payload.userId,
        fileKey: payload.fileKey,
        taskId: payload.taskId ?? null,
        taskDescription: payload.taskDescription ?? 'Evaluación heurística',
        nodeIdInicial: payload.nodeIdInicial ?? null,
        evaluationType: payload.evaluationType ?? 'heuristic',

        deviceType,
        browser,
      },
    )

    currentSession.value = response.data
    sessionId.value = response.data.session_id
    startTimestamp.value = Date.now()

    startTimer()
    return response.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al crear sesión'
    console.error('Error creating usability session:', e)
    return null
  } finally {
    loading.value = false
  }
}

  /**
   * Obtener una sesión por ID
   */
  async function getSession(id: string): Promise<UsabilitySession | null> {
    loading.value = true
    error.value = null

    try {
      const response = await api.get<UsabilitySession>(
        `/usability-sessions/${id}`,
      )
      currentSession.value = response.data
      sessionId.value = response.data.session_id
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Error al obtener sesión'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Finalizar una sesión
   */
  async function finishSession(
    status: 'completed' | 'abandoned' = 'completed',
    faceVideoKey?: string,
    screenVideoKey?: string,
  ): Promise<boolean> {
    if (!sessionId.value) return false

    loading.value = true
    error.value = null

    try {
      const durationSeconds = elapsedSeconds.value

      await api.patch(`/usability-sessions/${sessionId.value}`, {
        status,
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        face_video_key: faceVideoKey ?? currentSession.value?.face_video_key,
        screen_video_key: screenVideoKey ?? currentSession.value?.screen_video_key,
      })

      if (currentSession.value) {
        currentSession.value.status = status
        currentSession.value.ended_at = new Date().toISOString()
        currentSession.value.duration_seconds = durationSeconds
      }

      stopTimer()
      return true
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Error al finalizar sesión'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar la sesión (por ejemplo, con las keys de video)
   */
  async function updateSession(
    data: Partial<UsabilitySession>,
  ): Promise<boolean> {
    if (!sessionId.value) return false

    try {
      await api.patch(`/usability-sessions/${sessionId.value}`, data)
      if (currentSession.value) {
        Object.assign(currentSession.value, data)
      }
      return true
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Error al actualizar sesión'
      return false
    }
  }

  /**
   * Guardar una lectura de emoción
   */
  async function saveEmotionReading(data: {
    dominantEmotion: string | null
    faceDetected: boolean
    scoresJson: any
  }): Promise<boolean> {
    if (!sessionId.value) return false

    try {
      await api.post('/emotion-readings', {
        session_id: sessionId.value,
        elapsed_ms_total: elapsedMs.value,
        timestamp_real: new Date().toISOString(),
        dominant_emotion: data.dominantEmotion,
        scores_json: data.scoresJson,
      })
      return true
    } catch (e) {
      console.warn('Error saving emotion reading:', e)
      return false
    }
  }

  /**
   * Guardar un evento de usabilidad
   */
  async function saveEvent(data: {
    eventType: string
    eventTypeNormalizado: string
    nodeId?: string | null
    rawPayload?: any
  }): Promise<boolean> {
    if (!sessionId.value) return false

    try {
      const elapsed = elapsedMs.value
      await api.post('/usability-events', {
        session_id: sessionId.value,
        event_type: data.eventType,
        event_type_normalizado: data.eventTypeNormalizado,
        node_id: data.nodeId ?? null,
        elapsed_minute: Math.floor(elapsed / 60000),
        elapsed_second: Math.floor((elapsed % 60000) / 1000),
        elapsed_ms_total: elapsed,
        timestamp_real: new Date().toISOString(),
        raw_payload: data.rawPayload ?? null,
      })
      return true
    } catch (e) {
      console.warn('Error saving usability event:', e)
      return false
    }
  }

  /**
   * Guardar un sentimiento de texto
   */
  async function saveTextSentiment(data: {
    text: string
    originalLabel: string
    uxLabel: string
    confidence: number
    scoresJson: any
  }): Promise<boolean> {
    if (!sessionId.value) return false

    try {
      await api.post('/text-sentiments', {
        session_id: sessionId.value,
        text: data.text,
        original_label: data.originalLabel,
        ux_label: data.uxLabel,
        confidence: data.confidence,
        scores_json: data.scoresJson,
        elapsed_ms_total: elapsedMs.value,
        timestamp_real: new Date().toISOString(),
      })
      return true
    } catch (e) {
      console.warn('Error saving text sentiment:', e)
      return false
    }
  }

  // ============================================================
  // TIMER
  // ============================================================
  function startTimer() {
    stopTimer()
    timerInterval = setInterval(() => {
      if (startTimestamp.value) {
        elapsedMs.value = Date.now() - startTimestamp.value
      }
    }, 250)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function resetTimer() {
    stopTimer()
    elapsedMs.value = 0
    startTimestamp.value = null
  }

  /**
   * Obtener el tiempo transcurrido en milisegundos
   */
  function getElapsedMs(): number {
    return elapsedMs.value
  }

  /**
   * Obtener el tiempo transcurrido formateado
   */
  function getTimeFormatted(): string {
    return elapsedFormatted.value
  }

  /**
   * Limpiar el estado
   */
  function clear() {
    stopTimer()
    sessionId.value = null
    currentSession.value = null
    startTimestamp.value = null
    elapsedMs.value = 0
    error.value = null
  }

  // ============================================================
  // RETURN
  // ============================================================
  return {
    // Estado
    sessionId,
    currentSession,
    startTimestamp,
    elapsedMs,
    loading,
    error,

    // Computed
    isActive,
    elapsedSeconds,
    elapsedFormatted,

    // Métodos principales
    createSession,
    getSession,
    finishSession,
    updateSession,

    // Métodos de guardado
    saveEmotionReading,
    saveEvent,
    saveTextSentiment,

    // Timer
    startTimer,
    stopTimer,
    resetTimer,
    getElapsedMs,
    getTimeFormatted,

    // Utilidades
    clear,
  }
}