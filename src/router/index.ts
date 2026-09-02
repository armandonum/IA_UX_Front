import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { RoleName } from '@/types'

// ── Route declarations ────────────────────────────────────────────────────────
const routes: RouteRecordRaw[] = [
  // Public
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true },
  },

  // Protected shell
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },

      // Role-agnostic dashboard (redirects internally by role)
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { requiresAuth: true },
      },

      // ── Administrador ──────────────────────────────────────────────────────
      {
        path: 'admin',
        name: 'admin',
        component: () => import('@/views/roles/AdminView.vue'),
        meta: { roles: ['Administrador'] as RoleName[] },
      },

      // ── Usuarios (admin + coordinador) ────────────────────────────────────
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/roles/coordinador/UsersManagementView.vue'),
        meta: { roles: ['Administrador', 'Coordinador'] as RoleName[] },
      },

      // ── Roles (solo admin) ────────────────────────────────────────────────
      {
        path: 'roles',
        name: 'roles',
        component: () => import('@/views/roles/RolesManagementView.vue'),
        meta: { roles: ['Administrador'] as RoleName[] },
      },

      // ── Coordinador ───────────────────────────────────────────────────────
      {
        path: 'Coordinador',
        name: 'Coordinador',
        component: () => import('@/views/roles/coordinador/CoordinadorView.vue'),
        meta: { roles: ['Coordinador', 'Administrador'] as RoleName[] },
      },
           // ── Coordinador ───────────────────────────────────────────────────────
      {
        path: 'Coordinador/Projects',
        name: 'Coordinadorprojects',
        component: () => import('@/views/roles/coordinador/ProjectView.vue'),
        meta: { roles: ['Coordinador', 'Administrador'] as RoleName[] },
      },


      // ── Docente ───────────────────────────────────────────────────────────
      {
        path: 'docente',
        name: 'docente',
        component: () => import('@/views/roles/DocenteView.vue'),
        meta: { roles: ['Docente', 'Administrador'] as RoleName[] },
      },

      // ── Estudiante ────────────────────────────────────────────────────────
      {
        path: 'estudiante',
        name: 'estudiante',
        component: () => import('@/views/roles/estudiante/EstudianteProyectosView.vue'),
        meta: { roles: ['Estudiante', 'Administrador'] as RoleName[] },
      },
 {
    path: '/estudiante/evaluacion/:fileKey',
    name: 'estudiante-evaluacion',
    component: () => import('@/views/roles/estudiante/EstudianteUsabilityView.vue'),
    props: true,
  },
      // ── Experto UX ────────────────────────────────────────────────────────
      {
        path: 'ux',
        name: 'ux',
        component: () => import('@/views/roles/ExpertoUXView.vue'),
        meta: { roles: ['Experto UX', 'Administrador'] as RoleName[] },
      },

      {
  path: '/experto/sesiones/:sessionId',
  name: 'experto-sesion-detalle',
  component: () => import('@/views/roles/experto/SessionDetailView.vue'),
},

  {
    path: '/heuristica',
    name: 'experto-proyectos-heuristic',
    component: () => import('@/views/roles/experto/heuristic/HeuristicProjectsView.vue'),

    meta: { requiresAuth: true, roles: ['Experto UX', 'Administrador'] }
  },
   {
    path: '/cognitivo',
    name: 'experto-cognitive',
    component: () => import('@/views/roles/experto/cognitive/CognitiveView.vue'),

    meta: { requiresAuth: true, roles: ['Experto UX', 'Administrador'] }
  },
  
{
  path: '/experto/heuristic/:fileKey',
  name: 'experto-heuristic',
  component: () => import('@/views/roles/experto/heuristic/HeuristicEvaluationView.vue')
},

      // ── Moderador ─────────────────────────────────────────────────────────
      {
        path: 'moderador',
        name: 'moderador',
        component: () => import('@/views/roles/ModeradorView.vue'),
        meta: { roles: ['moderador', 'Administrador'] as RoleName[] },
      },

      // ── Observador ────────────────────────────────────────────────────────
      {
        path: 'observador',
        name: 'observador',
        component: () => import('@/views/roles/ObservadorView.vue'),
        meta: { roles: ['observador', 'Administrador'] as RoleName[] },
      },

      // ── Especialista IA ───────────────────────────────────────────────────
      {
        path: 'ia',
        name: 'ia',
        component: () => import('@/views/roles/EspecialistaIAView.vue'),
        meta: { roles: ['especialista IA', 'Administrador'] as RoleName[] },
      },

      // ── Responsable Ético ─────────────────────────────────────────────────
      {
        path: 'etico',
        name: 'etico',
        component: () => import('@/views/roles/ResponsableEticoView.vue'),
        meta: { roles: ['responsable ético', 'Administrador'] as RoleName[] },
      },

      // ── Perfil / cambio de contraseña ─────────────────────────────────────
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/auth/ProfileView.vue'),
        meta: { requiresAuth: true },
      },

      // ── 403 ───────────────────────────────────────────────────────────────
      {
        path: 'forbidden',
        name: 'forbidden',
        component: () => import('@/views/ForbiddenView.vue'),
      },
    ],
  },

  // Catch-all
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

// ── Router instance ───────────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ── Navigation guard ──────────────────────────────────────────────────────────
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Restore session on full page reload
  if (!auth.user && auth.accessToken) {
    await auth.fetchMe()
  }

  if (to.meta.public) return true

  if (!auth.isAuthenticated) return { name: 'login' }

  const allowedRoles = to.meta.roles as RoleName[] | undefined
  console.log('auth.currentRole:', auth.currentRole)
console.log('allowedRoles:', allowedRoles)
  if (allowedRoles && !allowedRoles.includes(auth.currentRole as RoleName)) {
    return { name: 'forbidden' }
  }

  return true
})

export default router
