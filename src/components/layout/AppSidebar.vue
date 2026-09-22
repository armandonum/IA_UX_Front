<template>
<q-drawer
    v-model="drawerModel"
    show-if-above
    bordered
    class="text-black"
    :width="240"
    :mini-width="64"
    :mini="collapsed" 
  >
    <!-- Logo -->
    <q-toolbar class="q-py-sm">
      <q-avatar color="primary" text-color="white">
        E
      </q-avatar>

      <q-toolbar-title v-if="!collapsed">
        EduPlatform
      </q-toolbar-title>
    </q-toolbar>

    <q-separator dark />

    <!-- Menú -->
    <q-list padding>

      <q-item
        v-for="item in filteredNav"
        :key="item.to"
        clickable
        v-ripple
        :to="item.to"
        :active="isActive(item.to)"
        active-class="bg-primary text-white"
      >
       <q-item-section avatar>
  <q-icon
    :name="item.icon"
    size="22px"
    color="grey-4"
  />
</q-item-section>

        <q-item-section v-if="!collapsed">
          {{ item.label }}
        </q-item-section>
      </q-item>

    </q-list>

    <q-space />

    <!-- <q-separator dark /> -->

    <!-- Usuario -->
    <q-item class="q-pa-md">
      <q-item-section avatar>
        <q-avatar color="primary">
          {{ avatarInitials }}
        </q-avatar>
      </q-item-section>

      <q-item-section v-if="!collapsed">
        <q-item-label>
          {{ auth.user?.display_name }}
        </q-item-label>

        <q-item-label caption class="text-grey-5">
          {{ auth.user?.email }}
        </q-item-label>
      </q-item-section>
    </q-item>

  </q-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { usePermissions } from '@/composables/usePermissions'

defineProps<{
  collapsed: boolean
}>()

const drawerModel = defineModel<boolean>()

const auth = useAuthStore()
console.log("el usuario tiene:", auth)
const route = useRoute()
const { role } = usePermissions()

const avatarInitials = computed(() => {
  const name = auth.user?.display_name ?? ''

  const parts = name.trim().split(' ')

  if (parts.length >= 2)
    return parts[0][0] + parts[1][0]

  return name.substring(0, 2)
})

interface NavItem {
  to: string
  icon: string
  label: string
  roles?: string[]
}

const allNavItems: NavItem[] = [
  { to: '/dashboard', icon: 'dashboard', label: 'Inicio' },

  { to: '/admin', icon: 'admin_panel_settings', label: 'Administración', roles: ['Administrador'] },

  { to: '/users', icon: 'group', label: 'Usuarios', roles: ['Administrador', 'Coordinador'] },

  { to: '/roles', icon: 'key', label: 'Roles', roles: ['Administrador'] },

  { to: '/coordinador/projects', icon: 'folder', label: 'Proyectos', roles: ['Coordinador', 'Administrador'] },



  { to: '/Coordinador', icon: 'assignment', label: 'Método Cognitivo', roles: ['Coordinador', 'Administrador'] },
  { 
  to: '/coordinador/heuristico', 
  icon: 'fact_check', 
  label: 'Método Heurístico', 
  roles: ['Coordinador', 'Administrador'] 
},  
  
    
  { to: '/docente', icon: 'school', label: 'Mi Clase', roles: ['Docente', 'Administrador'] },

  { to: '/estudiante', icon: 'menu_book', label: 'EXPERIMENTOS FORMALES ', roles: ['Estudiante', 'Administrador'] },

  { to: '/ux', icon: 'design_services', label: 'Método Experimentos Formales', roles: ['Experto UX', 'Administrador'] },

  { to: '/heuristica', icon: 'task', label: 'Método Heurístico', roles: ['Experto UX', 'Administrador'] },

  { to: '/cognitivo', icon: 'assessment', label: 'Método Cógnitivo', roles: ['Experto UX', 'Administrador'] },

  { to: '/moderador', icon: 'gpp_good', label: 'Moderación', roles: ['moderador', 'Administrador'] },

  { to: '/observador', icon: 'visibility', label: 'Observación', roles: ['observador', 'Administrador'] },

  { to: '/ia', icon: 'smart_toy', label: 'IA & Modelos', roles: ['especialista IA', 'Administrador'] },

  { to: '/etico', icon: 'balance', label: 'Ética', roles: ['responsable ético', 'Administrador'] },

  { to: '/profile', icon: 'person', label: 'Mi Perfil' },
]

const filteredNav = computed(() =>
  allNavItems.filter(item => !item.roles || item.roles.includes(role.value ?? ''))
)

function isActive(path: string) {
  return route.path === path || (path !== '/dashboard' && route.path.startsWith(path))
}
</script>