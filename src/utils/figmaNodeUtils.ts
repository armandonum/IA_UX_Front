// utils/figmaNodeUtils.ts

export interface FigmaNode {
  id: string
  name: string
  type: string
  visible?: boolean
  children?: FigmaNode[]
  absoluteBoundingBox?: any
  [key: string]: any
}

export interface FigmaDocument {
  document: {
    children: FigmaNode[]
  }
}

/**
 * Busca un nodo por ID en el árbol de Figma
 */
export function findNodeById(node: FigmaNode, targetId: string): FigmaNode | null {
  if (node.id === targetId) {
    return node
  }
  
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, targetId)
      if (found) return found
    }
  }
  
  return null
}

/**
 * Obtiene el nombre de la pantalla (Frame) que contiene un nodo
 */
export function getScreenName(node: FigmaNode): string {
  // Buscar el primer FRAME o COMPONENT en la jerarquía
  let current: FigmaNode | null = node
  while (current) {
    if (current.type === 'FRAME' || current.type === 'COMPONENT' || current.type === 'INSTANCE') {
      return current.name
    }
    // Si no tiene padre, devolver el nombre del nodo actual
    if (!current.parent) break
    current = current.parent as FigmaNode
  }
  return node.name || 'Sin nombre'
}

/**
 * Obtiene la ruta completa de un nodo (para contexto)
 */
export function getNodePath(node: FigmaNode, targetId: string): string[] {
  const path: string[] = []
  let current: FigmaNode | null = node
  
  while (current) {
    if (current.id === targetId) {
      path.push(current.name)
      break
    }
    if (current.children) {
      for (const child of current.children) {
        const found = findNodeById(child, targetId)
        if (found) {
          path.push(current.name)
          current = found
          break
        }
      }
    }
    current = current.parent as FigmaNode || null
  }
  
  return path.reverse()
}

/**
 * Carga y parsea el archivo JSON de Figma
 */
export async function loadFigmaJson(fileKey: string): Promise<FigmaDocument | null> {
  try {
    const response = await fetch(`http://localhost:3000/storage/figma/fig_${fileKey}.json`)
    if (!response.ok) {
      console.warn(`No se pudo cargar el JSON de Figma: ${fileKey}`)
      return null
    }
    return await response.json()
  } catch (error) {
    console.error('Error cargando Figma JSON:', error)
    return null
  }
}

/**
 * Encuentra el nombre de un nodo por ID en el documento de Figma
 */
export function findNodeNameById(document: FigmaDocument, nodeId: string): string {
  if (!document?.document?.children) return nodeId
  
  for (const page of document.document.children) {
    const found = findNodeById(page, nodeId)
    if (found) {
      return found.name || nodeId
    }
  }
  
  return nodeId
}

/**
 * Encuentra el nombre de la pantalla (Frame) que contiene un nodo
 */
export function findScreenNameById(document: FigmaDocument, nodeId: string): string {
  if (!document?.document?.children || !nodeId) return 'Sin pantalla'
  
  for (const page of document.document.children) {
    const found = findNodeById(page, nodeId)
    if (found) {
      return getScreenName(found)
    }
  }
  
  return 'Sin pantalla'
}

/**
 * Obtiene información completa de un nodo
 */
export function getNodeInfo(document: FigmaDocument, nodeId: string): {
  nodeId: string
  nodeName: string
  screenName: string
  nodeType: string
} {
  if (!document?.document?.children || !nodeId) {
    return {
      nodeId: nodeId || 'N/A',
      nodeName: 'N/A',
      screenName: 'N/A',
      nodeType: 'N/A'
    }
  }
  
  for (const page of document.document.children) {
    const found = findNodeById(page, nodeId)
    if (found) {
      return {
        nodeId: found.id,
        nodeName: found.name || 'Sin nombre',
        screenName: getScreenName(found),
        nodeType: found.type || 'N/A'
      }
    }
  }
  
  return {
    nodeId: nodeId,
    nodeName: 'No encontrado',
    screenName: 'No encontrado',
    nodeType: 'N/A'
  }
}