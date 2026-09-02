// src/composables/useFigmaClickTracker.ts
import { ref, onBeforeUnmount } from 'vue'

const FIGMA_ORIGIN = 'https://www.figma.com'

export interface ClickRecord {
  orderIndex: number
  nodeId: string
  presentedNodeId: string | null
}

export function useFigmaClickTracker(onClick: (record: ClickRecord) => void) {
  const clickCount = ref(0)
  const prototypeLoaded = ref(false)

  function handleMessage(event: MessageEvent) {
    if (event.origin !== FIGMA_ORIGIN) return
    const { type, data } = event.data ?? {}
    if (!type) return

    if (type === 'INITIAL_LOAD') {
      prototypeLoaded.value = true
      return
    }

    // Solo nos interesan los clicks que sí activaron un hotspot del prototipo
    if (type === 'MOUSE_PRESS_OR_RELEASE' && data.handled) {
      const nodeId = data.targetNodeId ?? data.presentedNodeId
      if (!nodeId) return

      clickCount.value += 1
      onClick({
        orderIndex: clickCount.value,
        nodeId,
        presentedNodeId: data.presentedNodeId ?? null,
      })
    }
  }

  function reset() {
    clickCount.value = 0
    prototypeLoaded.value = false
  }

  window.addEventListener('message', handleMessage)
  onBeforeUnmount(() => window.removeEventListener('message', handleMessage))

  return { clickCount, prototypeLoaded, reset }
}