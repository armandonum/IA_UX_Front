// ──────────────────────────────────────────────
// Auth types
// ──────────────────────────────────────────────
export interface LoginPayload {
  email: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// El backend devuelve tokens + el usuario en el login
export interface AuthResponse extends TokenPair {
  user: User
}

// ──────────────────────────────────────────────
// Role — coincide con auth.roles
// ──────────────────────────────────────────────
export type RoleName =
  | 'Administrador'
  | 'Coordinador'
  | 'Docente'
  | 'Estudiante'
  | 'Experto UX'
  | 'moderador'
  | 'observador'
  | 'especialista IA'
  | 'responsable ético'

export interface Role {
  role_id: number
  code: string
  name: RoleName
  description?: string | null
  is_system_role: boolean
}

// ──────────────────────────────────────────────
// User — coincide con auth.users
// ──────────────────────────────────────────────
export type UserStatus = 'active' | 'inactive' | 'banned' | string

export interface User {
  user_id: string
  created_by?: string | null
  email: string
  display_name: string
  status: UserStatus
  last_login_at?: string | null
  created_at: string
  updated_at: string
  role?: Role              // relación eager que puede venir del backend
}

// ──────────────────────────────────────────────
// Payloads CRUD
// ──────────────────────────────────────────────
export interface CreateUserPayload {
  email: string
  password: string
  display_name: string
  role_id?: number
  institution_id?: string
}

export interface UpdateUserPayload {
  email?: string
  display_name?: string
  role_id?: number
  status?: UserStatus
  institution_id?: string
}

export interface CreateRolePayload {
  code: string
  name: string
  description?: string
  is_system_role?: boolean
}

export interface UpdateRolePayload {
  name?: string
  description?: string
}

// ──────────────────────────────────────────────
// API generic types
// ──────────────────────────────────────────────
export interface ApiError {
  message: string | string[]
  error?: string
  statusCode?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
