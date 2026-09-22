<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold text-slate-100">Panel de Moderación</h1>
      <p class="text-sm text-slate-500 mt-0.5">Gestiona el contenido y la comunidad</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Reportes pendientes" value="—" icon="🚨" color="red" />
      <StatCard label="Contenido revisado" value="—" icon="✅" color="emerald" />
      <StatCard label="Usuarios activos" :value="usersStore.users.filter(u=>u.status === 'active').length" icon="👥" color="blue" />
      <StatCard label="Alertas" value="0" icon="🛡️" color="amber" />
    </div>
    <div class="card">
      <h2 class="card-title mb-4">Cola de moderación</h2>
      <p class="text-sm text-slate-500">No hay elementos pendientes de revisión.</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUsersStore } from '@/stores/users.store'
import StatCard from '@/components/common/StatCard.vue'
const usersStore = useUsersStore()
onMounted(() => usersStore.fetchAll())
</script>
