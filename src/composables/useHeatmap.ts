// composables/useHeatmap.ts

import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { heatmapApi, type HeatmapEvent } from '@/api/heatmap.api'

export function useHeatmap(options: {
  sessionId: Ref<string | null>
  projectId: Ref<string | null>
  userId?: Ref<string | null>
  nodeId?: Ref<string | null>
  enabled?: boolean
  captureMove?: boolean
  captureScroll?: boolean
  debounceMs?: number
  getElapsedMs?: () => number  // ✅ AÑADIDO
}) {
  const {
    sessionId,
    projectId,
    userId = ref(null),
    nodeId = ref(null),
    enabled = true,
    captureMove = true,
    captureScroll = true,
    debounceMs = 300,
    getElapsedMs = () => 0,  // ✅ VALOR POR DEFECTO
  } = options

  const isCapturing = ref(false)
  const lastMoveEvent = ref<{ x: number; y: number } | null>(null)
  const moveTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
  const scrollTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
  const lastScrollDepth = ref(0)

  // Contadores para debug
  const eventCount = ref(0)
  const clickCount = ref(0)
  const moveCount = ref(0)
  const scrollCount = ref(0)

  // Detectar tipo de dispositivo
  function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent
    if (/mobile/i.test(ua)) return 'mobile'
    if (/tablet/i.test(ua)) return 'tablet'
    return 'desktop'
  }

  // Obtener navegador
  function getBrowser(): string {
    const ua = navigator.userAgent
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'Chrome'
    if (/firefox/i.test(ua)) return 'Firefox'
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari'
    if (/edge/i.test(ua)) return 'Edge'
    if (/opera/i.test(ua)) return 'Opera'
    return 'Unknown'
  }

  // Crear payload base
  function createBasePayload(
    eventType: HeatmapEvent['eventType'],
    xPct: number,
    yPct: number,
    extra?: Partial<HeatmapEvent>,
  ): HeatmapEvent | null {
    // 🔥 Validación estricta
    if (!sessionId.value || !projectId.value) {
      console.debug('⏭️ Heatmap: sessionId o projectId es null, ignorando evento')
      return null
    }

    return {
      sessionId: sessionId.value,
      projectId: projectId.value,
      userId: userId.value || undefined,
      eventType,
      nodeId: nodeId.value || undefined,
      xPct,
      yPct,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      elapsedMsTotal: getElapsedMs(),
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      ...extra,
    }
  }

  // Enviar evento al backend
  async function sendEvent(data: HeatmapEvent) {
    try {
      await heatmapApi.createEvent(data)
      eventCount.value++
      
      // Actualizar contadores específicos
      switch (data.eventType) {
        case 'click':
          clickCount.value++
          break
        case 'move':
          moveCount.value++
          break
        case 'scroll':
          scrollCount.value++
          break
      }
    } catch (error) {
      console.warn('Error enviando evento de mapa de calor:', error)
    }
  }

  function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.min(Math.max(value, min), max)
}

 // ============================================================
// CAPTURA DE CLICKS
// ============================================================
function handleClick(event: MouseEvent) {
  if (!enabled || !isCapturing.value) return

  const target = event.target as HTMLElement
  const iframe = target.closest('iframe')
  if (iframe) return

  const rect = document.body.getBoundingClientRect()
  const xPct = clamp(((event.clientX - rect.left) / rect.width) * 100)
  const yPct = clamp(((event.clientY - rect.top) / rect.height) * 100)

  const payload = createBasePayload('click', xPct, yPct, {
    elementSelector: getElementSelector(target),
  })

  if (payload) {
    sendEvent(payload)
  }
}

// ============================================================
// CAPTURA DE MOVIMIENTO
// ============================================================
function handleMove(event: MouseEvent) {
  if (!enabled || !isCapturing.value || !captureMove) return
  if (event.target instanceof HTMLIFrameElement) return

  const rect = document.body.getBoundingClientRect()
  // 🔥 Asegurar que xPct y yPct estén entre 0 y 100
  const xPct = clamp(((event.clientX - rect.left) / rect.width) * 100)
  const yPct = clamp(((event.clientY - rect.top) / rect.height) * 100)

  if (moveTimeout.value) {
    clearTimeout(moveTimeout.value)
  }

  moveTimeout.value = setTimeout(() => {
    const payload = createBasePayload('move', xPct, yPct)
    if (payload) {
      sendEvent(payload)
    }
    moveTimeout.value = null
  }, debounceMs)
}

  // ============================================================
  // CAPTURA DE SCROLL
  // ============================================================
  function handleScroll() {
    if (!enabled || !isCapturing.value || !captureScroll) return

    const scrollY = window.scrollY
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const scrollDepth = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0

    if (Math.abs(scrollDepth - lastScrollDepth.value) < 5) return

    lastScrollDepth.value = scrollDepth

    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }

    scrollTimeout.value = setTimeout(() => {
      const payload = createBasePayload('scroll', 50, scrollDepth, {
        scrollDepth: Math.round(scrollDepth),
      })
      if (payload) {
        sendEvent(payload)
      }
      scrollTimeout.value = null
    }, 500)
  }

  // ============================================================
  // CAPTURA DE RESIZE
  // ============================================================
  function handleResize() {
    if (!enabled || !isCapturing.value) return

    const payload = createBasePayload('resize', 50, 50)
    if (payload) {
      sendEvent(payload)
    }
  }

  // ============================================================
  // UTILIDAD: Obtener selector CSS
  // ============================================================
  function getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).join('.')
      return `${element.tagName.toLowerCase()}.${classes}`
    }
    return element.tagName.toLowerCase()
  }

  // ============================================================
  // CONTROL
  // ============================================================
  function startCapturing() {
    if (!sessionId.value || !projectId.value) {
      console.warn('⚠️ Heatmap: No se puede iniciar captura sin sessionId o projectId')
      return
    }
    isCapturing.value = true
    console.log('🔥 Heatmap: Captura iniciada')
  }

  function stopCapturing() {
    isCapturing.value = false
    if (moveTimeout.value) {
      clearTimeout(moveTimeout.value)
      moveTimeout.value = null
    }
    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
      scrollTimeout.value = null
    }
    console.log('🔥 Heatmap: Captura detenida')
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  function setupListeners() {
    document.addEventListener('click', handleClick)
    document.addEventListener('mousemove', handleMove)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
  }

  function removeListeners() {
    document.removeEventListener('click', handleClick)
    document.removeEventListener('mousemove', handleMove)
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
  }

  if (enabled) {
    onMounted(() => {
      setupListeners()
      // No iniciar automáticamente, esperar a que se llame startCapturing
    })

    onBeforeUnmount(() => {
      stopCapturing()
      removeListeners()
    })
  }

  return {
    isCapturing,
    eventCount,
    clickCount,
    moveCount,
    scrollCount,
    startCapturing,
    stopCapturing,
    sendEvent,
  }
}