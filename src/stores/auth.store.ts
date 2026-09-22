import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import { usersApi } from '@/api/users.api'
import type { User, LoginPayload, ChangePasswordPayload } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)


const currentRole = computed(() => user.value?.roles[0].name ?? null)

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  function clearTokens() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await authApi.login(payload)
      setTokens(res.accessToken, res.refreshToken)
      user.value = res.user
      return res.user
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } }
      const msg = e.response?.data?.message
      error.value = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al iniciar sesión')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    try {
      user.value = await usersApi.getMe()
    //       console.log("Usuario:", user.value)
    // console.log("Roles:", user.value.roles[0].code)
    // console.log("Primer rol:", user.value.roles[0])
    // console.log("Code:", user.value.roles[0].code)
    } catch {
      clearTokens()
    }
  }

  async function changePassword(payload: ChangePasswordPayload) {
    loading.value = true
    error.value = null
    try {
      await authApi.changePassword(payload)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } }
      const msg = e.response?.data?.message
      error.value = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al cambiar contraseña')
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearTokens()
  }

  return {
    user,
    accessToken,
    loading,
    error,
    isAuthenticated,
    currentRole,
   
    login,
    logout,
    fetchMe,
    changePassword,
  }
})
