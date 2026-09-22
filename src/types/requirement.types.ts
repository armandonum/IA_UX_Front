// src/types/requirement.types.ts

export interface ProjectRequirement {
  requirementId: string
  projectId?: string | null
  semesterId?: string | null 
  createdBy: string
  code: string
  title: string
  description: string
  acceptanceCriteria?: string
  createdAt: string
  updatedAt: string
}

export interface CreateRequirementDto {
  projectId?: string
  semesterId?: string
  createdBy: string
  code: string
  title: string
  description: string
  acceptanceCriteria?: string
}

export interface UpdateRequirementDto {
  code?: string
  title?: string
  description?: string
  acceptanceCriteria?: string
}