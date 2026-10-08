// composables/docente/useProjectInfo.ts
import { ref } from 'vue'
import api from '@/api/axios'

export interface ProjectInfo {
  projectId: string
  fileKey: string
  projectName: string
  publicUrl?: string
  thumbnailUrl?: string
}

/**
 * Composable para cargar información de proyectos (URL pública, thumbnail, etc.)
 * con cache para evitar requests repetidos.
 */
export function useProjectInfo() {
  const projectsCache = ref<Map<string, ProjectInfo>>(new Map())
  const loading = ref(false)

  /**
   * Carga la info de un proyecto por su ID
   */
  async function loadProject(projectId: string): Promise<ProjectInfo | null> {
    if (!projectId) return null

    // Cache hit
    if (projectsCache.value.has(projectId)) {
      return projectsCache.value.get(projectId)!
    }

    try {
      const { data } = await api.get(`/figma-projects/${projectId}`)

      const info: ProjectInfo = {
        projectId: data.projectId,
        fileKey: data.fileKey,
        projectName: data.projectName,
        publicUrl: data.publicUrl ?? data.public_url ?? undefined,
        thumbnailUrl: data.thumbnailUrl,
      }

      projectsCache.value.set(projectId, info)
      return info
    } catch (error) {
      console.error('Error cargando proyecto:', projectId, error)
      return null
    }
  }

  /**
   * Carga varios proyectos en paralelo
   */
  async function loadProjects(projectIds: string[]): Promise<Map<string, ProjectInfo>> {
    loading.value = true
    try {
      const unique = [...new Set(projectIds)].filter(Boolean)
      await Promise.all(unique.map((id) => loadProject(id)))
      return projectsCache.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un proyecto del cache (o null)
   */
  function getProject(projectId: string): ProjectInfo | null {
    return projectsCache.value.get(projectId) || null
  }

  /**
   * Obtiene la URL pública de un proyecto del cache
   */
  function getPublicUrl(projectId: string): string | null {
    return projectsCache.value.get(projectId)?.publicUrl || null
  }

  /**
   * Obtiene el fileKey de un proyecto del cache
   */
  function getFileKey(projectId: string): string | null {
    return projectsCache.value.get(projectId)?.fileKey || null
  }

  /**
   * Limpia el cache
   */
  function clearCache() {
    projectsCache.value.clear()
  }

  return {
    projectsCache,
    loading,
    loadProject,
    loadProjects,
    getProject,
    getPublicUrl,
    getFileKey,
    clearCache,
  }
}