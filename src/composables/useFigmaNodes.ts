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
  const BASE_STORAGE_URL = import.meta.env.VITE_STORAGE_URL 

  async function loadFigmaNodes(fileKey: string) {
    if (!fileKey) return
    
    loading.value = true
    error.value = null
    
    try {
      const url = `${BASE_STORAGE_URL}storage/figma/fig_${fileKey}.json`
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



  /**
   * Enriquece un nodeId crudo con el nombre y tipo del componente.
   *
   * @param rawNodeId - ID crudo del nodo (ej: "54:15")
   * @returns String enriquecido (ej: "Button (INSTANCE) [54:15]")
   *
   * Casos especiales:
   * - Si rawNodeId ya está enriquecido (contiene "["), se retorna como está
   * - Si no se encuentra en cache, se retorna el ID crudo
   * - Si rawNodeId es null/vacío, se retorna '—'
   */
  function enrichNodeId(rawNodeId: string | null | undefined): string {
    if (!rawNodeId) return '—'

    const cleanId = String(rawNodeId).trim()
    if (!cleanId) return '—'

    // Si ya está enriquecido, retornarlo tal cual
    if (cleanId.includes('[') && cleanId.includes(']')) {
      return cleanId
    }

    // Buscar en cache
    const info = nodeCache.value.get(cleanId)

    if (info && info.name) {
      const type = info.type && info.type !== 'unknown' ? info.type : 'NODE'
      return `${info.name} (${type}) [${cleanId}]`
    }

    // Fallback: solo el ID crudo
    return cleanId
  }

  /**
   * Extrae el ID crudo de un nodeId enriquecido.
   * Ej: "Button (INSTANCE) [54:15]" → "54:15"
   * Si no está enriquecido, retorna el string tal cual.
   */
  function extractRawNodeId(nodeId: string | null | undefined): string {
    if (!nodeId) return ''
    const match = String(nodeId).match(/\[([^\]]+)\]$/)
    return match ? match[1] : String(nodeId)
  }
  return {
    nodeCache,
    loading,
    error,
    loadFigmaNodes,
    getNodeInfo,
    getNodeName,
    getNodeType,
      enrichNodeId,          
         extractRawNodeId,
  }
}