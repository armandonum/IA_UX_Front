//composables/useFigmaProjects
import { ref } from 'vue'
import type { FigmaProject } from '@/types/figmaProject'

// Ajusta esta ruta si tu endpoint real de listado de proyectos tiene otro nombre.
const FIGMA_PROJECTS_ENDPOINT = '/api/figma-projects'

export function useFigmaProjects() {
  const projects = ref<FigmaProject[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProjects() {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(FIGMA_PROJECTS_ENDPOINT)
      if (!res.ok) throw new Error('No se pudieron cargar los proyectos')

      const data = await res.json()
      projects.value = Array.isArray(data) ? data : []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconocido al cargar proyectos'
      projects.value = []
    } finally {
      loading.value = false
    }
  }

  return { projects, loading, error, fetchProjects }
}