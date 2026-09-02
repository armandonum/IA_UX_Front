/**
 * Cliente API para el panel de docente.
 *
 * AJUSTA la BASE_URL y las rutas de cada endpoint según tus controllers
 * reales en eval-core-api/src/modules/*. Los nombres de aquí son mi mejor
 * suposición según los nombres de tus carpetas de módulos.
 */
import type {
  User,
  Role,
  FigmaProject,
  FigmaNode,
  Task,
  Flow,
  FlowClick,
  UserRole,
  FigmaConnection,
  ProjectReviewer
} from '@/types/docente.types'
import { requirementsApi } from './requirements.api'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('accessToken')

  const headers: Record<string, string> = {
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Error ${res.status} en ${path}: ${text}`)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

/* ============================ USERS / ESTUDIANTES ============================ */
export const usersApi = {
  list: () => request<User[]>('/users'),
  create: (data: {
  email: string
  password: string
  displayName: string
  status: string
  roleIds: string[]
}) =>
  request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  remove: (userId: string) =>
    request<void>(`/users/${userId}`, { method: 'DELETE' }),
}

/* ============================ ROLES ============================ */
export const rolesApi = {
  list: () => request<Role[]>('/roles'),
}

/* ============================ USER-ROLES (asignar revisor) ============================ */
/* ============================ PROJECT REVIEWERS ============================ */

export const projectReviewersApi = {

  listByProject: (projectId: string) =>
    request<ProjectReviewer[]>(
      `/project-reviewers/project/${projectId}`,
    ),

  listByUser: (userId: string) =>
    request<ProjectReviewer[]>(
      `/project-reviewers/user/${userId}`,
    ),

  create: (data: {
    projectId: string
    userId: string
    roleId: string | number
    assignedBy: string
  }) =>
    request<ProjectReviewer>(
      '/project-reviewers',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  delete: (projectReviewerId: string) =>
    request<void>(
      `/project-reviewers/${projectReviewerId}`,
      {
        method: 'DELETE',
      },
    ),

}





export const userRolesApi = {
  listByProject: (projectId: string) =>
    request<UserRole[]>(`/user-roles?project_id=${projectId}`),
  assign: (data: UserRole) =>
    request<UserRole>('/user-roles', { method: 'POST', body: JSON.stringify(data) }),
  remove: (userRoleId: string) =>
    request<void>(`/user-roles/${userRoleId}`, { method: 'DELETE' }),
}

/* ============================ FIGMA PROJECTS ============================ */
export const figmaProjectsApi = {
  list: () =>
    request<FigmaProject[]>('/figma-projects'),

  create: (formData: FormData) =>
    request<FigmaProject>('/figma-projects', {
      method: 'POST',
      body: formData,
    }),

  resync: (projectId: string) =>
    request<FigmaProject>(
      `/figma-projects/${projectId}/sync`,
      {
        method: 'POST',
      },
    ),
}

/* ============================ FIGMA NODES ============================ */
export const figmaNodesApi = {
  listByProject: (projectId: string) =>
    request<FigmaNode[]>(`/figma-nodes?project_id=${projectId}`),
}
/* ============================ TASKS ============================ */
export const tasksApi = {
  listByProject: (projectId: string) =>
    request<Task[]>(`/tasks?project_id=${projectId}`),
  
  create: (data: { projectId: string; title: string; description: string }) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (taskId: string, data: { 
    title?: string; 
    description?: string; 
    status?: string;
    assigned_to?: string;
    due_date?: string;
  }) =>
    request<Task>(`/tasks/${taskId}`, { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
  updateOrder: (
  taskId: string,
  orderIndex: number,
) =>
  request<Task>(`/tasks/${taskId}/order`, {
    method: 'PATCH',
    body: JSON.stringify({
      orderIndex,
    }),
  }),
  delete: (taskId: string) =>
    request<void>(`/tasks/${taskId}`, { method: 'DELETE' }),

  findByRequirement: ( requirementId: string)  =>
    request<Task[]>(`/tasks/requirement/${requirementId}`),

  getById: (taskId: string) =>
    request<Task>(`/tasks/${taskId}`),
}
/* ============================ FLOWS + FLOW STEPS ============================ */
export const flowsApi = {
  listByTask: (taskId: string) =>
    request<Flow[]>(`/flows/task/${taskId}`),
  create: (data: {
    taskId: string
    projectId: string
    name: string
  }) => request<Flow>('/flows', { method: 'POST', body: JSON.stringify(data) }),
  finish: (flowId: string) =>
    request<void>(`/flows/${flowId}/finish`, { method: 'PATCH' }),
  delete: (flowId: string) =>
    request<void>(`/flows/${flowId}`, { method: 'DELETE' }),
}


export const flowClicksApi = {
  create: (data: {
    flowId: string
    orderIndex: number
    nodeId: string
    presentedNodeId: string | null
  }) =>
    request<FlowClick>('/flow-clicks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listByFlow: (flowId: string) => request<FlowClick[]>(`/flow-clicks/flow/${flowId}`)
}
/* ============================ FIGMA CONNECTION ============================ */

export const figmaConnectionsApi = {
  list: (userId: string) =>
    request<FigmaConnection[]>(
      `/figma-connections?user_id=${userId}`
    ),

 create: (data: {
  userId: string
  name: string
  personalAccessToken: string
}) =>
  request<FigmaConnection>('/figma-connections', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

update: (
  id: string,
  data: {
    name: string
    personalAccessToken: string
  },
) =>
  request<FigmaConnection>(`/figma-connections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  remove: (id: string) =>
    request<void>(`/figma-connections/${id}`, {
      method: 'DELETE',
    }),
}

export async function fetchFigmaFile(
  token: string,
  fileKey: string,
) {
  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}`,
    {
      headers: {
        'X-Figma-Token': token,
      },
    },
  )

  if (!res.ok) {
    throw new Error(await res.text())
  }

  const json = await res.json()

  return {
    metadata: {
      version: json.version,
      lastModified: json.lastModified,
      thumbnailUrl: json.thumbnailUrl,
      name: json.name,
    },
    raw: json,
  }
}