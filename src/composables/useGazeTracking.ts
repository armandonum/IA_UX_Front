// composables/useGazeTracking.ts
import { ref, computed } from 'vue'

// ============================================================
// TIPOS
// ============================================================
export interface GazeReading {
  gaze_x: number
  gaze_y: number
  confidence: number
  elapsed_ms_total: number
  node_id: string | null
  timestamp_real: string
}

export interface UseGazeTrackingOptions {
  aiServiceUrl: string
  backendUrl: string
  sessionId: () => string | null
  getElapsedMs: () => number
  getCurrentNodeId: () => string | null
  getViewportSize: () => { width: number; height: number }
}

// ============================================================
// COMPOSABLE
// ============================================================
export function useGazeTracking(options: UseGazeTrackingOptions) {
  const {
    aiServiceUrl,
    backendUrl,
    sessionId,
    getElapsedMs,
    getCurrentNodeId,
    getViewportSize,
  } = options

  // ============================================================
  // ESTADO
  // ============================================================
  const isTracking = ref(false)
  const isReady = ref(false) // 🔥 NUEVO: true cuando ya hay un node_id
  const gazeActual = ref<{ x: number; y: number; confidence: number } | null>(null)
  const lecturasRegistradas = ref(0)
  const eventosEnviados = ref(0)
  const currentTrackedNodeId = ref<string | null>(null) // 🔥 NUEVO: node_id activo

  // Buffer para enviar en batch
  let gazeBuffer: GazeReading[] = []
  const BATCH_SIZE = 10
  const BATCH_INTERVAL_MS = 2000

  let captureInterval: ReturnType<typeof setInterval> | null = null
  let flushInterval: ReturnType<typeof setInterval> | null = null

  // Video element (guardado al iniciar)
  let trackedVideoEl: HTMLVideoElement | null = null
  let trackedIntervalMs = 200

  // ============================================================
  // COMPUTED
  // ============================================================
  const hasGaze = computed(() => gazeActual.value !== null)

  // ============================================================
  // CAPTURAR FRAME DEL VIDEO
  // ============================================================
  function captureFrame(): string | null {
    const videoEl = trackedVideoEl
    if (!videoEl || !videoEl.videoWidth || !videoEl.videoHeight) return null

    const canvas = document.createElement('canvas')
    canvas.width = videoEl.videoWidth
    canvas.height = videoEl.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.7)
  }

  // ============================================================
  // ANALIZAR GAZE EN LA IA
  // ============================================================
  async function analyzeGaze(imageBase64: string): Promise<void> {
    const currentSessionId = sessionId()
    if (!currentSessionId) return

    // 🔥 IMPORTANTE: Solo analizar si hay un node_id activo
    const nodeId = getCurrentNodeId()
    if (!nodeId) {
      // Aún no hay node_id, no guardamos
      return
    }

    // 🔥 Si cambió el node, actualizar el tracking
    if (currentTrackedNodeId.value !== nodeId) {
      console.log(`[GazeTracking] Nodo cambió: ${currentTrackedNodeId.value} → ${nodeId}`)
      currentTrackedNodeId.value = nodeId

      // Flush del buffer anterior antes de continuar con el nuevo nodo
      if (gazeBuffer.length > 0) {
        await flushGazeBuffer()
      }
    }

    const elapsed = getElapsedMs()
    const viewport = getViewportSize()

    try {
      const response = await fetch(`${aiServiceUrl}/analyze-gaze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          elapsed_ms_total: elapsed,
          image_base64: imageBase64,
          viewport_width: viewport.width,
          viewport_height: viewport.height,
          node_id: nodeId,
          save_to_backend: false,
        }),
      })

      if (!response.ok) return

      const data = await response.json()

      if (!data.face_detected || data.gaze_x === null) {
        gazeActual.value = null
        return
      }

      // Actualizar estado local
      gazeActual.value = {
        x: data.gaze_x,
        y: data.gaze_y,
        confidence: data.confidence,
      }

      // Agregar al buffer con el node_id
      gazeBuffer.push({
        gaze_x: data.gaze_x,
        gaze_y: data.gaze_y,
        confidence: data.confidence,
        elapsed_ms_total: elapsed,
        node_id: nodeId,
        timestamp_real: new Date().toISOString(),
      })

      lecturasRegistradas.value++

      // Si el buffer está lleno, hacer flush inmediato
      if (gazeBuffer.length >= BATCH_SIZE) {
        await flushGazeBuffer()
      }
    } catch (error) {
      console.warn('[GazeTracking] Error al analizar gaze:', error)
    }
  }

  // ============================================================
  // FLUSH: ENVIAR BUFFER A NESTJS
  // ============================================================
  async function flushGazeBuffer(): Promise<void> {
    const currentSessionId = sessionId()
    if (!currentSessionId || gazeBuffer.length === 0) return

    const eventsToSend = [...gazeBuffer]
    gazeBuffer = []

    try {
      const response = await fetch(`${backendUrl}/gaze-events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: eventsToSend.map(e => ({
            sessionId: currentSessionId,
            elapsedMsTotal: e.elapsed_ms_total,
            gazeX: e.gaze_x,
            gazeY: e.gaze_y,
            confidence: e.confidence,
            viewportWidth: getViewportSize().width,
            viewportHeight: getViewportSize().height,
            nodeId: e.node_id, // 🔥 Ya no es null
            eventType: 'raw',
            durationMs: 0,
          })),
        }),
      })

      if (response.ok) {
        eventosEnviados.value += eventsToSend.length
        console.log(`[GazeTracking] ${eventsToSend.length} eventos enviados con node_id`)
      } else {
        console.warn('[GazeTracking] Error al enviar batch:', response.status)
        gazeBuffer = [...eventsToSend, ...gazeBuffer]
      }
    } catch (error) {
      console.warn('[GazeTracking] Error al enviar batch:', error)
      gazeBuffer = [...eventsToSend, ...gazeBuffer]
    }
  }

  // ============================================================
  // MARCAR COMO "READY" (cuando ya hay un node_id)
  // ============================================================
  function markAsReady(): void {
    if (isReady.value) return
    isReady.value = true
    console.log('[GazeTracking] Marcado como READY (hay node_id activo)')
  }

  // ============================================================
  // INICIAR TRACKING (guarda el video pero espera a isReady)
  // ============================================================
  function startTracking(
    videoEl: HTMLVideoElement | null,
    intervalMs: number = 200,
  ): void {
    if (isTracking.value) return

    trackedVideoEl = videoEl
    trackedIntervalMs = intervalMs

    isTracking.value = true
    gazeBuffer = []
    currentTrackedNodeId.value = null

    // 🔥 NO iniciamos el intervalo aún, esperamos a markAsReady()
    console.log('[GazeTracking] Esperando primer node_id...')
  }

  // ============================================================
  // ACTIVAR CAPTURA (llamado cuando llega el primer PRESENTED_NODE_CHANGED)
  // ============================================================
  function activateCapture(): void {
    if (!isTracking.value || isReady.value) return

    markAsReady()

    // Iniciar captura
    captureInterval = setInterval(async () => {
      if (!isReady.value) return // No capturar si aún no hay node_id

      const frame = captureFrame()
      if (frame) {
        await analyzeGaze(frame)
      }
    }, trackedIntervalMs)

    // Flush periódico
    flushInterval = setInterval(async () => {
      if (gazeBuffer.length > 0) {
        await flushGazeBuffer()
      }
    }, BATCH_INTERVAL_MS)

    console.log(`[GazeTracking] Captura ACTIVADA (cada ${trackedIntervalMs}ms)`)
  }

  // ============================================================
  // DETENER TRACKING
  // ============================================================
  async function stopTracking(): Promise<void> {
    if (!isTracking.value) return

    isTracking.value = false
    isReady.value = false

    if (captureInterval) {
      clearInterval(captureInterval)
      captureInterval = null
    }
    if (flushInterval) {
      clearInterval(flushInterval)
      flushInterval = null
    }

    // Enviar lo que quede en el buffer
    await flushGazeBuffer()

    trackedVideoEl = null
    currentTrackedNodeId.value = null

    console.log(`[GazeTracking] Detenido. Total enviados: ${eventosEnviados.value}`)
  }

  // ============================================================
  // SOLICITAR CÁLCULO DE MÉTRICAS AOI
  // ============================================================
  async function calculateAOIMetrics(): Promise<void> {
    const currentSessionId = sessionId()
    if (!currentSessionId) return

    try {
      const response = await fetch(`${backendUrl}/gaze-aoi-metrics/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`[GazeTracking] Métricas AOI calculadas: ${data.aoiCount}`)
      } else {
        console.warn('[GazeTracking] Error al calcular métricas AOI:', response.status)
      }
    } catch (error) {
      console.warn('[GazeTracking] Error al calcular métricas AOI:', error)
    }
  }

  // ============================================================
  // RESET
  // ============================================================
  function reset(): void {
    gazeActual.value = null
    gazeBuffer = []
    lecturasRegistradas.value = 0
    eventosEnviados.value = 0
    currentTrackedNodeId.value = null
  }

  return {
    // Estado
    isTracking,
    isReady,
    gazeActual,
    hasGaze,
    lecturasRegistradas,
    eventosEnviados,
    currentTrackedNodeId,

    // Métodos
    startTracking,
    activateCapture, // 🔥 NUEVO: se llama cuando llega el primer node_id
    stopTracking,
    flushGazeBuffer,
    calculateAOIMetrics,
    reset,
  }
}