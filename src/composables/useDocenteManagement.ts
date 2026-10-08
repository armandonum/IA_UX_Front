// composables/useDocenteManagement.ts
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useSemesterStore } from '@/stores/semester.store'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Composable central para el panel de gestión del docente.
 * Coordina el semestre activo y provee utilidades comunes.
 */
export function useDocenteManagement() {
  const $q = useQuasar()
  const auth = useAuthStore()
  const semesterStore = useSemesterStore()

  // ==========================================
  // ESTADO PRINCIPAL
  // ==========================================
  const selectedSemesterId = ref<string | null>(null)
  const activeTab = ref<string>('frameworks')

  // ==========================================
  // COMPUTED
  // ==========================================
  const currentUserId = computed(() => auth.user?.user_id || null)
  const currentRole = computed(() => auth.currentRole || null)

  const selectedSemester = computed(() => {
    if (!selectedSemesterId.value) return null
    return (
      semesterStore.semesters.find(
        (s) => s.semesterId === selectedSemesterId.value,
      ) || null
    )
  })

  const semesterName = computed(() => {
    const s = selectedSemester.value
    return s ? `${s.name} (${s.code})` : 'Sin semestre'
  })

  const hasSemester = computed(() => !!selectedSemesterId.value)

  // ==========================================
  // CARGA INICIAL
  // ==========================================
  async function loadSemesters() {
    try {
      await semesterStore.fetchSemesters()
      // await semesterStore.loadSemesters()

      // Si no hay semestre seleccionado, usar el activo
      if (!selectedSemesterId.value) {
        const active =
          semesterStore.semesters.find((s: any) => s.isActive) ||
          semesterStore.semesters[0]
        if (active) {
          selectedSemesterId.value = active.semesterId
        }
      }
    } catch (e: any) {
      console.error('Error al cargar semestres:', e)
      $q.notify({
        type: 'negative',
        message: 'No se pudieron cargar los semestres',
      })
    }
  }

  // ==========================================
  // VALIDACIÓN: Requerir semestre para acciones
  // ==========================================
  function requireSemester(): boolean {
    if (!hasSemester.value) {
      $q.notify({
        type: 'warning',
        message: 'Selecciona un semestre primero',
        icon: 'warning',
      })
      return false
    }
    return true
  }

  // ==========================================
  // WATCHERS
  // ==========================================
  watch(selectedSemesterId, (newId) => {
    if (newId) {
      semesterStore.setCurrentSemester(newId)
    }
  })

  // ==========================================
  // EXPORT
  // ==========================================
  return {
    // Estado
    selectedSemesterId,
    activeTab,

    // Computed
    currentUserId,
    currentRole,
    selectedSemester,
    semesterName,
    hasSemester,

    // Acciones
    loadSemesters,
    requireSemester,
  }
}