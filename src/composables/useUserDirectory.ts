// composables/useUserDirectory.ts
import { ref } from 'vue'
import api from '@/api/axios'

export interface UserBasicInfo {
  user_id: string
  display_name: string
  email: string
  roles?: Array<{ role_id: number; name: string }>
}

/**
 * Composable para resolver nombres de usuarios desde sus IDs.
 * Cachea los resultados para evitar requests repetidos.
 */
export function useUserDirectory() {
  const usersCache = ref<Map<string, UserBasicInfo>>(new Map())
  const loading = ref(false)

  /**
   * Carga todos los usuarios y los guarda en cache
   */
  async function loadAllUsers(): Promise<Map<string, UserBasicInfo>> {
    if (usersCache.value.size > 0) {
      return usersCache.value
    }

    loading.value = true
    try {
      const { data } = await api.get<UserBasicInfo[]>('/users')

      for (const user of data) {
        usersCache.value.set(user.user_id, user)
      }

      return usersCache.value
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      return usersCache.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene el nombre de un usuario por su ID
   * Si no está en cache, retorna un fallback
   */
  function getUserName(userId: string | null | undefined): string {
    if (!userId) return '—'

    const user = usersCache.value.get(userId)
    if (user) {
      return user.display_name || user.email || userId.substring(0, 8)
    }

    // Fallback: usar parte del UUID
    return userId.substring(0, 8) + '...'
  }

  /**
   * Obtiene el email de un usuario por su ID
   */
  function getUserEmail(userId: string | null | undefined): string {
    if (!userId) return '—'
    return usersCache.value.get(userId)?.email || '—'
  }

  /**
   * Obtiene las iniciales de un usuario
   */
  function getUserInitials(userId: string | null | undefined): string {
    const name = getUserName(userId)
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  /**
   * Obtiene la info completa de un usuario
   */
  function getUser(userId: string | null | undefined): UserBasicInfo | null {
    if (!userId) return null
    return usersCache.value.get(userId) || null
  }

  /**
   * Limpia el cache
   */
  function clearCache() {
    usersCache.value.clear()
  }

  return {
    usersCache,
    loading,
    loadAllUsers,
    getUserName,
    getUserEmail,
    getUserInitials,
    getUser,
    clearCache,
  }
}