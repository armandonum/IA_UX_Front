<template>
<q-header elevated>

    <q-toolbar>

        <q-btn
            flat
            dense
            round
            icon="menu"
            @click="$emit('toggle-sidebar')"
        />

        <q-toolbar-title>

            {{ pageCrumb }}

        </q-toolbar-title>

        <q-chip
            color="primary"
            text-color="white"
        >
            {{ auth.currentRole }}
        </q-chip>

        <q-btn
            round
            flat
        >
            <q-avatar color="primary">
                {{ avatarInitials }}
            </q-avatar>

            <q-menu>

                <q-list style="min-width:200px">

                    <q-item clickable to="/profile">
                        <q-item-section avatar>
                            <q-icon name="person"/>
                        </q-item-section>

                        <q-item-section>
                            Mi Perfil
                        </q-item-section>
                    </q-item>

                    <q-separator/>

                    <q-item clickable @click="handleLogout">

                        <q-item-section avatar>
                            <q-icon name="logout"/>
                        </q-item-section>

                        <q-item-section>
                            Cerrar sesión
                        </q-item-section>

                    </q-item>

                </q-list>

            </q-menu>

        </q-btn>

    </q-toolbar>

</q-header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

defineEmits(['toggle-sidebar'])

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const avatarInitials = computed(() => {
  const name = auth.user?.display_name ?? ''
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`
  return name.slice(0, 2)
})

const pageCrumb = computed(() => {
  const map: Record<string, string> = {
    '/dashboard': 'Inicio', '/admin': 'Administración',
    '/users': 'Gestión de Usuarios', '/roles': 'Gestión de Roles',
    '/profile': 'Mi Perfil',
     '/Coordinador': 'Coordinación',
     'Coordinador/Projects':'Gestión de proyectos',
    '/docente': 'Mi Clase', '/estudiante': 'EXPERIMENTOS FORMALES',
    '/ux': 'Método Experimentos Formales', '/moderador': 'Moderación',
    '/euristica': 'Heuristico', '/': 'Moderación',
    '/observador': 'Observación', '/ia': 'IA & Modelos', '/etico': 'Ética',
  }
  return map[route.path] ?? route.path
})

const roleBadgeClass = computed(() => {
  const map: Record<string, string> = {
    Administrador: 'bg-violet-500/20 text-violet-300',
    Coordinador: 'bg-blue-500/20 text-blue-300',
    Docente: 'bg-emerald-500/20 text-emerald-300',
    Estudiante: 'bg-cyan-500/20 text-cyan-300',
    'Experto UX': 'bg-pink-500/20 text-pink-300',
    moderador: 'bg-orange-500/20 text-orange-300',
    observador: 'bg-slate-500/20 text-slate-300',
    'especialista IA': 'bg-teal-500/20 text-teal-300',
    'responsable ético': 'bg-amber-500/20 text-amber-300',
  }
  return map[auth.currentRole ?? ''] ?? 'bg-slate-500/20 text-slate-300'
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>
