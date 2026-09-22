// composables/expert/useHeuristicExpert.ts
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth.store'
import { heuristicApi } from '@/api/heuristic.api'
import type {
  HeuristicEvaluation,
  HeuristicTask,
  HeuristicPrinciple,
  HeuristicObservation,
  HeuristicPositiveAspect,
  HeuristicRating,
  HeuristicFramework,
  HeuristicTaskProgress,
} from '@/api/heuristic.api'

export function useHeuristicExpert() {
  const $q = useQuasar()
  const auth = useAuthStore()

  // ============================================================
  // ESTADO
  // ============================================================
  const loading = ref(false)
  const error = ref<string | null>(null)

  const myEvaluations = ref<HeuristicEvaluation[]>([])
  const currentEvaluation = ref<HeuristicEvaluation | null>(null)
  const currentFramework = ref<HeuristicFramework | null>(null)
  const principles = ref<HeuristicPrinciple[]>([])
  const tasks = ref<HeuristicTask[]>([])
  const observations = ref<HeuristicObservation[]>([])
  const positiveAspects = ref<HeuristicPositiveAspect[]>([])
  const ratings = ref<HeuristicRating[]>([])

  // 🔥 NUEVO: Progreso por evaluador
  const myProgress = ref<HeuristicTaskProgress[]>([])
  const myEvaluatorId = ref<string | null>(null)

  const currentTaskId = ref<string | null>(null)
  const currentTaskTitle = ref<string | null>(null)

  // ============================================================
  // COMPUTED
  // ============================================================
  const authUserId = computed(() => auth.user?.user_id || '')

  /**
   * 🔥 Tareas con MI estado (no el global)
   * Cada evaluador ve su propio progreso
   */
  const tasksWithMyStatus = computed(() => {
    return tasks.value.map(task => {
      const progress = myProgress.value.find(p => p.taskId === task.id)
      const myStatus = progress?.status || 'pending'

      return {
        ...task,
        myStatus,
        reviewed: myStatus === 'completed',
        inProgress: myStatus === 'in_progress',
        startedAt: progress?.startedAt || null,
        completedAt: progress?.completedAt || null,
      }
    })
  })

  /**
   * Tareas pendientes SEGÚN MI PROGRESO
   */
  const myTasksPending = computed(() =>
    tasksWithMyStatus.value.filter(t => t.myStatus !== 'completed').length,
  )

  /**
   * ¿Completé todas las tareas?
   */
  const allMyTasksCompleted = computed(() => myTasksPending.value === 0)

  /**
   * Progreso porcentual (basado en MI progreso)
   */
  const myProgressPercentage = computed(() => {
    if (tasks.value.length === 0) return 0
    const completed = tasksWithMyStatus.value.filter(
      t => t.myStatus === 'completed',
    ).length
    return Math.round((completed / tasks.value.length) * 100)
  })

  // ============================================================
  // CARGAR MIS EVALUACIONES ASIGNADAS
  // ============================================================
  async function loadMyEvaluations() {
    loading.value = true
    error.value = null

    try {
      const userId = authUserId.value
      if (!userId) throw new Error('Usuario no autenticado')

      const { data: allEvaluations } = await heuristicApi.getEvaluations()

      const assigned: HeuristicEvaluation[] = []

      for (const evaluation of allEvaluations) {
        try {
          const { data: evaluators } = await heuristicApi.getEvaluatorsByEvaluation(
            evaluation.evaluationId,
          )
          const isAssigned = evaluators.some(e => e.userId === userId)
          if (isAssigned) {
            assigned.push(evaluation)
          }
        } catch (e) {
          console.warn(`Error al verificar evaluadores de ${evaluation.evaluationId}`, e)
        }
      }

      myEvaluations.value = assigned.filter(
        e => e.status !== 'archived' && e.status !== 'draft',
      )
    } catch (e: any) {
      error.value = e.message || 'Error al cargar evaluaciones'
      $q.notify({ type: 'negative', message: error.value })
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // CARGAR DETALLE DE UNA EVALUACIÓN
  // ============================================================
  async function selectEvaluation(evaluationId: string) {
    loading.value = true
    error.value = null

    try {
      // 1. Cargar evaluación
      const { data: evaluation } = await heuristicApi.getEvaluation(evaluationId)
      currentEvaluation.value = evaluation

      // 2. Cargar framework
      const { data: framework } = await heuristicApi.getFramework(evaluation.frameworkId)
      currentFramework.value = framework

      // 3. Cargar principios del framework (DINÁMICO)
      const { data: principlesData } = await heuristicApi.getPrinciplesByFramework(
        evaluation.frameworkId,
      )
      principles.value = principlesData

      // 4. Cargar tareas
      const { data: tasksData } = await heuristicApi.getTasksByEvaluation(evaluationId)
      tasks.value = tasksData

      // 5. 🔥 Obtener MI evaluatorId y cargar MI progreso
      await loadMyEvaluatorAndProgress(evaluationId)

      // 6. Cargar observaciones existentes (solo las mías)
      const { data: obsData } = await heuristicApi.getObservationsByEvaluation(evaluationId)
      observations.value = obsData.filter(o => o.evaluatorId === authUserId.value)

      // 7. Cargar aspectos positivos (solo los míos)
      const { data: posData } = await heuristicApi.getPositiveAspectsByEvaluation(evaluationId)
      positiveAspects.value = posData.filter(a => a.evaluatorId === authUserId.value)

      // 8. Cargar calificaciones (solo las mías)
      const { data: ratingsData } = await heuristicApi.getRatingsByEvaluation(evaluationId)
      ratings.value = ratingsData.filter(r => r.evaluatorId === authUserId.value)
    } catch (e: any) {
      error.value = e.message || 'Error al cargar evaluación'
      $q.notify({ type: 'negative', message: error.value })
      console.error(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // 🔥 CARGAR MI EVALUATOR ID Y MI PROGRESO
  // ============================================================
  async function loadMyEvaluatorAndProgress(evaluationId: string) {
    try {
      // 1. Obtener mi evaluator ID
      const { data: evaluators } = await heuristicApi.getEvaluatorsByEvaluation(evaluationId)
      const me = evaluators.find(e => e.userId === authUserId.value)

      if (!me) {
        throw new Error('No estás asignado a esta evaluación')
      }

      myEvaluatorId.value = me.id

      // 2. Cargar mi progreso en esta evaluación
      const { data: progress } = await heuristicApi.findMyProgress(
        evaluationId,
        me.id,
      )
      myProgress.value = progress
    } catch (e: any) {
      console.warn('Error al cargar mi progreso:', e)
      myProgress.value = []
      myEvaluatorId.value = null
    }
  }

  // ============================================================
  // SELECCIONAR TAREA (marcar como in_progress)
  // ============================================================
  async function selectTask(task: HeuristicTask) {
    currentTaskId.value = task.id
    currentTaskTitle.value = task.title

    // Si no está completada, marcarla como in_progress
    const progress = myProgress.value.find(p => p.taskId === task.id)

    if (!progress || progress.status === 'pending') {
      try {
        await upsertMyProgress(task.id, 'in_progress')
      } catch (e) {
        console.warn('No se pudo marcar in_progress:', e)
      }
    }
  }

  function clearTask() {
    currentTaskId.value = null
    currentTaskTitle.value = null
  }

  // ============================================================
  // 🔥 UPSERT MI PROGRESO (crear o actualizar)
  // ============================================================
  async function upsertMyProgress(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  sessionId: string | null = null,  // 🔥 NUEVO: parámetro opcional
): Promise<HeuristicTaskProgress | null> {
  if (!currentEvaluation.value || !myEvaluatorId.value) {
    throw new Error('No hay evaluación o evaluador seleccionado')
  }

  try {
    const { data } = await heuristicApi.upsertTaskProgress({
      evaluatorId: myEvaluatorId.value,
      taskId,
      evaluationId: currentEvaluation.value.evaluationId,
      sessionId: sessionId ?? null,  // 🔥 AHORA SÍ se envía
      status,
    })

    // Actualizar estado local
    const idx = myProgress.value.findIndex(p => p.taskId === taskId)
    if (idx !== -1) {
      myProgress.value[idx] = data
    } else {
      myProgress.value.push(data)
    }

    return data
  } catch (e: any) {
    console.error('Error al actualizar progreso:', e)
    throw e
  }
}
  // ============================================================
  // 🔥 MARCAR TAREA COMPLETADA (solo MI progreso)
  // ============================================================
  async function markTaskCompleted(taskId: string, sessionId?: string | null,) {
    if (!currentEvaluation.value || !myEvaluatorId.value) {
      $q.notify({ type: 'warning', message: 'No hay sesión activa' })
      return
    }

    loading.value = true
    try {
       await upsertMyProgress(taskId, 'completed', sessionId ?? null)
      $q.notify({ type: 'positive', message: '✅ Tarea completada' })
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al completar tarea' })
      throw e
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // AGREGAR OBSERVACIÓN
  // ============================================================
  async function addObservation(data: {
    sessionId: string
    principleId: string
    description: string
    severity: number
    frequency: string
    recommendation?: string | null
    nodeId?: string | null
    screenIdentifier?: string | null
  }) {
    if (!currentEvaluation.value) {
      throw new Error('No hay evaluación seleccionada')
    }

    loading.value = true
    try {
      const { data: created } = await heuristicApi.createObservation({
        sessionId: data.sessionId,
        evaluationId: currentEvaluation.value.evaluationId,
        evaluatorId: authUserId.value,
        taskId: currentTaskId.value,
        principleId: data.principleId,
        description: data.description,
        severity: data.severity,
        frequency: data.frequency,
        recommendation: data.recommendation ?? null,
        nodeId: data.nodeId ?? null,
        screenIdentifier: data.screenIdentifier ?? null,
      })

      observations.value.push(created)
      return created
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al guardar observación' })
      throw e
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // ELIMINAR OBSERVACIÓN
  // ============================================================
  async function deleteObservation(observationId: string) {
    loading.value = true
    try {
      await heuristicApi.deleteObservation(observationId)
      observations.value = observations.value.filter(
        o => o.observationId !== observationId,
      )
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al eliminar observación' })
      throw e
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // AGREGAR ASPECTO POSITIVO
  // ============================================================
  async function addPositiveAspect(data: {
    sessionId: string
    description: string
  }) {
    if (!currentEvaluation.value) {
      throw new Error('No hay evaluación seleccionada')
    }

    loading.value = true
    try {
      const { data: created } = await heuristicApi.createPositiveAspect({
        sessionId: data.sessionId,
        evaluationId: currentEvaluation.value.evaluationId,
        evaluatorId: authUserId.value,
        taskId: currentTaskId.value,
        description: data.description,
      })

      positiveAspects.value.push(created)
      return created
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al guardar aspecto positivo' })
      throw e
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // ELIMINAR ASPECTO POSITIVO
  // ============================================================
  async function deletePositiveAspect(aspectId: string) {
    loading.value = true
    try {
      await heuristicApi.deletePositiveAspect(aspectId)
      positiveAspects.value = positiveAspects.value.filter(
        a => a.aspectId !== aspectId,
      )
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al eliminar aspecto' })
      throw e
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // AGREGAR CALIFICACIÓN
  // ============================================================
  async function addRating(data: {
    sessionId: string
    problemId: string
    severity: number
    frequency: number
  }) {
    if (!currentEvaluation.value) {
      throw new Error('No hay evaluación seleccionada')
    }

    loading.value = true
    try {
      const { data: created } = await heuristicApi.createRating({
        evaluationId: currentEvaluation.value.evaluationId,
        sessionId: data.sessionId,
        evaluatorId: authUserId.value,
        problemId: data.problemId,
        severity: data.severity,
        frequency: data.frequency,
      })

      ratings.value.push(created)
      return created
    } catch (e: any) {
      $q.notify({ type: 'negative', message: 'Error al guardar calificación' })
      throw e
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // MARCAR EVALUADOR COMPLETADO
  // ============================================================
  async function markEvaluatorCompleted() {
    if (!currentEvaluation.value) return

    try {
      const { data: evaluators } = await heuristicApi.getEvaluatorsByEvaluation(
        currentEvaluation.value.evaluationId,
      )
      const me = evaluators.find(e => e.userId === authUserId.value)
      if (me && !me.completedAt) {
        await heuristicApi.markEvaluatorCompleted(me.id)
      }
    } catch (e) {
      console.warn('Error al marcar evaluador completado', e)
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function getPrincipleCode(principleId: string): string {
    return principles.value.find(p => p.principleId === principleId)?.code || '—'
  }

  function getPrincipleName(principleId: string): string {
    return principles.value.find(p => p.principleId === principleId)?.name || '—'
  }

  // ============================================================
  // RESET
  // ============================================================
  function reset() {
    currentEvaluation.value = null
    currentFramework.value = null
    principles.value = []
    tasks.value = []
    observations.value = []
    positiveAspects.value = []
    ratings.value = []
    myProgress.value = []
    myEvaluatorId.value = null
    currentTaskId.value = null
    currentTaskTitle.value = null
    error.value = null
  }

  return {
    // Estado
    loading,
    error,
    myEvaluations,
    currentEvaluation,
    currentFramework,
    principles,
    tasks,
    observations,
    positiveAspects,
    ratings,
    myProgress,
    myEvaluatorId,
    currentTaskId,
    currentTaskTitle,

    // Computed
    authUserId,
    tasksWithMyStatus,
    myTasksPending,
    allMyTasksCompleted,
    myProgressPercentage,

    // Métodos
    loadMyEvaluations,
    selectEvaluation,
    selectTask,
    clearTask,
    upsertMyProgress,
    addObservation,
    deleteObservation,
    addPositiveAspect,
    deletePositiveAspect,
    addRating,
    markTaskCompleted,
    markEvaluatorCompleted,
    getPrincipleCode,
    getPrincipleName,
    reset,
  }
}