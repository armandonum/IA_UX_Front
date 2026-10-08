// composables/docente/useHeuristicFrameworks.ts
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import {
  heuristicApi,
  type HeuristicFramework,
  type HeuristicPrinciple,
} from '@/api/heuristic.api'

export function useHeuristicFrameworks() {
  const $q = useQuasar()

  // ============================================================
  // STATE
  // ============================================================
  const frameworks = ref<HeuristicFramework[]>([])
  const currentFramework = ref<HeuristicFramework | null>(null)
  const principles = ref<HeuristicPrinciple[]>([])

  const loadingFrameworks = ref(false)
  const loadingPrinciples = ref(false)
  const savingFramework = ref(false)
  const savingPrinciple = ref(false)
  const deletingFramework = ref(false)
  const deletingPrinciple = ref(false)

  // ============================================================
  // COMPUTED
  // ============================================================
  const activeFrameworks = computed(() =>
    frameworks.value.filter((f) => f.isActive),
  )

  const principlesCount = computed(
    () => (frameworkId: string) => {
      // Este computed se sobreescribirá con la data real al cargar
      return 0
    },
  )

  // ============================================================
  // FRAMEWORKS
  // ============================================================
  async function fetchFrameworks() {
    loadingFrameworks.value = true
    try {
      const { data } = await heuristicApi.getFrameworks()
      frameworks.value = data
      return data
    } catch (e: any) {
      console.error('Error cargando frameworks:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudieron cargar los frameworks',
      })
      throw e
    } finally {
      loadingFrameworks.value = false
    }
  }

  async function fetchFramework(id: string) {
    try {
      const { data } = await heuristicApi.getFramework(id)
      currentFramework.value = data
      return data
    } catch (e: any) {
      console.error('Error cargando framework:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo cargar el framework',
      })
      throw e
    }
  }

  async function createFramework(payload: {
    name: string
    description?: string
    author?: string
    year?: number
    isActive?: boolean
  }) {
    savingFramework.value = true
    try {
      const { data } = await heuristicApi.createFramework(payload)
      frameworks.value.push(data)
      $q.notify({
        type: 'positive',
        message: `Framework "${data.name}" creado correctamente`,
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      console.error('Error creando framework:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo crear el framework',
      })
      throw e
    } finally {
      savingFramework.value = false
    }
  }

  async function updateFramework(
    id: string,
    payload: Partial<HeuristicFramework>,
  ) {
    savingFramework.value = true
    try {
      const { data } = await heuristicApi.updateFramework(id, payload)
      const idx = frameworks.value.findIndex((f) => f.frameworkId === id)
      if (idx !== -1) frameworks.value[idx] = data
      if (currentFramework.value?.frameworkId === id) {
        currentFramework.value = data
      }
      $q.notify({
        type: 'positive',
        message: 'Framework actualizado',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      console.error('Error actualizando framework:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo actualizar el framework',
      })
      throw e
    } finally {
      savingFramework.value = false
    }
  }

  async function deleteFramework(id: string) {
    deletingFramework.value = true
    try {
      await heuristicApi.deleteFramework(id)
      frameworks.value = frameworks.value.filter((f) => f.frameworkId !== id)
      $q.notify({
        type: 'positive',
        message: 'Framework eliminado',
        icon: 'check_circle',
      })
      return true
    } catch (e: any) {
      console.error('Error eliminando framework:', e)
      const msg =
        e.response?.status === 409
          ? 'No se puede eliminar: el framework está siendo usado por evaluaciones existentes'
          : e.response?.data?.message || 'No se pudo eliminar el framework'
      $q.notify({
        type: 'negative',
        message: msg,
        timeout: 5000,
      })
      throw e
    } finally {
      deletingFramework.value = false
    }
  }

  // ============================================================
  // PRINCIPLES
  // ============================================================
  async function fetchPrinciples(frameworkId: string) {
    loadingPrinciples.value = true
    try {
      const { data } = await heuristicApi.getPrinciplesByFramework(frameworkId)
      // Ordenar por orderIndex
      principles.value = [...data].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      )
      return principles.value
    } catch (e: any) {
      console.error('Error cargando principios:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudieron cargar los principios',
      })
      throw e
    } finally {
      loadingPrinciples.value = false
    }
  }

  async function createPrinciple(payload: {
    frameworkId: string
    code: string
    name: string
    description: string
    orderIndex?: number
    isActive?: boolean
  }) {
    savingPrinciple.value = true
    try {
      const { data } = await heuristicApi.createPrinciple(payload)
      principles.value.push(data)
      principles.value.sort((a, b) => a.orderIndex - b.orderIndex)
      $q.notify({
        type: 'positive',
        message: 'Principio creado',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      console.error('Error creando principio:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo crear el principio',
      })
      throw e
    } finally {
      savingPrinciple.value = false
    }
  }

  async function updatePrinciple(
    id: string,
    payload: Partial<HeuristicPrinciple>,
  ) {
    savingPrinciple.value = true
    try {
      const { data } = await heuristicApi.updatePrinciple(id, payload)
      const idx = principles.value.findIndex((p) => p.principleId === id)
      if (idx !== -1) principles.value[idx] = data
      principles.value.sort((a, b) => a.orderIndex - b.orderIndex)
      $q.notify({
        type: 'positive',
        message: 'Principio actualizado',
        icon: 'check_circle',
      })
      return data
    } catch (e: any) {
      console.error('Error actualizando principio:', e)
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'No se pudo actualizar el principio',
      })
      throw e
    } finally {
      savingPrinciple.value = false
    }
  }

  async function deletePrinciple(id: string) {
    deletingPrinciple.value = true
    try {
      await heuristicApi.deletePrinciple(id)
      principles.value = principles.value.filter((p) => p.principleId !== id)
      $q.notify({
        type: 'positive',
        message: 'Principio eliminado',
        icon: 'check_circle',
      })
      return true
    } catch (e: any) {
      console.error('Error eliminando principio:', e)
      const msg =
        e.response?.status === 409
          ? 'No se puede eliminar: el principio tiene observaciones asociadas'
          : e.response?.data?.message || 'No se pudo eliminar el principio'
      $q.notify({
        type: 'negative',
        message: msg,
        timeout: 5000,
      })
      throw e
    } finally {
      deletingPrinciple.value = false
    }
  }

  // ============================================================
  // RESET
  // ============================================================
  function resetCurrent() {
    currentFramework.value = null
    principles.value = []
  }

  return {
    // State
    frameworks,
    currentFramework,
    principles,
    loadingFrameworks,
    loadingPrinciples,
    savingFramework,
    savingPrinciple,
    deletingFramework,
    deletingPrinciple,

    // Computed
    activeFrameworks,
    principlesCount,

    // Frameworks
    fetchFrameworks,
    fetchFramework,
    createFramework,
    updateFramework,
    deleteFramework,

    // Principles
    fetchPrinciples,
    createPrinciple,
    updatePrinciple,
    deletePrinciple,

    // Utils
    resetCurrent,
  }
}