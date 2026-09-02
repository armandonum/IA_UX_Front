import client from './client'
import type { AuthResponse, LoginPayload, ChangePasswordPayload, TokenPair } from '@/types'

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await client.post<AuthResponse>('/auth/login', payload)
    return data
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    const { data } = await client.post<TokenPair>('/auth/refresh', { refreshToken })
    return data
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await client.post('/auth/change-password', payload)
  },
}
