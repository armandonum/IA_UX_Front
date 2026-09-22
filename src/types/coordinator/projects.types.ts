// types/projects.types.ts
export interface FigmaProject {
  projectId: string
  fileKey: string
  projectName: string
  lastModified: string
  version: string
  thumbnailUrl?: string
  status?: 'active' | 'inactive'
  createdBy?: string
  semesterId?: string
  createdAt?: string
  updatedAt?: string
}

export interface FigmaConnection {
  connectionId: string
  userId: string
  name: string
  personalAccessToken: string
  createdAt: string
  updatedAt: string
}