// src/api/semester-projects.api.ts
import api from './axios'

export const semesterProjectsApi = {
  getBySemester: (semesterId: string) => 
    api.get(`/semester-projects/semester/${semesterId}/with-details`),
  
  getByProject: (projectId: string) => 
    api.get(`/semester-projects/project/${projectId}`),
  
  assign: (data: { semesterId: string; projectId: string }) => 
    api.post('/semester-projects/assign', data),
  
  unassign: (data: { semesterId: string; projectId: string }) => 
    api.delete('/semester-projects/unassign', { data }),
  
  bulkAssign: (data: { semesterId: string; projectIds: string[] }) => 
    api.post('/semester-projects/bulk-assign', data),
}