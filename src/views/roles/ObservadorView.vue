<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold text-slate-100">Vista de Observación</h1>
      <p class="text-sm text-slate-500 mt-0.5">Acceso de solo lectura al estado de la plataforma</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard label="Total usuarios" :value="usersStore.users.length" icon="👥" color="blue" />
      <StatCard label="Usuarios activos" :value="usersStore.users.filter(u=>u.status === 'active').length" icon="✅" color="emerald" />
      <StatCard label="Roles" :value="rolesStore.roles.length" icon="🔑" color="violet" />
    </div>
    <div class="card">
      <h2 class="card-title mb-3">Nota</h2>
      <p class="text-sm text-slate-400">Este rol tiene acceso de <span class="text-amber-300 font-medium">solo lectura</span>. No puede crear, editar ni eliminar registros.</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUsersStore } from '@/stores/users.store'
import { useRolesStore } from '@/stores/roles.store'
import StatCard from '@/components/common/StatCard.vue'
const usersStore = useUsersStore()
const rolesStore = useRolesStore()
onMounted(async () => { await usersStore.fetchAll(); await rolesStore.fetchAll() })
</script>
