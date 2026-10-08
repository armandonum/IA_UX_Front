export interface HeuristicFramework {
  frameworkId: string
  name: string
  description?: string
  author?: string
  year?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface HeuristicPrinciple {
  principleId: string
  frameworkId: string
  code: string           // 'H1', 'H2', etc.
  name: string
  description: string
  orderIndex: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}