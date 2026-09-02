// docente.store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  User,
  Role,
  FigmaProject,
  FigmaNode,
  Task,
  Flow,
  FlowClick,
  FigmaConnection,
} from "@/types/docente.types";
import {
  usersApi,
  rolesApi,
  figmaProjectsApi,
  figmaNodesApi,
  tasksApi,
  flowsApi,
  flowClicksApi,
  userRolesApi,
  figmaConnectionsApi,
  projectReviewersApi,
} from "@/api/docente.api";
import type { ProjectRequirement } from "@/types/requirement.types";

import { requirementsApi } from "@/api/requirements.api";

import { useAuthStore } from "../stores/auth.store";
import { useSemesterStore } from "../stores/semester.store";

export const useDocenteStore = defineStore("docente", () => {
  // ==========================================
  // STATE
  // ==========================================
  const students = ref<User[]>([]);
  const roles = ref<Role[]>([]);
  const projects = ref<FigmaProject[]>([]);
  const nodes = ref<FigmaNode[]>([]);
  const tasks = ref<Task[]>([]);
  const flows = ref<Flow[]>([]);
  const flowClicks = ref<FlowClick[]>([]);

  const projectReviewers = ref<any[]>([]);
  const figmaConnections = ref<FigmaConnection[]>([]);
  const requirements = ref<ProjectRequirement[]>([]);

  const flowsByTask = ref<Map<string, Flow[]>>(new Map());

  const loading = ref(false);

  const auth = useAuthStore();
  const userAuthId = auth.user?.user_id;

  // ==========================================
  // SEMESTER STORE
  // ==========================================
  const semesterStore = useSemesterStore();

  // Computed para obtener el semesterId actual
  const currentSemesterId = computed(
    () => semesterStore.currentSemester?.semesterId || null,
  );

  // ==========================================
  // STUDENTS
  // ==========================================
  async function fetchStudents() {
    students.value = await usersApi.list();
  }

  // ✅ NUEVO: Obtener estudiantes por semestre usando semester_students
  async function fetchStudentsBySemester(semesterId: string) {
    // 1. Obtener todos los estudiantes
    const allStudents = await usersApi.list();

    // 2. Obtener las asignaciones del semestre
    const semesterStudents =
      await semesterStore.getStudentsBySemester(semesterId);

    // 3. Filtrar estudiantes que están asignados al semestre
    const studentIds = semesterStudents.map((ss: any) => ss.userId);
    students.value = allStudents.filter((s: User) =>
      studentIds.includes(s.user_id),
    );

    return students.value;
  }

  // Crear estudiante SIN asignar al semestre directamente
  async function createStudent(data: {
    email: string;
    password: string;
    displayName: string;
    status: string;
    roleIds: string[];
  }) {
    const created = await usersApi.create(data);
    students.value.push(created);
    return created;
  }

  // Asignar estudiante a semestre (endpoint separado)
  async function assignStudentToSemester(semesterId: string, userId: string) {
    const result = await semesterStore.assignStudentToSemester(
      semesterId,
      userId,
    );
    // Actualizar la lista local si es necesario
    return result;
  }

  // ✅ NUEVO: Desasignar estudiante del semestre
  async function unassignStudentFromSemester(
    semesterId: string,
    userId: string,
  ) {
    await semesterStore.unassignStudentFromSemester(semesterId, userId);
  }

  // ==========================================
  // ROLES
  // ==========================================
  async function fetchRoles() {
    roles.value = await rolesApi.list();
  }

  // ==========================================
  // PROJECTS
  // ==========================================
  async function fetchProjects() {
    projects.value = await figmaProjectsApi.list();
  }

  // ✅ NUEVO: Obtener proyectos por semestre usando semester_projects
  async function fetchProjectsBySemester(semesterId: string) {
    // 1. Obtener todos los proyectos
    const allProjects = await figmaProjectsApi.list();

    // 2. Obtener las asignaciones del semestre
    const semesterProjects =
      await semesterStore.getProjectsBySemester(semesterId);

    // 3. Filtrar proyectos que están asignados al semestre
    const projectIds = semesterProjects.map((sp: any) => sp.projectId);
    projects.value = allProjects.filter((p: FigmaProject) =>
      projectIds.includes(p.projectId),
    );

    return projects.value;
  }


// docente.store.ts - createProject CORREGIDO

async function createProject(data: {
  fileKey: string
  projectName: string
  lastModified: string
  version: string
  thumbnailUrl: string
  rawJson: any
  semesterId?: string
}) {
  
  const blob = new Blob(
    [
      JSON.stringify(
        data.rawJson,
        null,
        2,
      ),
    ],
    {
      type: 'application/json',
    },
  )

  const formData = new FormData()

  formData.append('fileKey', data.fileKey)
  formData.append('projectName', data.projectName)
  formData.append('lastModified', data.lastModified)
  formData.append('version', data.version)
  formData.append('thumbnailUrl', data.thumbnailUrl || '')
  
  if (data.semesterId) {
    formData.append('semesterId', data.semesterId)
  }

  formData.append(
    'file',
    blob,
    `${data.fileKey}.json`,
  )

  
  try {
    const response = await figmaProjectsApi.create(formData)
    
    const created = response
    
   
    
    projects.value.push(created)
    return created
  } catch (error: any) {
    console.error('❌ Error en figmaProjectsApi.create:')
    console.error('  - Mensaje:', error.message)
    console.error('  - Response:', error.response?.data)
    throw error
  }
}



  // ✅ NUEVO: Asignar proyecto a semestre (endpoint separado)
  async function assignProjectToSemester(
    semesterId: string,
    projectId: string,
  ) {

    const result = await semesterStore.assignProjectToSemester(
      semesterId,
      projectId,
    );
    return result;
  }

  // ✅ NUEVO: Desasignar proyecto del semestre
  async function unassignProjectFromSemester(
    semesterId: string,
    projectId: string,
  ) {
    await semesterStore.unassignProjectFromSemester(semesterId, projectId);
  }

  // ==========================================
  // FIGMA NODES
  // ==========================================
  async function fetchNodes(projectId: string) {
    nodes.value = await figmaNodesApi.listByProject(projectId);
  }

  // ==========================================
  // TASKS
  // ==========================================
  async function fetchTasks(projectId: string) {
    tasks.value = await tasksApi.listByProject(projectId);
  }

  async function fetchTasksByRequirement(requirementId: string) {
    tasks.value = await tasksApi.findByRequirement(requirementId);
    return tasks.value;
  }

  async function createTask(payload: {
    projectId: string;
    requirementId: string;
    orderIndex: number;
    title: string;
    description: string;
  }) {
    const task = await tasksApi.create(payload);
    tasks.value.push(task);
    return task;
  }

  async function updateTask(taskId: string, payload: any) {
    const task = await tasksApi.update(taskId, payload);
    const idx = tasks.value.findIndex((t) => t.taskId === taskId);
    if (idx !== -1) {
      tasks.value[idx] = task;
    }
    return task;
  }

  async function updateTaskOrder(taskId: string, orderIndex: number) {
    const task = await tasksApi.updateOrder(taskId, orderIndex);
    const idx = tasks.value.findIndex((t) => t.taskId === taskId);
    if (idx !== -1) {
      tasks.value[idx] = task;
    }
    return task;
  }

  async function deleteTask(taskId: string) {
    await tasksApi.delete(taskId);
    tasks.value = tasks.value.filter((t) => t.taskId !== taskId);
  }

  // ==========================================
  // FLOWS
  // ==========================================
  async function fetchFlows(taskId: string) {
    try {
      const flows = await flowsApi.listByTask(taskId);
      flowsByTask.value.set(taskId, flows);
      return flows;
    } catch (error) {
      console.error("Error fetching flows:", error);
      throw error;
    }
  }

  function getFlowsByTask(taskId: string): Flow[] {
    return flowsByTask.value.get(taskId) || [];
  }

  async function createFlow(data: {
    taskId: string;
    projectId: string;
    name: string;
  }) {
    try {
      const response = await flowsApi.create(data);
      const newFlow = response;
      const existingFlows = flowsByTask.value.get(data.taskId) || [];
      flowsByTask.value.set(data.taskId, [...existingFlows, newFlow]);
      return newFlow;
    } catch (error) {
      console.error("Error creating flow:", error);
      throw error;
    }
  }

  async function deleteFlow(flowId: string) {
    try {
      await flowsApi.delete(flowId);
      for (const [taskId, flows] of flowsByTask.value) {
        const filtered = flows.filter((f) => f.flowId !== flowId);
        flowsByTask.value.set(taskId, filtered);
      }
    } catch (error) {
      console.error("Error deleting flow:", error);
      throw error;
    }
  }

  async function finishFlow(flowId: string) {
    return await flowsApi.finish(flowId);
  }

  async function fetchFlowClicks(flowId: string) {
    flowClicks.value = await flowClicksApi.listByFlow(flowId);
  }

  async function registerFlowClick(
    flowId: string,
    record: {
      orderIndex: number;
      nodeId: string;
      presentedNodeId: string | null;
    },
  ) {
    return await flowClicksApi.create({
      flowId,
      orderIndex: record.orderIndex,
      nodeId: record.nodeId,
      presentedNodeId: record.presentedNodeId,
    });
  }

  // ==========================================
  // FIGMA CONNECTIONS
  // ==========================================
  async function fetchFigmaConnections(userId: string) {
    figmaConnections.value = await figmaConnectionsApi.list(userId);
  }

  async function saveConnection(data: { name: string; token: string }) {
    const userId = auth.user?.user_id;
    if (!userId) {
      throw new Error("No existe un usuario autenticado");
    }

    if (figmaConnections.value.length === 0) {
      const created = await figmaConnectionsApi.create({
        userId,
        name: data.name,
        personalAccessToken: data.token,
      });
      figmaConnections.value.push(created);
      return created;
    }

    const updated = await figmaConnectionsApi.update(
      figmaConnections.value[0].connectionId,
      {
        name: data.name,
        personalAccessToken: data.token,
      },
    );
    figmaConnections.value[0] = updated;
    return updated;
  }

  // ==========================================
  // PROJECT REVIEWERS
  // ==========================================
  async function assignReviewer(data: {
    projectId: string;
    userId: string;
    roleId: string | number;
  }) {
    const created = await projectReviewersApi.create({
      projectId: data.projectId,
      userId: data.userId,
      roleId: data.roleId,
      assignedBy: userAuthId as string,
    });
    projectReviewers.value.push(created);
    return created;
  }

  async function fetchProjectReviewers(projectId: string) {
    try {
      const response = await fetch(
        `/api/project-reviewers/project/${projectId}`,
      );
      if (!response.ok) {
        throw new Error("Error al cargar revisores del proyecto");
      }
      const data = await response.json();
      projectReviewers.value = data;
      return data;
    } catch (error) {
      console.error("Error fetching project reviewers:", error);
      throw error;
    }
  }

  async function deleteReviewer(reviewerId: string) {
    try {
      const response = await projectReviewersApi.delete(reviewerId);
      projectReviewers.value = projectReviewers.value.filter(
        (r: any) => r.project_reviewer_id !== reviewerId,
      );
      return response;
    } catch (error) {
      console.error("Error deleting reviewer:", error);
      throw error;
    }
  }

  // ==========================================
  // REQUIREMENTS
  // ==========================================
async function fetchRequirements(projectId: string) {
  requirements.value = await requirementsApi.findByProject(projectId)
  return requirements.value
}


// ✅ Obtener requerimientos globales del semestre
async function fetchRequirementsBySemester(semesterId: string) {
  try {
    requirements.value = await requirementsApi.findBySemester(semesterId)
    return requirements.value
  } catch (error: any) {
    console.error('Error fetching global requirements:', error)
    throw new Error(error.message || 'No se pudieron cargar los requerimientos globales')
  }
}


async function fetchRequirementsWithGlobals(projectId: string) {
  // Obtener el proyecto
  const project = projects.value.find(p => p.projectId === projectId)
  if (!project) {
    throw new Error('Proyecto no encontrado')
  }
  
  if (!project.semesterId) {
    const projectRequirements = await requirementsApi.findByProject(projectId)
    requirements.value = projectRequirements
    return requirements.value
  }
  
  const projectRequirements = await requirementsApi.findByProject(projectId)
  
  const globalRequirements = await requirementsApi.findBySemester(project.semesterId)
  
  const allRequirements = [...projectRequirements, ...globalRequirements]
  allRequirements.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  
  requirements.value = allRequirements
  return requirements.value
}


async function createRequirement(payload: {
  projectId?: string
  semesterId?: string
  code: string
  title: string
  description: string
  acceptanceCriteria?: string
}) {
  // ✅ Asegurar que userAuthId existe
  if (!userAuthId) {
    throw new Error('No hay usuario autenticado para crear el requerimiento')
  }
  
  const createData = {
    code: payload.code,
    title: payload.title,
    description: payload.description,
    acceptanceCriteria: payload.acceptanceCriteria || '',
    createdBy: userAuthId, 
  }
  
  let requirement
  
  if (payload.projectId) {
    // Requerimiento específico del proyecto
    requirement = await requirementsApi.create({
      ...createData,
      projectId: payload.projectId,
    })
  } else if (payload.semesterId) {
    // Requerimiento global del semestre
    requirement = await requirementsApi.create({
      ...createData,
      semesterId: payload.semesterId,
    })
  } else {
    throw new Error('Se requiere projectId o semesterId para crear el requerimiento')
  }
  
  requirements.value.push(requirement)
  return requirement
}

// ✅ Actualizar requerimiento existente
async function updateRequirement(requirementId: string, payload: {
  code?: string
  title?: string
  description?: string
  acceptanceCriteria?: string
}) {
  const requirement = await requirementsApi.update(requirementId, payload)
  
  const idx = requirements.value.findIndex((r) => r.requirementId === requirementId)
  if (idx !== -1) {
    requirements.value[idx] = requirement
  }
  
  return requirement
}

// ✅ Eliminar requerimiento
async function deleteRequirement(requirementId: string) {
  await requirementsApi.delete(requirementId)
  requirements.value = requirements.value.filter(
    (r) => r.requirementId !== requirementId,
  )
}

  // ==========================================
  // SEMESTER - Métodos auxiliares
  // ==========================================
  function getCurrentSemester() {
    return semesterStore.currentSemester;
  }

  function setCurrentSemester(semesterId: string) {
    semesterStore.setCurrentSemester(semesterId);
  }

  function getCurrentSemesterId() {
    return semesterStore.currentSemester?.semesterId || null;
  }

  // ==========================================
  // EXPORT
  // ==========================================
  return {
    // State
    students,
    roles,
    projects,
    nodes,
    tasks,
    flows,
    flowClicks,
    loading,
    requirements,
    projectReviewers,
    figmaConnections,
    flowsByTask,

    // Getters
    currentSemesterId,
    getCurrentSemester,
    getCurrentSemesterId,
    getFlowsByTask,

    // Students
    fetchStudents,
    fetchStudentsBySemester,
    createStudent,
    assignStudentToSemester,
    unassignStudentFromSemester,

    // Roles
    fetchRoles,

    // Projects
    fetchProjects,
    fetchProjectsBySemester,
    createProject,
    assignProjectToSemester,
    unassignProjectFromSemester,

    // Figma Nodes
    fetchNodes,

    // Tasks
    fetchTasks,
    fetchTasksByRequirement,
    createTask,
    updateTask,
    updateTaskOrder,
    deleteTask,

    // Flows
    fetchFlows,
    createFlow,
    registerFlowClick,
    finishFlow,
    deleteFlow,
    fetchFlowClicks,

    // Requirements
    fetchRequirements,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    fetchRequirementsBySemester,

    // Figma Connections
    fetchFigmaConnections,
    saveConnection,

    // Reviewers
    assignReviewer,
    fetchProjectReviewers,
    deleteReviewer,

    // Semester
    setCurrentSemester,
  };
});
