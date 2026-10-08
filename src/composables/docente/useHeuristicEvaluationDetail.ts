// composables/docente/useHeuristicEvaluationDetail.ts
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import {
  heuristicApi,
  type HeuristicEvaluation,
  type HeuristicEvaluator,
  type HeuristicTask,
  type HeuristicObservation,
  type HeuristicPositiveAspect,
  type HeuristicTaskProgress,
  type HeuristicFinalResult,
  type HeuristicFramework,
  type HeuristicPrinciple,
} from '@/api/heuristic.api'

export function useHeuristicEvaluationDetail() {
  const $q = useQuasar()

  // ============================================================
  // STATE
  // ============================================================
  const evaluation = ref<HeuristicEvaluation | null>(null)
  const framework = ref<HeuristicFramework | null>(null)
  const principles = ref<HeuristicPrinciple[]>([])
  const evaluators = ref<HeuristicEvaluator[]>([])
  const tasks = ref<HeuristicTask[]>([])
  const progress = ref<HeuristicTaskProgress[]>([])
  const observations = ref<HeuristicObservation[]>([])
  const positiveAspects = ref<HeuristicPositiveAspect[]>([])
  const finalResults = ref<HeuristicFinalResult | null>(null)

  // Loading flags
  const loading = ref(false)
  const loadingEvaluators = ref(false)
  const loadingTasks = ref(false)
  const loadingProgress = ref(false)
  const loadingObservations = ref(false)
  const loadingPositiveAspects = ref(false)
  const loadingResults = ref(false)

  // ============================================================
  // COMPUTED
  // ============================================================
  const progressMatrix = computed(() => {
    // Cruzar evaluadores x tareas para obtener matriz de progreso
    const matrix: Record<string, Record<string, string>> = {}
    for (const ev of evaluators.value) {
      matrix[ev.id] = {}
      for (const task of tasks.value) {
        const p = progress.value.find(
          (pr) => pr.evaluatorId === ev.userId && pr.taskId === task.id,
        )
        matrix[ev.id][task.id] = p?.status || 'pending'
      }
    }
    return matrix
  })

  const stats = computed(() => {
    const totalTasks = tasks.value.length
    const totalEvaluators = evaluators.value.length
    const completedEvaluators = evaluators.value.filter(
      (e) => e.completedAt,
    ).length

    const observationsBySeverity = {
      critical: observations.value.filter((o) => o.severity >= 5).length,
      high: observations.value.filter((o) => o.severity === 4).length,
      medium: observations.value.filter((o) => o.severity === 3).length,
      low: observations.value.filter((o) => o.severity <= 2).length,
    }

    return {
      totalTasks,
      totalEvaluators,
      completedEvaluators,
      totalObservations: observations.value.length,
      totalPositiveAspects: positiveAspects.value.length,
      observationsBySeverity,
      progressPercent:
        totalEvaluators > 0
          ? Math.round((completedEvaluators / totalEvaluators) * 100)
          : 0,
    }
  })

  // ============================================================
  // LOAD
  // ============================================================
  async function fetchEvaluationDetail(evaluationId: string) {
    loading.value = true
    try {
      const { data } = await heuristicApi.getEvaluation(evaluationId)
      evaluation.value = data

      // Cargar framework + principios
      if (data.frameworkId) {
        const [fwRes, prRes] = await Promise.all([
          heuristicApi.getFramework(data.frameworkId),
          heuristicApi.getPrinciplesByFramework(data.frameworkId),
        ])
        framework.value = fwRes.data
        principles.value = prRes.data.filter((p) => p.isActive)
      }

      return data
    } catch (e: any) {
      console.error('Error cargando evaluación:', e)
      $q.notify({
        type: 'negative',
        message: 'No se pudo cargar la evaluación',
      })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchEvaluators(evaluationId: string) {
    loadingEvaluators.value = true
    try {
      const { data } = await heuristicApi.getEvaluatorsByEvaluation(evaluationId)
      evaluators.value = data
      return data
    } catch (e: any) {
      console.error('Error cargando evaluadores:', e)
      throw e
    } finally {
      loadingEvaluators.value = false
    }
  }

  async function fetchTasks(evaluationId: string) {
    loadingTasks.value = true
    try {
      const { data } = await heuristicApi.getTasksByEvaluation(evaluationId)
      tasks.value = [...data].sort((a, b) => a.orderIndex - b.orderIndex)
      return data
    } catch (e: any) {
      console.error('Error cargando tareas:', e)
      throw e
    } finally {
      loadingTasks.value = false
    }
  }

  async function fetchProgress(evaluationId: string) {
    loadingProgress.value = true
    try {
      const { data } = await heuristicApi.findProgressByEvaluation(evaluationId)
      progress.value = data
      return data
    } catch (e: any) {
      console.error('Error cargando progreso:', e)
      throw e
    } finally {
      loadingProgress.value = false
    }
  }

  async function fetchObservations(evaluationId: string) {
    loadingObservations.value = true
    try {
      const { data } = await heuristicApi.getObservationsByEvaluation(evaluationId)
      observations.value = data
      return data
    } catch (e: any) {
      console.error('Error cargando observaciones:', e)
      throw e
    } finally {
      loadingObservations.value = false
    }
  }

  async function fetchPositiveAspects(evaluationId: string) {
    loadingPositiveAspects.value = true
    try {
      const { data } = await heuristicApi.getPositiveAspectsByEvaluation(evaluationId)
      positiveAspects.value = data
      return data
    } catch (e: any) {
      console.error('Error cargando aspectos positivos:', e)
      throw e
    } finally {
      loadingPositiveAspects.value = false
    }
  }

  async function fetchFinalResults(evaluationId: string) {
    loadingResults.value = true
    try {
      const { data } = await heuristicApi.getFinalResultsByEvaluation(evaluationId)
      finalResults.value = data
      return data
    } catch (e: any) {
      // 404 es normal si aún no se han generado
      finalResults.value = null
      return null
    } finally {
      loadingResults.value = false
    }
  }

  // ============================================================
  // EVALUATORS
  // ============================================================
  async function addEvaluator(payload: {
    evaluationId: string
    userId: string
    role?: string
    notes?: string
  }) {
    try {
      const { data } = await heuristicApi.assignEvaluator(payload)
      evaluators.value.push(data)
      $q.notify({
        type: 'positive',
        message: 'Evaluador asignado',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      console.error('Error asignando evaluador:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo asignar el evaluador',
      })
      throw e
    }
  }

  async function updateEvaluator(
    id: string,
    payload: { role?: string; notes?: string },
  ) {
    try {
      const { data } = await heuristicApi.updateEvaluator(id, payload)
      const idx = evaluators.value.findIndex((e) => e.id === id)
      if (idx !== -1) evaluators.value[idx] = data
      $q.notify({
        type: 'positive',
        message: 'Evaluador actualizado',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo actualizar',
      })
      throw e
    }
  }

  async function markEvaluatorCompleted(id: string) {
    try {
      const { data } = await heuristicApi.markEvaluatorCompleted(id)
      const idx = evaluators.value.findIndex((e) => e.id === id)
      if (idx !== -1) evaluators.value[idx] = data
      $q.notify({
        type: 'positive',
        message: 'Evaluador marcado como completado',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo completar',
      })
      throw e
    }
  }

  async function removeEvaluator(id: string) {
    try {
      await heuristicApi.deleteEvaluator(id)
      evaluators.value = evaluators.value.filter((e) => e.id !== id)
      $q.notify({
        type: 'positive',
        message: 'Evaluador removido',
        icon: 'check_circle',
      })
      return true
    } catch (e: any) {
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo remover',
      })
      throw e
    }
  }

  // ============================================================
  // TASKS
  // ============================================================
  async function createTask(payload: Partial<HeuristicTask>) {
    try {
      const { data } = await heuristicApi.createTask(payload)
      tasks.value.push(data)
      tasks.value.sort((a, b) => a.orderIndex - b.orderIndex)
      $q.notify({
        type: 'positive',
        message: 'Tarea creada',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo crear la tarea',
      })
      throw e
    }
  }

  async function updateTask(id: string, payload: Partial<HeuristicTask>) {
    try {
      const { data } = await heuristicApi.updateTask(id, payload)
      const idx = tasks.value.findIndex((t) => t.id === id)
      if (idx !== -1) tasks.value[idx] = data
      $q.notify({
        type: 'positive',
        message: 'Tarea actualizada',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo actualizar',
      })
      throw e
    }
  }

  async function removeTask(id: string) {
    try {
      await heuristicApi.deleteTask(id)
      tasks.value = tasks.value.filter((t) => t.id !== id)
      $q.notify({
        type: 'positive',
        message: 'Tarea eliminada',
        icon: 'check_circle',
      })
      return true
    } catch (e: any) {
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo eliminar',
      })
      throw e
    }
  }

  // ============================================================
  // FINAL RESULTS
  // ============================================================
  async function generateFinalResults(evaluationId: string) {
    try {
      const { data } = await heuristicApi.generateFinalResults({
        evaluationId,
        totalEvaluators: evaluators.value.length,
        completedEvaluators: evaluators.value.filter((e) => e.completedAt).length,
      })
      finalResults.value = data
      $q.notify({
        type: 'positive',
        message: 'Resultados generados',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudieron generar',
      })
      throw e
    }
  }

  async function recalculateFinalResults(evaluationId: string) {
    try {
      const { data } = await heuristicApi.recalculateFinalResults(evaluationId)
      finalResults.value = data
      $q.notify({
        type: 'positive',
        message: 'Resultados recalculados',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudieron recalcular',
      })
      throw e
    }
  }

  return {
    // State
    evaluation,
    framework,
    principles,
    evaluators,
    tasks,
    progress,
    observations,
    positiveAspects,
    finalResults,

    // Loading
    loading,
    loadingEvaluators,
    loadingTasks,
    loadingProgress,
    loadingObservations,
    loadingPositiveAspects,
    loadingResults,

    // Computed
    progressMatrix,
    stats,

    // Load
    fetchEvaluationDetail,
    fetchEvaluators,
    fetchTasks,
    fetchProgress,
    fetchObservations,
    fetchPositiveAspects,
    fetchFinalResults,

    // Actions - Evaluators
    addEvaluator,
    updateEvaluator,
    markEvaluatorCompleted,
    removeEvaluator,

    // Actions - Tasks
    createTask,
    updateTask,
    removeTask,

    // Actions - Results
    generateFinalResults,
    recalculateFinalResults,
  }
}