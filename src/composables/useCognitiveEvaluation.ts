// composables/useCognitiveEvaluation.ts
import { ref, reactive, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useCognitiveApi } from './useCognitiveApi'

export const useCognitiveEvaluation = () => {
  const $q = useQuasar()
  const api = useCognitiveApi()

  // ============================================================
  // STATE
  // ============================================================
  const evaluations = ref<any[]>([])
  const currentEvaluation = ref<any>(null)
  const tasks = ref<any[]>([])
  const actions = ref<any[]>([])
  const rules = ref<any[]>([])
  const evaluators = ref<any[]>([])
  const responses = ref<any[]>([])
  const problems = ref<any[]>([])
  const recommendations = ref<any[]>([])
  const dashboard = ref<any>(null)

  const responseStats = ref<any>(null)
const problemSummary = ref<any>(null)

  const loading = ref(false)
  const selectedProjectId = ref<string | null>(null)
  const selectedEvaluationId = ref<string | null>(null)
  const selectedTaskId = ref<string | null>(null)
  const selectedTab = ref('dashboard')

  // ============================================================
  // COMPUTED
  // ============================================================
  const hasEvaluation = computed(() => currentEvaluation.value !== null)
  const isDraft = computed(() => currentEvaluation.value?.status === 'draft')
  const isPlanning = computed(() => currentEvaluation.value?.status === 'planning')
  const isInProgress = computed(() => currentEvaluation.value?.status === 'in_progress')
  const isCompleted = computed(() => currentEvaluation.value?.status === 'completed')
  const canEdit = computed(() => isDraft.value || isPlanning.value)
  const canStart = computed(() => isPlanning.value && evaluators.value.length > 0 && tasks.value.length > 0)
  const canComplete = computed(() => isInProgress.value && evaluators.value.every(e => e.hasCompleted))

  // ============================================================
  // METHODS - EVALUATIONS
  // ============================================================
  const loadEvaluations = async (projectId?: string) => {
    loading.value = true
    try {
      evaluations.value = await api.getEvaluations(projectId)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar evaluaciones' })
    } finally {
      loading.value = false
    }
  }

  const loadEvaluation = async (id: string) => {
    loading.value = true
    try {
      currentEvaluation.value = await api.getEvaluationById(id)
      console.log("el usuario asignado como supervisor es el :",currentEvaluation.value)
      selectedEvaluationId.value = id
      await loadAllData(id)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar evaluación' })
    } finally {
      loading.value = false
    }
  }

  const createEvaluation = async (payload: any) => {
    loading.value = true
    try {
      const result = await api.createEvaluation(payload)
      $q.notify({ type: 'positive', message: 'Evaluación creada exitosamente' })
      await loadEvaluations(payload.projectId)
      return result
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al crear evaluación' })
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateEvaluation = async (payload: any) => {
    loading.value = true
    try {
      const result = await api.updateEvaluation(currentEvaluation.value.cognitiveEvaluationId, payload)
      currentEvaluation.value = result
      $q.notify({ type: 'positive', message: 'Evaluación actualizada exitosamente' })
      return result
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al actualizar evaluación' })
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateStatus = async (status: string) => {
    loading.value = true
    try {
      const result = await api.updateEvaluationStatus(currentEvaluation.value.cognitiveEvaluationId, status)
      currentEvaluation.value = result
      $q.notify({ type: 'positive', message: `Estado actualizado a: ${status}` })
      return result
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al actualizar estado' })
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteEvaluation = async () => {
    loading.value = true
    try {
      await api.deleteEvaluation(currentEvaluation.value.cognitiveEvaluationId)
      $q.notify({ type: 'positive', message: 'Evaluación eliminada' })
      await loadEvaluations(currentEvaluation.value.projectId)
      currentEvaluation.value = null
      selectedEvaluationId.value = null
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al eliminar evaluación' })
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // METHODS - TASKS
  // ============================================================
  const loadTasks = async (evaluationId: string) => {
    try {
      tasks.value = await api.getTasks(evaluationId)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar tareas' })
    }
  }

  const createTasksBatch = async (payload: any) => {
    loading.value = true
    try {
      await api.createTasksBatch(payload)
      $q.notify({ type: 'positive', message: 'Tareas creadas exitosamente' })
      await loadTasks(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al crear tareas' })
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (id: string, payload: any) => {
    loading.value = true
    try {
      await api.updateTask(id, payload)
      $q.notify({ type: 'positive', message: 'Tarea actualizada' })
      await loadTasks(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al actualizar tarea' })
    } finally {
      loading.value = false
    }
  }

  const reorderTasks = async (taskIds: string[]) => {
    loading.value = true
    try {
      await api.reorderTasks(currentEvaluation.value.cognitiveEvaluationId, taskIds)
      $q.notify({ type: 'positive', message: 'Orden actualizado' })
      await loadTasks(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al reordenar tareas' })
    } finally {
      loading.value = false
    }
  }

  const deleteTask = async (id: string) => {
    loading.value = true
    try {
      await api.deleteTask(id)
      $q.notify({ type: 'positive', message: 'Tarea eliminada' })
      await loadTasks(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al eliminar tarea' })
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // METHODS - ACTIONS
  // ============================================================
  const loadActions = async (taskId: string) => {
    try {
      actions.value = await api.getActions(taskId)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar acciones' })
    }
  }

  const createActionsBatch = async (payload: any) => {
    loading.value = true
    try {
      await api.createActionsBatch(payload)
      $q.notify({ type: 'positive', message: 'Acciones creadas' })
      await loadActions(payload.taskId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al crear acciones' })
    } finally {
      loading.value = false
    }
  }

  const updateAction = async (id: string, payload: any) => {
    loading.value = true
    try {
      await api.updateAction(id, payload)
      $q.notify({ type: 'positive', message: 'Acción actualizada' })
      await loadActions(selectedTaskId.value!)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al actualizar acción' })
    } finally {
      loading.value = false
    }
  }

  const reorderActions = async (actionIds: string[]) => {
    loading.value = true
    try {
      await api.reorderActions(selectedTaskId.value!, actionIds)
      $q.notify({ type: 'positive', message: 'Orden de acciones actualizado' })
      await loadActions(selectedTaskId.value!)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al reordenar acciones' })
    } finally {
      loading.value = false
    }
  }

  const deleteAction = async (id: string) => {
    loading.value = true
    try {
      await api.deleteAction(id)
      $q.notify({ type: 'positive', message: 'Acción eliminada' })
      await loadActions(selectedTaskId.value!)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al eliminar acción' })
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // METHODS - RULES
  // ============================================================
  const loadRules = async (evaluationId: string) => {
    try {
      rules.value = await api.getRules(evaluationId)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar reglas' })
    }
  }

  const createRulesBatch = async (payload: any) => {
    loading.value = true
    try {
      await api.createRulesBatch(payload)
      $q.notify({ type: 'positive', message: 'Reglas creadas' })
      await loadRules(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al crear reglas' })
    } finally {
      loading.value = false
    }
  }

  const updateRule = async (id: string, payload: any) => {
    loading.value = true
    try {
      await api.updateRule(id, payload)
      $q.notify({ type: 'positive', message: 'Regla actualizada' })
      await loadRules(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al actualizar regla' })
    } finally {
      loading.value = false
    }
  }

  const deleteRule = async (id: string) => {
    loading.value = true
    try {
      await api.deleteRule(id)
      $q.notify({ type: 'positive', message: 'Regla eliminada' })
      await loadRules(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al eliminar regla' })
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // METHODS - EVALUATORS
  // ============================================================
  const loadEvaluators = async (evaluationId: string) => {
    try {
      evaluators.value = await api.getEvaluators(evaluationId)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar evaluadores' })
    }
  }

  const assignEvaluatorsBatch = async (payload: any) => {
    loading.value = true
    try {
      await api.assignEvaluatorsBatch(payload)
      $q.notify({ type: 'positive', message: 'Evaluadores asignados' })
      await loadEvaluators(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al asignar evaluadores' })
    } finally {
      loading.value = false
    }
  }

  const removeEvaluator = async (id: string) => {
    loading.value = true
    try {
      await api.removeEvaluator(id)
      $q.notify({ type: 'positive', message: 'Evaluador removido' })
      await loadEvaluators(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al remover evaluador' })
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // METHODS - RESPONSES
  // ============================================================
  const loadResponses = async (evaluationId: string) => {
    try {
      responses.value = await api.getResponses(evaluationId)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar respuestas' })
    }
  }

  const loadResponseSummary = async (evaluationId: string) => {
    try {
      return await api.getResponseSummary(evaluationId)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar resumen' })
      return null
    }
  }

  // ============================================================
  // METHODS - PROBLEMS
  // ============================================================
  const loadProblems = async (evaluationId: string) => {
    try {
      problems.value = await api.getProblems(evaluationId)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar problemas' })
    }
  }


  const loadProblemSummary = async (evaluationId: string) => {
  try {
    problemSummary.value = await api.getProblemSummary(evaluationId)
  } catch (error) {
    console.error('Error loading problem summary:', error)
  }
}

  const createProblem = async (payload: any) => {
    loading.value = true
    try {
      await api.createProblem(payload)
      $q.notify({ type: 'positive', message: 'Problema creado' })
      await loadProblems(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al crear problema' })
    } finally {
      loading.value = false
    }
  }

  const updateProblemStatus = async (id: string, status: string, notes?: string) => {
    loading.value = true
    try {
      await api.updateProblemStatus(id, status, notes)
      $q.notify({ type: 'positive', message: `Estado del problema actualizado a: ${status}` })
      await loadProblems(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al actualizar estado' })
    } finally {
      loading.value = false
    }
  }

  const unifyProblems = async (payload: any) => {
    loading.value = true
    try {
      await api.unifyProblems(payload)
      $q.notify({ type: 'positive', message: 'Problemas unificados exitosamente' })
      await loadProblems(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al unificar problemas' })
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // METHODS - RECOMMENDATIONS
  // ============================================================
  const loadRecommendations = async (evaluationId: string) => {
    try {
      recommendations.value = await api.getRecommendations(evaluationId)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar recomendaciones' })
    }
  }

  const createRecommendationsBatch = async (payload: any) => {
    loading.value = true
    try {
      await api.createRecommendationsBatch(payload)
      $q.notify({ type: 'positive', message: 'Recomendaciones creadas' })
      await loadRecommendations(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al crear recomendaciones' })
    } finally {
      loading.value = false
    }
  }

  const implementRecommendation = async (id: string, notes: string) => {
    loading.value = true
    try {
      await api.implementRecommendation(id, notes)
      $q.notify({ type: 'positive', message: 'Recomendación marcada como implementada' })
      await loadRecommendations(currentEvaluation.value.cognitiveEvaluationId)
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al implementar recomendación' })
    } finally {
      loading.value = false
    }
  }

  const loadResponseStats = async (evaluationId: string) => {
  try {
    responseStats.value = await api.getResponseStats(evaluationId)
  } catch (error) {
    console.error('Error loading response stats:', error)
  }
}
  // ============================================================
  // METHODS - DASHBOARD
  // ============================================================
  const loadDashboard = async (evaluationId: string) => {
    try {
      dashboard.value = await api.getDashboard(evaluationId)
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar dashboard' })
    }
  }

  // ============================================================
  // LOAD ALL DATA
  // ============================================================
  const loadAllData = async (evaluationId: string) => {
    await Promise.all([
      loadTasks(evaluationId),
      loadRules(evaluationId),
      loadEvaluators(evaluationId),
      loadResponses(evaluationId),
      loadProblems(evaluationId),
      loadRecommendations(evaluationId),
      loadDashboard(evaluationId),
       loadResponseStats(evaluationId),    
    loadProblemSummary(evaluationId),
    ])
  }

  // ============================================================
  // SELECT TASK
  // ============================================================
  const selectTask = async (taskId: string) => {
    selectedTaskId.value = taskId
    await loadActions(taskId)
  }

  // ============================================================
  // EXPORT REPORT
  // ============================================================
  const exportReport = async (evaluationId: string, format: 'pdf' | 'docx' = 'pdf') => {
    loading.value = true
    try {
      const blob = await api.exportReport(evaluationId, format)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-cognitivo-${evaluationId}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      $q.notify({ type: 'positive', message: 'Reporte descargado exitosamente' })
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.message || 'Error al exportar reporte' })
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    evaluations,
    currentEvaluation,
    tasks,
    actions,
    rules,
    evaluators,
    responses,
    problems,
    recommendations,
    dashboard,
    loading,
    selectedProjectId,
    selectedEvaluationId,
    selectedTaskId,
    selectedTab,
    // Computed
    hasEvaluation,
    isDraft,
    isPlanning,
    isInProgress,
    isCompleted,
    canEdit,
    canStart,
    canComplete,
    // Methods - Evaluations
    loadEvaluations,
    loadEvaluation,
    createEvaluation,
    updateEvaluation,
    updateStatus,
    deleteEvaluation,
    // Methods - Tasks
    loadTasks,
    createTasksBatch,
    updateTask,
    reorderTasks,
    deleteTask,
    // Methods - Actions
    loadActions,
    createActionsBatch,
    updateAction,
    reorderActions,
    deleteAction,
    // Methods - Rules
    loadRules,
    createRulesBatch,
    updateRule,
    deleteRule,
    // Methods - Evaluators
    loadEvaluators,
    assignEvaluatorsBatch,
    removeEvaluator,
    // Methods - Responses
    loadResponses,
    loadResponseSummary,
    // Methods - Problems
    loadProblems,
    loadProblemSummary,
    createProblem,
    updateProblemStatus,
    unifyProblems,
    // Methods - Recommendations
    loadRecommendations,
    createRecommendationsBatch,
    implementRecommendation,
    // Methods - Dashboard
    loadDashboard,
    // Methods - General
    loadAllData,
    selectTask,
    exportReport,
  }
}