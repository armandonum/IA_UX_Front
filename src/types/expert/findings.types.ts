// types/findings.types.ts

export interface Finding {
  findingId: string
  evaluationId: string
  sessionId?: string
  taskId?: string
  requirementId?: string
  flowId?: string
  nodeId?: string
  version?: string
  type: 'usability' | 'emotional' | 'sentiment' | 'expert' | 'mixed'
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  frequency: number
  impact: 'high' | 'medium' | 'low'
  priority: 'high' | 'medium' | 'low'
  recommendation?: string
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  emotionInferred?: string
  textualSentiment?: string
  userComment?: string
  expertComment?: string
  userCommentId?: string
  expertCommentId?: string
  aggregatedFrom?: string[]
  occurrences: number
  createdAt: string
  updatedAt: string
}

export interface GeneratedFinding extends Omit<Finding, 'findingId' | 'createdAt' | 'updatedAt'> {
  _tempId: string
  source: 'emotion' | 'sentiment' | 'user_comment' | 'expert_comment' | 'mixed'
  confidence: number
  relatedEvents: any[]
  relatedEmotions: any[]
  relatedSentiments: any[]
  relatedComments: any[]
  relatedExpertComments: any[]
}

export interface FindingGenerationConfig {
  minConfidence: number
  minFrequency: number
  maxTimeGap: number // ms entre eventos para agrupar
  includeEmotions: boolean
  includeSentiments: boolean
  includeUserComments: boolean
  includeExpertComments: boolean
}