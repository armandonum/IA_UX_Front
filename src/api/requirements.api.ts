import { api } from './api'


export const requirementsApi = {
  findByProject: (projectId: string) => 
    api.get(`/project-requirements/project/${projectId}`),
  
  findBySemester: (semesterId: string) => 
    api.get(`/project-requirements/semester/${semesterId}`),
  
  findByProjectWithGlobals: (projectId: string) => 
    api.get(`/project-requirements/project/${projectId}/with-globals`),
  
  create: (data: {
    projectId?: string
    semesterId?: string
    createdBy: string
    code: string
    title: string
    description: string
    acceptanceCriteria?: string
  }) => {
    const payload: any = {
      createdBy: data.createdBy,
      code: data.code,
      title: data.title,
      description: data.description,
    }
    
    if (data.acceptanceCriteria) {
      payload.acceptanceCriteria = data.acceptanceCriteria
    }
    
    if (data.projectId) {
      payload.projectId = data.projectId
    } else if (data.semesterId) {
      payload.semesterId = data.semesterId
    }
    
    return api.post('/project-requirements', payload)
  },
  
  // ✅ Actualizar requerimiento
  update: (requirementId: string, data: {
    code?: string
    title?: string
    description?: string
    acceptanceCriteria?: string
  }) => api.patch(`/project-requirements/${requirementId}`, data),
  
  // ✅ Eliminar requerimiento
  delete: (requirementId: string) => 
    api.delete(`/project-requirements/${requirementId}`),
}