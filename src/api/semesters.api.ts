// src/api/semesters.api.ts
import api from './axios'
import type { Semester } from '@/stores/semester.store'

export const semestersApi = {
  getAll: () => api.get<Semester[]>('/semesters'),
  
  getActive: () => api.get<Semester>('/semesters/active'),
  
  getById: (id: string) => api.get<Semester>(`/semesters/${id}`),
  
  create: (data: Omit<Semester, 'semesterId' | 'createdAt' | 'updatedAt'>) => 
    api.post<Semester>('/semesters', data),
  
  update: (id: string, data: Partial<Semester>) => 
    api.patch<Semester>(`/semesters/${id}`, data),
  
  delete: (id: string) => api.delete(`/semesters/${id}`),
}