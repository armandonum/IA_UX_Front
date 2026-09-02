export interface Role {
  role_id: string
  name: string // ej. 'estudiante', 'revisor', 'docente'
}

export interface User {
  user_id: string
  display_name: string
  email: string
  roles?: Role[]
}

export interface FigmaProject {
  projectId: string
  fileKey: string
  projectName: string
  thumbnailUrl?: string
  version?: string
  lastModified?: string
  semesterId?: string
  fetchedAt?: string
}

export interface FigmaNode {
  node_id: string
  project_id: string
  parent_node_id: string | null
  name: string
  type: string
  is_screen: boolean
}

export interface Task {
  taskId: string
  projectId: string
  requirementId: string
  title: string
  description: string
  orderIndex: number
  createdAt: string
}

export interface FlowClick {
  click_id: string
  flow_id: string
  user_id: string
  order_index: number
  node_id: string
  presented_node_id: string | null
  clicked_at: string
}
export interface Flow {
  flowId: string
  task_id: string
  project_id: string
  status: string
  name: string

}

export interface UserRole {
  user_role_id?: string
  user_id: string
  role_id: string
  project_id?: string 
}


export interface FigmaConnection {
  connectionId: string
  user_id: string
  name: string
  personalAccessToken: string
  created_at: string
}


export interface ProjectReviewer {
  proyectId:string
  userId: string
  roleId: string
  assignedBy: string

}