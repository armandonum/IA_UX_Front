// composables/useFigmaNodes.ts

import { ref } from 'vue'

interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  componentId?: string
}

export function useFigmaNodes() {
  const nodeCache = ref<Map<string, { name: string; type: string; componentId?: string }>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadFigmaNodes(fileKey: string) {
    if (!fileKey) return
    
    loading.value = true
    error.value = null
    
    try {
      const url = `http://localhost:3000/storage/figma/fig_${fileKey}.json`
      console.log('📥 Cargando nodos desde:', url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`No se pudo cargar el archivo: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Recorrer el árbol de nodos y extraer id y name
      const nodes = new Map()
      
      function extractNodes(node: any) {
        if (node.id && node.name) {
          nodes.set(node.id, {
            name: node.name,
            type: node.type || 'unknown',
            componentId: node.componentId || null
          })
        }
        
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => extractNodes(child))
        }
      }
      
      // Recorrer desde el documento
      if (data.document) {
        extractNodes(data.document)
      }
      
      nodeCache.value = nodes
      console.log('✅ Nodos cargados:', nodes.size)
      
    } catch (err: any) {
      console.error('❌ Error cargando nodos:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  function getNodeInfo(nodeId: string) {
    return nodeCache.value.get(nodeId) || null
  }

  function getNodeName(nodeId: string) {
    const info = nodeCache.value.get(nodeId)
    return info?.name || nodeId || '—'
  }

  function getNodeType(nodeId: string) {
    const info = nodeCache.value.get(nodeId)
    return info?.type || '—'
  }

  return {
    nodeCache,
    loading,
    error,
    loadFigmaNodes,
    getNodeInfo,
    getNodeName,
    getNodeType
  }
}