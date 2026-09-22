// src/stores/semester.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { semestersApi } from '@/api/semesters.api'
import { semesterStudentsApi } from '@/api/semester-students.api'
import { semesterProjectsApi } from '@/api/semester-projects.api'

export interface Semester {
  semesterId: string
  name: string
  code: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SemesterStudent {
  semesterStudentId: string
  semesterId: string
  userId: string
  enrolledAt: string
  userDisplayName?: string
  userEmail?: string
}

export interface SemesterProject {
  semesterProjectId: string
  semesterId: string
  projectId: string
  assignedAt: string
  projectName?: string
  projectFileKey?: string
}

export const useSemesterStore = defineStore('semester', () => {
  // ==========================================
  // STATE
  // ==========================================
  const semesters = ref<Semester[]>([])
  const currentSemester = ref<Semester | null>(null)
  const semesterStudents = ref<SemesterStudent[]>([])
  const semesterProjects = ref<SemesterProject[]>([])
  const loading = ref(false)

  // ==========================================
  // GETTERS
  // ==========================================
  const activeSemester = computed(() => 
    semesters.value.find(s => s.isActive) || null
  )

  const semesterNames = computed(() => 
    semesters.value.map(s => ({
      ...s,
      displayName: `${s.name} (${s.code})`
    }))
  )

  // ==========================================
  // SEMESTERS CRUD
  // ==========================================
  async function fetchSemesters() {
    loading.value = true
    try {
      const response = await semestersApi.getAll()
      semesters.value = response.data
      
      const active = semesters.value.find(s => s.isActive)
      if (active && !currentSemester.value) {
        currentSemester.value = active
      }
    } catch (error) {
      console.error('Error fetching semesters:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createSemester(data: Omit<Semester, 'semesterId' | 'createdAt' | 'updatedAt'>) {
    const response = await semestersApi.create(data)
    await fetchSemesters()
    return response.data
  }

  async function updateSemester(id: string, data: Partial<Semester>) {
    const response = await semestersApi.update(id, data)
    await fetchSemesters()
    return response.data
  }

  async function deleteSemester(id: string) {
    await semestersApi.delete(id)
    await fetchSemesters()
  }

  function setCurrentSemester(semesterId: string) {
    const found = semesters.value.find(s => s.semesterId === semesterId)
    if (found) {
      currentSemester.value = found
    }
  }

  // ==========================================
  // SEMESTER STUDENTS
  // ==========================================

  async function getSemestersByUser(userId: string) {
  try {
    const response = await semesterStudentsApi.getByStudent(userId)
    return response.data || []
  } catch (error) {
    console.error('Error fetching semesters by user:', error)
    return []
  }
}

  async function getStudentsBySemester(semesterId: string) {
    const response = await semesterStudentsApi.getBySemester(semesterId)
    semesterStudents.value = response.data
    return semesterStudents.value
  }

  async function assignStudentToSemester(semesterId: string, userId: string) {
    const response = await semesterStudentsApi.assign({
      semesterId,
      userId
    })
    return response.data
  }

  async function unassignStudentFromSemester(semesterId: string, userId: string) {
    await semesterStudentsApi.unassign({ semesterId, userId })
  }

  async function bulkAssignStudentsToSemester(semesterId: string, userIds: string[]) {
    const response = await semesterStudentsApi.bulkAssign({
      semesterId,
      userIds
    })
    return response.data
  }

  // ==========================================
  // SEMESTER PROJECTS
  // ==========================================
  async function getProjectsBySemester(semesterId: string) {
    const response = await semesterProjectsApi.getBySemester(semesterId)
    semesterProjects.value = response.data
    return semesterProjects.value
  }


async function assignProjectToSemester(semesterId: string, projectId: string) {
  console.log('📡 ========== assignProjectToSemester ==========')
  console.log('📌 Datos de asignación:')
  console.log('  - semesterId:', semesterId)
  console.log('  - projectId:', projectId)
  
  try {
    const response = await semesterProjectsApi.assign({
      semesterId,
      projectId
    })
    
    console.log('✅ Asignación exitosa:')
    console.log('  - semesterProjectId:', response.data?.semesterProjectId)
    console.log('  - semesterId:', response.data?.semesterId)
    console.log('  - projectId:', response.data?.projectId)
    
    // Actualizar la lista local
    const updatedProjects = await getProjectsBySemester(semesterId)
    console.log('📊 Proyectos actualizados en el semestre:', updatedProjects.length)
    
    return response.data
  } catch (error: any) {
    console.error('❌ Error en assignProjectToSemester:')
    console.error('  - Mensaje:', error.message)
    console.error('  - Response:', error.response?.data)
    throw error
  }
}
  async function unassignProjectFromSemester(semesterId: string, projectId: string) {
    await semesterProjectsApi.unassign({ semesterId, projectId })
  }

  async function bulkAssignProjectsToSemester(semesterId: string, projectIds: string[]) {
    const response = await semesterProjectsApi.bulkAssign({
      semesterId,
      projectIds
    })
    return response.data
  }

  // ==========================================
  // EXPORT
  // ==========================================
  return {
    // State
    semesters,
    currentSemester,
    semesterStudents,
    semesterProjects,
    loading,

    // Getters
    activeSemester,
    semesterNames,

    // Semesters
    fetchSemesters,
    createSemester,
    updateSemester,
    deleteSemester,
    setCurrentSemester,
    getSemestersByUser,

    // Students
    getStudentsBySemester,
    assignStudentToSemester,
    unassignStudentFromSemester,
    bulkAssignStudentsToSemester,

    // Projects
    getProjectsBySemester,
    assignProjectToSemester,
    unassignProjectFromSemester,
    bulkAssignProjectsToSemester,
  }
})