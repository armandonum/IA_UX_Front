import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import type { RoleName } from '@/types'

const PERMISSIONS: Record<RoleName, string[]> = {
  Administrador:      ['*'],
  Coordinador:        ['users.read', 'users.create', 'users.update', 'roles.read', 'dashboard.full'],
  Docente:            ['users.read.self', 'dashboard.Docente'],
  Estudiante:         ['dashboard.estudiante'],
  'Experto UX':       ['dashboard.ux'],
  moderador:          ['users.read', 'dashboard.moderador'],
  observador:         ['dashboard.observador'],
  'especialista IA':  ['dashboard.ia'],
  'responsable ético':['dashboard.etico'],
}

export function usePermissions() {
  const auth = useAuthStore()
  const role = computed(() => auth.currentRole as RoleName | null)

  function can(permission: string): boolean {
    if (!role.value) return false
    const perms = PERMISSIONS[role.value] ?? []
    return perms.includes('*') || perms.includes(permission)
  }

  const isAdmin        = computed(() => role.value === 'Administrador')
  const isCoordinador  = computed(() => role.value === 'Coordinador')
  const isDocente      = computed(() => role.value === 'Docente')
  const isEstudiante   = computed(() => role.value === 'Estudiante')

  return { can, isAdmin, isCoordinador, isDocente, isEstudiante, role }
}
