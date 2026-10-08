// composables/useProjectContext.ts
import { ref } from 'vue'
import api from '@/api/axios'

// ============================================================
// TIPOS
// ============================================================
export interface ProjectTask {
  taskId: string
  projectId: string
  requirementId: string
  title: string
  description: string
  orderIndex: number
}

export interface ProjectRequirement {
  requirementId: string
  projectId?: string
  semesterId?: string
  code: string
  title: string
  description?: string
}

export interface RequirementWithTasks {
  requirement: ProjectRequirement
  tasks: ProjectTask[]
}

/**
 * Composable que carga el contexto de un proyecto:
 * - Sus tareas
 * - Sus requerimientos
 * - Y los agrupa por requerimiento
 *
 * Cachea la info por projectId para evitar requests repetidos.
 */
export function useProjectContext() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cache por projectId
  const tasksByProject = ref<Map<string, ProjectTask[]>>(new Map())
  const requirementsByProject = ref<Map<string, ProjectRequirement[]>>(new Map())

  // Mapas auxiliares para búsquedas rápidas
  const taskById = ref<Map<string, ProjectTask>>(new Map())
  const requirementById = ref<Map<string, ProjectRequirement>>(new Map())

  // ============================================================
  // CARGA PRINCIPAL
  // ============================================================
  /**
   * Carga las tareas y requerimientos de un proyecto.
   * Si ya están cacheados, no hace nada.
   */
  async function loadProjectContext(projectId: string, force = false) {
    if (!projectId) return

    // Si ya tenemos cache y no forzamos, salir
    if (!force && tasksByProject.value.has(projectId)) {
      return
    }

    loading.value = true
    error.value = null

    try {
      // Cargar tareas y requerimientos en paralelo
      const [tasksRes, reqsRes] = await Promise.all([
        api.get<ProjectTask[]>(`/tasks/projectId/${projectId}`).catch(() => ({ data: [] })),
        api.get<ProjectRequirement[]>(`/project-requirements/project/${projectId}`).catch(() => ({ data: [] })),
      ])

      const tasks = tasksRes.data || []
      const requirements = reqsRes.data || []

      // Guardar en cache
      tasksByProject.value.set(projectId, tasks)
      requirementsByProject.value.set(projectId, requirements)

      // Actualizar mapas auxiliares
      for (const task of tasks) {
        taskById.value.set(task.taskId, task)
      }
      for (const req of requirements) {
        requirementById.value.set(req.requirementId, req)
      }
    } catch (e: any) {
      console.error('Error cargando contexto del proyecto:', e)
      error.value = e.message || 'Error al cargar datos del proyecto'
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================
  function getTasks(projectId: string): ProjectTask[] {
    return tasksByProject.value.get(projectId) || []
  }

  function getRequirements(projectId: string): ProjectRequirement[] {
    return requirementsByProject.value.get(projectId) || []
  }

  function getTask(taskId: string): ProjectTask | null {
    return taskById.value.get(taskId) || null
  }

  function getRequirement(requirementId: string): ProjectRequirement | null {
    return requirementById.value.get(requirementId) || null
  }

  /**
   * Obtiene el requerimiento asociado a una tarea
   */
  function getRequirementByTask(taskId: string): ProjectRequirement | null {
    const task = taskById.value.get(taskId)
    if (!task || !task.requirementId) return null
    return requirementById.value.get(task.requirementId) || null
  }

  /**
   * Obtiene el requerimiento asociado a una SESIÓN
   * (usando el taskId de la sesión)
   */
  function getRequirementBySession(sessionTaskId: string | null | undefined): ProjectRequirement | null {
    if (!sessionTaskId) return null
    return getRequirementByTask(sessionTaskId)
  }

  // ============================================================
  // AGRUPACIÓN
  // ============================================================
  /**
   * Agrupa las tareas de un proyecto por requerimiento
   */
  function getTasksGroupedByRequirement(projectId: string): RequirementWithTasks[] {
    const tasks = getTasks(projectId)
    const requirements = getRequirements(projectId)

    // Crear mapa de requerimiento → tareas
    const grouped = new Map<string, ProjectTask[]>()
    const orphanTasks: ProjectTask[] = [] // tareas sin requerimiento

    for (const task of tasks) {
      if (!task.requirementId) {
        orphanTasks.push(task)
        continue
      }
      if (!grouped.has(task.requirementId)) {
        grouped.set(task.requirementId, [])
      }
      grouped.get(task.requirementId)!.push(task)
    }

    // Construir el resultado
    const result: RequirementWithTasks[] = []

    // Requerimientos con sus tareas
    for (const req of requirements) {
      const reqTasks = grouped.get(req.requirementId) || []
      result.push({
        requirement: req,
        tasks: reqTasks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
      })
    }

    // Tareas huérfanas (sin requerimiento)
    if (orphanTasks.length > 0) {
      result.push({
        requirement: {
          requirementId: '__orphan__',
          code: 'SIN-REQ',
          title: 'Sin requerimiento asignado',
          description: 'Tareas que no tienen un requerimiento asociado',
        },
        tasks: orphanTasks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
      })
    }

    return result
  }

  // ============================================================
  // OPCIONES PARA DROPDOWNS
  // ============================================================
  /**
   * Opciones de requerimientos del proyecto con conteo de tareas
   */
  function getRequirementOptions(projectId: string) {
    const grouped = getTasksGroupedByRequirement(projectId)
    return grouped
      .filter((g) => g.requirement.requirementId !== '__orphan__')
      .map((g) => ({
        label: `${g.requirement.code} - ${g.requirement.title}`,
        value: g.requirement.requirementId,
        code: g.requirement.code,
        title: g.requirement.title,
        tasksCount: g.tasks.length,
      }))
  }

  /**
   * Opciones de tareas del proyecto.
   * Si se pasa `requirementId`, se filtran las tareas del requerimiento.
   */
  function getTaskOptions(projectId: string, requirementId?: string | null) {
    const tasks = getTasks(projectId)

    const filtered = requirementId
      ? tasks.filter((t) => t.requirementId === requirementId)
      : tasks

    return filtered
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      .map((t) => ({
        label: t.title,
        value: t.taskId,
        title: t.title,
        description: t.description,
        orderIndex: t.orderIndex,
      }))
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  function clearCache() {
    tasksByProject.value.clear()
    requirementsByProject.value.clear()
    taskById.value.clear()
    requirementById.value.clear()
  }

  function clearProject(projectId: string) {
    tasksByProject.value.delete(projectId)
    requirementsByProject.value.delete(projectId)
  }

  return {
    // State
    loading,
    error,

    // Load
    loadProjectContext,

    // Getters
    getTasks,
    getRequirements,
    getTask,
    getRequirement,
    getRequirementByTask,
    getRequirementBySession,

    // Agrupación
    getTasksGroupedByRequirement,

    // Opciones para dropdowns
    getRequirementOptions,
    getTaskOptions,

    // Utils
    clearCache,
    clearProject,
  }
}