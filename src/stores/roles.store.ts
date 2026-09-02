import { defineStore } from 'pinia'
import { ref } from 'vue'
import { rolesApi } from '@/api/roles.api'
import type { Role, CreateRolePayload, UpdateRolePayload } from '@/types'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      roles.value = await rolesApi.getAll()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      error.value = e.response?.data?.message ?? 'Error al cargar roles'
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateRolePayload) {
    const newRole = await rolesApi.create(payload)
    roles.value.push(newRole)
    return newRole
  }

  async function update(id: number, payload: UpdateRolePayload) {
    const updated = await rolesApi.update(id, payload)
    const idx = roles.value.findIndex((r) => r.role_id === id)
    if (idx !== -1) roles.value[idx] = updated
    return updated
  }

  async function remove(id: number) {
    await rolesApi.remove(id)
    roles.value = roles.value.filter((r) => r.role_id !== id)
  }

  return { roles, loading, error, fetchAll, create, update, remove }
})
