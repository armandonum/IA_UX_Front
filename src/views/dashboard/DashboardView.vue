<template>
  <q-btn
    color="primary"
    icon="dashboard"
    :label="`Ir al panel de ${auth.user?.roles[0].name}`"
    @click="goToRoleView"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { RoleName } from '@/types'

const router = useRouter()
const auth = useAuthStore()

const roleRoutes: Record<RoleName, string> = {
  Administrador: 'admin',
  Coordinador: 'Coordinador',
  Docente: 'docente',
  Estudiante: 'estudiante',
  'experto UX': 'ux',
  moderador: 'moderador',
  observador: 'observador',
  'especialista IA': 'ia',
  'responsable ético': 'etico',
}


console.log(" el rolde del usuario ser :", auth.user?.roles[0].code)
const buttonLabel = computed(() => `Ir al panel de ${auth.user?.roles[0].code}`)



const goToRoleView = () => {
  const routeName = roleRoutes[auth.user?.roles[0].name as RoleName] ?? 'dashboard'
  router.push({ name: routeName })
}
</script>