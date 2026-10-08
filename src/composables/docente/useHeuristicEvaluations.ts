// composables/docente/useHeuristicEvaluations.ts
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import {
  heuristicApi,
  type HeuristicEvaluation,
} from '@/api/heuristic.api'

export function useHeuristicEvaluations() {
  const $q = useQuasar()

  // ============================================================
  // STATE
  // ============================================================
  const evaluations = ref<HeuristicEvaluation[]>([])
  const currentEvaluation = ref<HeuristicEvaluation | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)

  // ============================================================
  // COMPUTED
  // ============================================================
  const evaluationsByStatus = computed(() => {
    const grouped: Record<string, HeuristicEvaluation[]> = {
      draft: [],
      planning: [],
      in_progress: [],
      completed: [],
      archived: [],
    }
    for (const ev of evaluations.value) {
      if (!grouped[ev.status]) grouped[ev.status] = []
      grouped[ev.status].push(ev)
    }
    return grouped
  })

  const stats = computed(() => ({
    total: evaluations.value.length,
    draft: evaluations.value.filter((e) => e.status === 'draft').length,
    planning: evaluations.value.filter((e) => e.status === 'planning').length,
    inProgress: evaluations.value.filter((e) => e.status === 'in_progress').length,
    completed: evaluations.value.filter((e) => e.status === 'completed').length,
    archived: evaluations.value.filter((e) => e.status === 'archived').length,
  }))

  // ============================================================
  // LOAD
  // ============================================================
  async function fetchEvaluations(filters?: {
    supervisorId?: string
    projectId?: string
  }) {
    loading.value = true
    try {
      let response

      if (filters?.supervisorId) {
        response = await heuristicApi.getEvaluations()
      } else if (filters?.projectId) {
        response = await heuristicApi.getEvaluationsByProject(filters.projectId)
      } else {
        response = await heuristicApi.getEvaluations()
      }

      evaluations.value = response.data
      return response.data
    } catch (e: any) {
      console.error('Error cargando evaluaciones:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudieron cargar las evaluaciones',
      })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchEvaluation(id: string) {
    try {
      const { data } = await heuristicApi.getEvaluation(id)
      currentEvaluation.value = data
      return data
    } catch (e: any) {
      console.error('Error cargando evaluación:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo cargar la evaluación',
      })
      throw e
    }
  }

  // ============================================================
  // CREATE
  // ============================================================
  async function createEvaluation(payload: {
    name: string
    projectId: string
    frameworkId: string
    supervisorId: string
    description?: string
    systemDescription?: string
    targetUserDescription?: string
    maxDurationMinutes?: number
    status?: string
  }) {
    saving.value = true
    try {
      const { data } = await heuristicApi.createEvaluation(payload)
      evaluations.value.unshift(data)
      $q.notify({
        type: 'positive',
        message: `Evaluación "${data.name}" creada`,
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      console.error('Error creando evaluación:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo crear la evaluación',
      })
      throw e
    } finally {
      saving.value = false
    }
  }

  // ============================================================
  // UPDATE
  // ============================================================
  async function updateEvaluation(
    id: string,
    payload: Partial<HeuristicEvaluation>,
  ) {
    saving.value = true
    try {
      const { data } = await heuristicApi.updateEvaluation(id, payload)
      const idx = evaluations.value.findIndex((e) => e.evaluationId === id)
      if (idx !== -1) evaluations.value[idx] = data
      if (currentEvaluation.value?.evaluationId === id) {
        currentEvaluation.value = data
      }
      $q.notify({
        type: 'positive',
        message: 'Evaluación actualizada',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      console.error('Error actualizando evaluación:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo actualizar la evaluación',
      })
      throw e
    } finally {
      saving.value = false
    }
  }

  // ============================================================
  // UPDATE STATUS
  // ============================================================
  async function updateEvaluationStatus(id: string, status: string) {
    try {
      const { data } = await heuristicApi.updateEvaluationStatus(id, status)
      const idx = evaluations.value.findIndex((e) => e.evaluationId === id)
      if (idx !== -1) evaluations.value[idx] = data
      if (currentEvaluation.value?.evaluationId === id) {
        currentEvaluation.value = data
      }
      $q.notify({
        type: 'positive',
        message: `Estado cambiado a "${getStatusLabel(status)}"`,
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      console.error('Error actualizando estado:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo cambiar el estado',
      })
      throw e
    }
  }

  // ============================================================
  // DELETE
  // ============================================================
  async function deleteEvaluation(id: string) {
    deleting.value = true
    try {
      await heuristicApi.deleteEvaluation(id)
      evaluations.value = evaluations.value.filter((e) => e.evaluationId !== id)
      $q.notify({
        type: 'positive',
        message: 'Evaluación eliminada',
        icon: 'check_circle',
      })
      return true
    } catch (e: any) {
      console.error('Error eliminando evaluación:', e)
      const msg =
        e.response?.status === 409
          ? 'No se puede eliminar: la evaluación tiene datos asociados (evaluadores, tareas u observaciones)'
          : e.response?.data?.message || 'No se pudo eliminar la evaluación'
      $q.notify({
        type: 'negative',
        message: msg,
        timeout: 5000,
      })
      throw e
    } finally {
      deleting.value = false
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      planning: 'Planificación',
      in_progress: 'En progreso',
      completed: 'Completada',
      archived: 'Archivada',
    }
    return labels[status] || status
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'grey-6',
      planning: 'info',
      in_progress: 'warning',
      completed: 'positive',
      archived: 'grey-7',
    }
    return colors[status] || 'grey'
  }

  function getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      draft: 'edit_note',
      planning: 'event_note',
      in_progress: 'play_circle',
      completed: 'check_circle',
      archived: 'archive',
    }
    return icons[status] || 'help'
  }

  // ============================================================
  // RESET
  // ============================================================
  function resetCurrent() {
    currentEvaluation.value = null
  }

  return {
    // State
    evaluations,
    currentEvaluation,
    loading,
    saving,
    deleting,

    // Computed
    evaluationsByStatus,
    stats,

    // Actions
    fetchEvaluations,
    fetchEvaluation,
    createEvaluation,
    updateEvaluation,
    updateEvaluationStatus,
    deleteEvaluation,

    // Helpers
    getStatusLabel,
    getStatusColor,
    getStatusIcon,
    resetCurrent,
  }
}