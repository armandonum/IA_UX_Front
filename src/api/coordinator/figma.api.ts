// api/coordinator/figma.api.ts
import api from '../axios'
import type { FigmaProject, FigmaConnection } from '@/types/coordinator/projects.types'

export const figmaProjectsApi = {
  getByCreator: (creatorId: string) => 
    api.get<FigmaProject[]>(`/figma-projects/creator/${creatorId}`),

  getAll: () => api.get<FigmaProject[]>('/figma-projects'),

  getById: (id: string) => api.get<FigmaProject>(`/figma-projects/${id}`),

  create: (data: {
    fileKey: string
    projectName: string
    lastModified: string
    version: string
    thumbnailUrl: string
    rawJson: any
    createdBy?: string
    semesterId?: string
  }) => {
    const blob = new Blob([JSON.stringify(data.rawJson, null, 2)], {
      type: 'application/json'
    })
    const formData = new FormData()
    formData.append('fileKey', data.fileKey)
    formData.append('projectName', data.projectName)
    formData.append('lastModified', data.lastModified)
    formData.append('version', data.version)
    formData.append('thumbnailUrl', data.thumbnailUrl || '')
    if (data.createdBy) formData.append('createdBy', data.createdBy)
    if (data.semesterId) formData.append('semesterId', data.semesterId)
    formData.append('file', blob, `${data.fileKey}.json`)

    return api.post<FigmaProject>('/figma-projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  update: (id: string, data: Partial<FigmaProject>) =>
    api.patch<FigmaProject>(`/figma-projects/${id}`, data),

  delete: (id: string) => api.delete(`/figma-projects/${id}`),

  resync: (id: string) =>
    api.post<FigmaProject>(`/figma-projects/${id}/sync`)
}

export const figmaConnectionsApi = {
  list: (userId: string) => 
    api.get<FigmaConnection[]>(`/figma-connections?user_id=${userId}`),

  create: (data: { userId: string; name: string; personalAccessToken: string }) =>
    api.post<FigmaConnection>('/figma-connections', data),

  update: (id: string, data: { name: string; personalAccessToken: string }) =>
    api.patch<FigmaConnection>(`/figma-connections/${id}`, data),

  delete: (id: string) => api.delete(`/figma-connections/${id}`)
}

export const fetchFigmaFile = async (token: string, fileKey: string) => {
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { 'X-Figma-Token': token }
  })
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return {
    metadata: {
      version: json.version,
      lastModified: json.lastModified,
      thumbnailUrl: json.thumbnailUrl,
      name: json.name
    },
    raw: json
  }
}