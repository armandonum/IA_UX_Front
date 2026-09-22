import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth.store'
import { heuristicApi } from '@/api/heuristic.api'
import type {
  HeuristicFramework,
  HeuristicPrinciple,
  HeuristicEvaluation,
  HeuristicEvaluator,
  HeuristicTask,
  HeuristicObservation,
  HeuristicPositiveAspect,
  HeuristicRating,
  HeuristicFinalResult,
} from '@/api/heuristic.api'

export function useHeuristicCoordinator() {
  const $q = useQuasar()
  const auth = useAuthStore()

  // ============================================================
  // ESTADO
  // ============================================================
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Selección actual
  const selectedProjectId = ref<string | null>(null)
  const selectedEvaluationId = ref<string | null>(null)
  const selectedTab = ref('dashboard')

  // Datos
  const evaluations = ref<HeuristicEvaluation[]>([])
  const currentEvaluation = ref<HeuristicEvaluation | null>(null)
  const frameworks = ref<HeuristicFramework[]>([])
  const currentFramework = ref<HeuristicFramework | null>(null)
  const principles = ref<HeuristicPrinciple[]>([])
  const evaluators = ref<HeuristicEvaluator[]>([])
  const tasks = ref<HeuristicTask[]>([])
  const observations = ref<HeuristicObservation[]>([])
  const positiveAspects = ref<HeuristicPositiveAspect[]>([])
  const ratings = ref<HeuristicRating[]>([])
  const finalResults = ref<HeuristicFinalResult | null>(null)

  // ============================================================
  // COMPUTED
  // ============================================================
  const hasEvaluation = computed(() => !!currentEvaluation.value)
  const isDraft = computed(() => currentEvaluation.value?.status === 'draft')
  const isPlanning = computed(() => currentEvaluation.value?.status === 'planning')
  const isInProgress = computed(() => currentEvaluation.value?.status === 'in_progress')
  const isCompleted = computed(() => currentEvaluation.value?.status === 'completed')

  const canEdit = computed(() =>
    isDraft.value || isPlanning.value,
  )
  const canStart = computed(() =>
    (isDraft.value || isPlanning.value) && tasks.value.length > 0 && evaluators.value.length > 0,
  )
  const canComplete = computed(() => isInProgress.value)

  const completedEvaluators = computed(() =>
    evaluators.value.filter(e => e.completedAt !== null).length,
  )
  const totalEvaluators = computed(() => evaluators.value.length)

  const evaluationProgress = computed(() => {
    if (totalEvaluators.value === 0) return 0
    return Math.round((completedEvaluators.value / totalEvaluators.value) * 100)
  })

  // ============================================================
  // FRAMEWORKS
  // ============================================================
  async function loadFrameworks() {
    try {
      const { data } = await heuristicApi.getFrameworks()
      frameworks.value = data
    } catch (e: any) {
      error.value = e.message
      $q.notify({ type: 'negative', message: 'Error al cargar frameworks' })
    }
  }

  // ============================================================
  // PRINCIPIOS
  // ============================================================
  async function loadPrinciplesByFramework(frameworkId: string) {
    try {
      const { data } = await heuristicApi.getPrinciplesByFramework(frameworkId)
      principles.value = data
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al cargar principios' })
    }
  }

  // ============================================================
  // EVALUACIONES
  // ============================================================
  async function loadEvaluationsByProject(projectId: string) {
    loading.value = true
    try {
      const { data } = await heuristicApi.getEvaluationsByProject(projectId)
      evaluations.value = data
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al cargar evaluaciones' })
    } finally {
      loading.value = false
    }
  }

  async function loadEvaluation(evaluationId: string) {
    loading.value = true
    try {
      const { data } = await heuristicApi.getEvaluation(evaluationId)
      currentEvaluation.value = data
      selectedEvaluationId.value = evaluationId

      // Cargar framework
      const fwRes = await heuristicApi.getFramework(data.frameworkId)
      currentFramework.value = fwRes.data

      // Cargar principios
      await loadPrinciplesByFramework(data.frameworkId)

      // Cargar evaluadores
      await loadEvaluators(evaluationId)

      // Cargar tareas
      await loadTasks(evaluationId)

      // Cargar observaciones
      await loadObservations(evaluationId)

      // Cargar aspectos positivos
      await loadPositiveAspects(evaluationId)

      // Cargar calificaciones
      await loadRatings(evaluationId)

      // Cargar resultados finales (si existen)
      await loadFinalResults(evaluationId)
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al cargar evaluación' })
    } finally {
      loading.value = false
    }
  }

  async function createEvaluation(data: {
    projectId: string
    frameworkId: string
    name: string
    description?: string
    systemDescription?: string
    targetUserDescription?: string
    maxDurationMinutes?: number
  }) {
    if (!auth.user?.user_id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      const { data: created } = await heuristicApi.createEvaluation({
        ...data,
        supervisorId: auth.user.user_id, // 🔥 El supervisor es siempre el creador
      })

      evaluations.value.push(created)
      $q.notify({ type: 'positive', message: 'Evaluación creada exitosamente' })
      return created
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al crear evaluación' })
      throw e
    }
  }

  async function updateEvaluation(evaluationId: string, data: Partial<HeuristicEvaluation>) {
    try {
      const { data: updated } = await heuristicApi.updateEvaluation(evaluationId, data)
      currentEvaluation.value = updated
      const idx = evaluations.value.findIndex(e => e.evaluationId === evaluationId)
      if (idx !== -1) evaluations.value[idx] = updated
      $q.notify({ type: 'positive', message: 'Evaluación actualizada' })
      return updated
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al actualizar' })
      throw e
    }
  }

  async function updateEvaluationStatus(evaluationId: string, status: string) {
    try {
      const { data } = await heuristicApi.updateEvaluationStatus(evaluationId, status)
      currentEvaluation.value = data
      $q.notify({ type: 'positive', message: `Estado cambiado a ${status}` })
      return data
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al cambiar estado' })
      throw e
    }
  }

  async function deleteEvaluation(evaluationId: string) {
    try {
      await heuristicApi.deleteEvaluation(evaluationId)
      evaluations.value = evaluations.value.filter(e => e.evaluationId !== evaluationId)
      if (currentEvaluation.value?.evaluationId === evaluationId) {
        currentEvaluation.value = null
      }
      $q.notify({ type: 'positive', message: 'Evaluación eliminada' })
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al eliminar' })
      throw e
    }
  }

  // ============================================================
  // EVALUADORES
  // ============================================================
  async function loadEvaluators(evaluationId: string) {
    try {
      const { data } = await heuristicApi.getEvaluatorsByEvaluation(evaluationId)
      evaluators.value = data
    } catch (e: any) {
      console.error('Error al cargar evaluadores:', e)
    }
  }

  async function assignEvaluators(evaluationId: string, userIds: string[]) {
    try {
      for (const userId of userIds) {
        await heuristicApi.assignEvaluator({
          evaluationId,
          userId,
          role: 'evaluator',
        })
      }
      await loadEvaluators(evaluationId)
      $q.notify({ type: 'positive', message: `${userIds.length} evaluador(es) asignado(s)` })
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al asignar evaluadores' })
      throw e
    }
  }

  async function removeEvaluator(evaluatorId: string) {
    try {
      await heuristicApi.deleteEvaluator(evaluatorId)
      evaluators.value = evaluators.value.filter(e => e.id !== evaluatorId)
      $q.notify({ type: 'info', message: 'Evaluador removido' })
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al remover' })
      throw e
    }
  }

  // ============================================================
  // TAREAS
  // ============================================================
  async function loadTasks(evaluationId: string) {
    try {
      const { data } = await heuristicApi.getTasksByEvaluation(evaluationId)
      tasks.value = data
    } catch (e: any) {
      console.error('Error al cargar tareas:', e)
    }
  }

  async function addTasksFromProject(evaluationId: string, projectTasks: any[]) {
    try {
      let orderIndex = tasks.value.length + 1
      for (const projectTask of projectTasks) {
        await heuristicApi.createTask({
          evaluationId,
          projectTaskId: projectTask.taskId,
          title: projectTask.title,
          description: projectTask.description || '',
          userGoal: projectTask.userGoal || `El usuario debe ${projectTask.title}`,
          orderIndex: orderIndex++,
        })
      }
      await loadTasks(evaluationId)
      $q.notify({ type: 'positive', message: `${projectTasks.length} tarea(s) agregada(s)` })
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al agregar tareas' })
      throw e
    }
  }

  async function deleteTask(taskId: string) {
    try {
      await heuristicApi.deleteTask(taskId)
      tasks.value = tasks.value.filter(t => t.id !== taskId)
      $q.notify({ type: 'info', message: 'Tarea eliminada' })
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al eliminar' })
      throw e
    }
  }

  // ============================================================
  // OBSERVACIONES (solo lectura para coordinador)
  // ============================================================
  async function loadObservations(evaluationId: string) {
    try {
      const { data } = await heuristicApi.getObservationsByEvaluation(evaluationId)
      observations.value = data
    } catch (e: any) {
      console.error('Error al cargar observaciones:', e)
    }
  }

  // ============================================================
  // ASPECTOS POSITIVOS
  // ============================================================
  async function loadPositiveAspects(evaluationId: string) {
    try {
      const { data } = await heuristicApi.getPositiveAspectsByEvaluation(evaluationId)
      positiveAspects.value = data
    } catch (e: any) {
      console.error('Error al cargar aspectos positivos:', e)
    }
  }

  // ============================================================
  // CALIFICACIONES
  // ============================================================
  async function loadRatings(evaluationId: string) {
    try {
      const { data } = await heuristicApi.getRatingsByEvaluation(evaluationId)
      ratings.value = data
    } catch (e: any) {
      console.error('Error al cargar calificaciones:', e)
    }
  }

  // ============================================================
  // RESULTADOS FINALES
  // ============================================================
  async function loadFinalResults(evaluationId: string) {
    try {
      const { data } = await heuristicApi.getFinalResultsByEvaluation(evaluationId)
      finalResults.value = data
    } catch (e: any) {
      // No hay resultados aún, no es error
      finalResults.value = null
    }
  }

  async function generateFinalResults(evaluationId: string) {
    loading.value = true
    try {
      const { data } = await heuristicApi.generateFinalResults({
        evaluationId,
        totalEvaluators: totalEvaluators.value,
        completedEvaluators: completedEvaluators.value,
      })
      finalResults.value = data
      $q.notify({ type: 'positive', message: 'Resultados finales generados' })
      return data
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al generar resultados' })
      throw e
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // CARGA MASIVA
  // ============================================================
  async function loadAllData(evaluationId: string) {
    await Promise.all([
      loadEvaluators(evaluationId),
      loadTasks(evaluationId),
      loadObservations(evaluationId),
      loadPositiveAspects(evaluationId),
      loadRatings(evaluationId),
      loadFinalResults(evaluationId),
    ])
  }

  // ============================================================
  // RESET
  // ============================================================
  function reset() {
    selectedEvaluationId.value = null
    currentEvaluation.value = null
    currentFramework.value = null
    principles.value = []
    evaluators.value = []
    tasks.value = []
    observations.value = []
    positiveAspects.value = []
    ratings.value = []
    finalResults.value = null
  }

  return {
    // Estado
    loading,
    error,
    selectedProjectId,
    selectedEvaluationId,
    selectedTab,
    evaluations,
    currentEvaluation,
    frameworks,
    currentFramework,
    principles,
    evaluators,
    tasks,
    observations,
    positiveAspects,
    ratings,
    finalResults,

    // Computed
    hasEvaluation,
    isDraft,
    isPlanning,
    isInProgress,
    isCompleted,
    canEdit,
    canStart,
    canComplete,
    completedEvaluators,
    totalEvaluators,
    evaluationProgress,

    // Métodos
    loadFrameworks,
    loadPrinciplesByFramework,
    loadEvaluationsByProject,
    loadEvaluation,
    createEvaluation,
    updateEvaluation,
    updateEvaluationStatus,
    deleteEvaluation,
    loadEvaluators,
    assignEvaluators,
    removeEvaluator,
    loadTasks,
    addTasksFromProject,
    deleteTask,
    loadObservations,
    loadPositiveAspects,
    loadRatings,
    loadFinalResults,
    generateFinalResults,
    loadAllData,
    reset,
  }
}