import client from './client'

export const api = {
  async get<T = any>(url: string): Promise<T> {
    const { data } = await client.get<T>(url)
    return data
  },

  async post<T = any>(url: string, body: any): Promise<T> {
    const { data } = await client.post<T>(url, body)
    return data
  },

  async patch<T = any>(url: string, body: any): Promise<T> {
    const { data } = await client.patch<T>(url, body)
    return data
  },

  async delete<T = any>(url: string): Promise<T> {
    const { data } = await client.delete<T>(url)
    return data
  },
}