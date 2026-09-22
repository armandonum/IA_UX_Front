// stores/coordinator/projects.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { figmaProjectsApi, figmaConnectionsApi } from '@/api/coordinator/figma.api'
import { semesterProjectsApi } from '@/api/semester-projects.api'
import { useAuthStore } from '@/stores/auth.store'
import { useSemesterStore } from '@/stores/semester.store'
import type { FigmaProject, FigmaConnection } from '@/types/coordinator/projects.types'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<FigmaProject[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()
  const semesterStore = useSemesterStore()

  // Obtener proyectos del creador (usuario autenticado)
  async function fetchProjectsByCreator() {
    loading.value = true
    error.value = null
    try {
      const userId = authStore.user?.user_id
      if (userId) {
        const response = await figmaProjectsApi.getByCreator(userId)
        projects.value = response.data
        console.log(`✅ Proyectos del usuario ${userId}:`, projects.value.length)
      } else {
        projects.value = []
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar proyectos'
      console.error('Error loading projects:', error.value)
    } finally {
      loading.value = false
    }
  }

  // Crear proyecto
  async function createProject(payload: {
    fileKey: string
    projectName: string
    lastModified: string
    version: string
    thumbnailUrl: string
    rawJson: any
    createdBy?: string
    semesterId?: string
  }) {
    loading.value = true
    try {
      console.log('📡 Creando proyecto con payload:', payload)

      // 1. Crear el proyecto
      const response = await figmaProjectsApi.create(payload)
      const newProject = response.data  // ✅ Acceder a .data
      console.log('✅ Proyecto creado:', newProject)

      // 2. Asignar al semestre si tiene semesterId
      if (payload.semesterId && newProject.projectId) {
        try {
          const assignResponse = await semesterProjectsApi.assign({
            semesterId: payload.semesterId,
            projectId: newProject.projectId
          })
          console.log(`✅ Proyecto ${newProject.projectId} asignado al semestre ${payload.semesterId}`)
          console.log('📌 Asignación:', assignResponse.data)
        } catch (assignError: any) {
          console.warn('Error asignando proyecto al semestre:', assignError.response?.data || assignError.message)
        }
      }

      projects.value.unshift(newProject)
      return newProject
    } catch (error: any) {
      console.error('❌ Error creating project:', error.response?.data || error.message)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Actualizar proyecto
  async function updateProject(projectId: string, data: Partial<FigmaProject>) {
    try {
      const response = await figmaProjectsApi.update(projectId, data)
      const updated = response.data  // ✅ Acceder a .data
      const idx = projects.value.findIndex(p => p.projectId === projectId)
      if (idx !== -1) projects.value[idx] = updated
      return updated
    } catch (error: any) {
      console.error('Error updating project:', error.response?.data || error.message)
      throw error
    }
  }

  // Eliminar proyecto
  async function deleteProject(projectId: string) {
    try {
      await figmaProjectsApi.delete(projectId)
      projects.value = projects.value.filter(p => p.projectId !== projectId)
    } catch (error: any) {
      console.error('Error deleting project:', error.response?.data || error.message)
      throw error
    }
  }

  // ✅ OBTENER conexión Figma del usuario
  async function getFigmaConnection(): Promise<FigmaConnection | null> {
    const userId = authStore.user?.user_id
    if (!userId) {
      console.warn('⚠️ No hay usuario autenticado')
      return null
    }

    try {
      const response = await figmaConnectionsApi.list(userId)
      const connections = response.data  // ✅ Acceder a .data
      return connections[0] || null
    } catch (error: any) {
      console.error('Error getting Figma connection:', error.response?.data || error.message)
      return null
    }
  }

  // ✅ GUARDAR conexión Figma
  async function saveFigmaConnection(name: string, personalAccessToken: string): Promise<FigmaConnection> {
    const userId = authStore.user?.user_id
    if (!userId) {
      throw new Error('Usuario no autenticado')
    }

    try {
      const response = await figmaConnectionsApi.create({
        userId,
        name,
        personalAccessToken
      })
      console.log('✅ Conexión Figma guardada:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error saving Figma connection:', error.response?.data || error.message)
      throw error
    }
  }

  // ✅ ACTUALIZAR conexión Figma
  async function updateFigmaConnection(connectionId: string, name: string, personalAccessToken: string): Promise<FigmaConnection> {
    try {
      const response = await figmaConnectionsApi.update(connectionId, {
        name,
        personalAccessToken
      })
      console.log('✅ Conexión Figma actualizada:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error updating Figma connection:', error.response?.data || error.message)
      throw error
    }
  }

  // ✅ ELIMINAR conexión Figma
  async function deleteFigmaConnection(connectionId: string): Promise<void> {
    try {
      await figmaConnectionsApi.delete(connectionId)
      console.log('✅ Conexión Figma eliminada')
    } catch (error: any) {
      console.error('Error deleting Figma connection:', error.response?.data || error.message)
      throw error
    }
  }

  return {
    projects,
    loading,
    error,
    fetchProjectsByCreator,
    createProject,
    updateProject,
    deleteProject,
    getFigmaConnection,
    saveFigmaConnection,
    updateFigmaConnection,
    deleteFigmaConnection
  }
})