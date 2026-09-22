// composables/useFindings.ts
import { ref, reactive, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useFindingsApi } from './useFindingsApi'
import type { Finding, FindingSummary } from './useFindingsApi'

export const useFindings = () => {
  const $q = useQuasar()
  const api = useFindingsApi()

  // ============================================================
  // STATE
  // ============================================================
  const findings = ref<Finding[]>([])
  const currentFinding = ref<Finding | null>(null)
  const summary = ref<FindingSummary | null>(null)
  const loading = ref(false)
  const selectedEvaluationId = ref<string | null>(null)
  const selectedSessionId = ref<string | null>(null)

  // Filtros
  const filters = reactive({
    status: null as string | null,
    severity: null as string | null,
    type: null as string | null,
    search: '',
    limit: 50,
    offset: 0,
  })

  // ============================================================
  // COMPUTED
  // ============================================================
  const totalFindings = computed(() => findings.value.length)
  const activeFindings = computed(() => findings.value.filter(f => f.isActive).length)
  const resolvedFindings = computed(() => findings.value.filter(f => f.status === 'resolved').length)
  const criticalFindings = computed(() => findings.value.filter(f => f.isCritical).length)
  const resolutionRate = computed(() => {
    if (totalFindings.value === 0) return 0
    return Math.round((resolvedFindings.value / totalFindings.value) * 100)
  })

  // Hallazgos agrupados por severidad
  const findingsBySeverity = computed(() => {
    return {
      critical: findings.value.filter(f => f.severity === 'critical').length,
      high: findings.value.filter(f => f.severity === 'high').length,
      medium: findings.value.filter(f => f.severity === 'medium').length,
      low: findings.value.filter(f => f.severity === 'low').length,
    }
  })

  // Hallazgos agrupados por estado
  const findingsByStatus = computed(() => {
    return {
      pending: findings.value.filter(f => f.status === 'pending').length,
      in_progress: findings.value.filter(f => f.status === 'in_progress').length,
      resolved: findings.value.filter(f => f.status === 'resolved').length,
      not_resolved: findings.value.filter(f => f.status === 'not_resolved').length,
      kept: findings.value.filter(f => f.status === 'kept').length,
    }
  })

  // Hallazgos agrupados por tipo
  const findingsByType = computed(() => {
    return {
      problem: findings.value.filter(f => f.type === 'problem').length,
      difficulty: findings.value.filter(f => f.type === 'difficulty').length,
      accessibility: findings.value.filter(f => f.type === 'accessibility').length,
      friction: findings.value.filter(f => f.type === 'friction').length,
      positive: findings.value.filter(f => f.type === 'positive').length,
      opportunity: findings.value.filter(f => f.type === 'opportunity').length,
    }
  })

  // ============================================================
  // METHODS
  // ============================================================
  const loadFindings = async (evaluationId: string, params?: any) => {
    loading.value = true
    try {
      selectedEvaluationId.value = evaluationId
      const data = await api.getFindingsByEvaluation(evaluationId, {
        ...filters,
        ...params,
      })
      findings.value = data
    } catch (error) {
      console.error('Error loading findings:', error)
      $q.notify({
        type: 'negative',
        message: 'Error al cargar los hallazgos'
      })
    } finally {
      loading.value = false
    }
  }

  const loadFindingsBySession = async (sessionId: string) => {
    loading.value = true
    try {
      selectedSessionId.value = sessionId
      const data = await api.getFindingsBySession(sessionId)
      findings.value = data
    } catch (error) {
      console.error('Error loading findings by session:', error)
      $q.notify({
        type: 'negative',
        message: 'Error al cargar los hallazgos de la sesión'
      })
    } finally {
      loading.value = false
    }
  }

  const loadSummary = async (evaluationId: string) => {
    try {
      summary.value = await api.getFindingSummary(evaluationId)
    } catch (error) {
      console.error('Error loading summary:', error)
    }
  }

  const loadFinding = async (id: string) => {
    loading.value = true
    try {
      currentFinding.value = await api.getFindingById(id)
      return currentFinding.value
    } catch (error) {
      console.error('Error loading finding:', error)
      $q.notify({
        type: 'negative',
        message: 'Error al cargar el hallazgo'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  const createFinding = async (payload: any) => {
    loading.value = true
    try {
      const result = await api.createFinding(payload)
      $q.notify({
        type: 'positive',
        message: 'Hallazgo creado exitosamente'
      })
      
      // Recargar datos
      if (selectedEvaluationId.value) {
        await loadFindings(selectedEvaluationId.value)
        await loadSummary(selectedEvaluationId.value)
      }
      
      return result
    } catch (error: any) {
      console.error('Error creating finding:', error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Error al crear el hallazgo'
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateFinding = async (id: string, payload: any) => {
    loading.value = true
    try {
      const result = await api.updateFinding(id, payload)
      $q.notify({
        type: 'positive',
        message: 'Hallazgo actualizado exitosamente'
      })
      
      if (selectedEvaluationId.value) {
        await loadFindings(selectedEvaluationId.value)
        await loadSummary(selectedEvaluationId.value)
      }
      
      return result
    } catch (error: any) {
      console.error('Error updating finding:', error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Error al actualizar el hallazgo'
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateFindingStatus = async (id: string, status: string) => {
    loading.value = true
    try {
      const result = await api.updateFindingStatus(id, status)
      $q.notify({
        type: 'positive',
        message: `Estado actualizado a: ${status}`
      })
      
      if (selectedEvaluationId.value) {
        await loadFindings(selectedEvaluationId.value)
        await loadSummary(selectedEvaluationId.value)
      }
      
      return result
    } catch (error: any) {
      console.error('Error updating finding status:', error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Error al actualizar el estado'
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteFinding = async (id: string) => {
    const confirm = await $q.dialog({
      title: 'Eliminar Hallazgo',
      message: '¿Estás seguro de que quieres eliminar este hallazgo?',
      ok: { label: 'Eliminar', color: 'negative' },
      cancel: 'Cancelar',
    })

    if (!confirm) return

    loading.value = true
    try {
      await api.deleteFinding(id)
      $q.notify({
        type: 'positive',
        message: 'Hallazgo eliminado exitosamente'
      })
      
      if (selectedEvaluationId.value) {
        await loadFindings(selectedEvaluationId.value)
        await loadSummary(selectedEvaluationId.value)
      }
    } catch (error: any) {
      console.error('Error deleting finding:', error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Error al eliminar el hallazgo'
      })
    } finally {
      loading.value = false
    }
  }

  const applyFilters = () => {
    if (selectedEvaluationId.value) {
      loadFindings(selectedEvaluationId.value)
    }
  }

  const resetFilters = () => {
    filters.status = null
    filters.severity = null
    filters.type = null
    filters.search = ''
    filters.offset = 0
    applyFilters()
  }

  return {
    // State
    findings,
    currentFinding,
    summary,
    loading,
    filters,
    selectedEvaluationId,
    selectedSessionId,
    
    // Computed
    totalFindings,
    activeFindings,
    resolvedFindings,
    criticalFindings,
    resolutionRate,
    findingsBySeverity,
    findingsByStatus,
    findingsByType,
    
    // Methods
    loadFindings,
    loadFindingsBySession,
    loadSummary,
    loadFinding,
    createFinding,
    updateFinding,
    updateFindingStatus,
    deleteFinding,
    applyFilters,
    resetFilters,
  }
}