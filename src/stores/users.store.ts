// stores/users.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersApi } from '@/api/users.api'
import { useAuthStore } from '@/stores/auth.store'
import type { User } from '@/types'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const userId = authStore.user?.user_id
      if (userId) {
        users.value = await usersApi.getByCreator(userId)
        console.log(`✅ Usuarios creados por ${userId}:`, users.value.length)
      } else {
        users.value = await usersApi.getAll()
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      error.value = e.response?.data?.message ?? 'Error al cargar usuarios'
      console.error('Error loading users:', error.value)
    } finally {
      loading.value = false
    }
  }

  async function create(payload: {
    email: string
    password: string
    displayName: string
    status: string
    roleIds: number[]
    created_by?: string 
  }) {
    loading.value = true
    try {
      const newUser = await usersApi.create(payload)
      users.value.unshift(newUser)
      return newUser
    } catch (error: any) {
      console.error('❌ Error creating user:', error)
      console.error('❌ Response:', error.response?.data)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: {
    displayName?: string
    email?: string
    status?: string
    roleIds?: number[]
  }) {
    const updated = await usersApi.update(id, payload)
    const idx = users.value.findIndex((u) => u.user_id === id)
    if (idx !== -1) users.value[idx] = updated
    return updated
  }

  async function remove(id: string) {
    await usersApi.remove(id)
    users.value = users.value.filter((u) => u.user_id !== id)
  }

  return { users, loading, error, fetchAll, create, update, remove }
})