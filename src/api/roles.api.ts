import client from './client'
import type { Role, CreateRolePayload, UpdateRolePayload } from '@/types'

export const rolesApi = {
  async getAll(): Promise<Role[]> {
    const { data } = await client.get<Role[]>('/roles')
    return data
  },

  async create(payload: CreateRolePayload): Promise<Role> {
    const { data } = await client.post<Role>('/roles', payload)
    return data
  },

  async update(id: number, payload: UpdateRolePayload): Promise<Role> {
    const { data } = await client.patch<Role>(`/roles/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await client.delete(`/roles/${id}`)
  },
}
