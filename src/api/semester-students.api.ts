// src/api/semester-students.api.ts
import api from './axios'

export const semesterStudentsApi = {
  getBySemester: (semesterId: string) => 
    api.get(`/semester-students/semester/${semesterId}/with-details`),
  
  getByStudent: (userId: string) => 
    api.get(`/semester-students/student/${userId}`),
  
  assign: (data: { semesterId: string; userId: string }) => 
    api.post('/semester-students/assign', data),
  
  unassign: (data: { semesterId: string; userId: string }) => 
    api.delete('/semester-students/unassign', { data }),
  
  bulkAssign: (data: { semesterId: string; userIds: string[] }) => 
    api.post('/semester-students/bulk-assign', data),
}