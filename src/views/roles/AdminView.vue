<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold text-slate-100">Panel de Administración</h1>
      <p class="text-sm text-slate-500 mt-0.5">Vista general del sistema</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Usuarios totales" :value="usersStore.users.length" icon="👥" color="blue" />
      <StatCard label="Roles configurados" :value="rolesStore.roles.length" icon="🔑" color="violet" />
      <StatCard label="Usuarios activos" :value="activeUsers" icon="✅" color="emerald" />
      <StatCard label="Sistema" value="OK" icon="🟢" color="emerald" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Usuarios recientes</h2>
          <RouterLink to="/users" class="text-xs text-primary-400 hover:text-primary-300">Ver todos →</RouterLink>
        </div>
        <div class="space-y-2">
          <div
            v-for="user in recentUsers"
            :key="user.user_id"
            class="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0"
          >
            <div class="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-semibold text-white shrink-0 uppercase">
              {{ avatarInitials(user.display_name) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-200 truncate">{{ user.display_name }}</p>
              <p class="text-xs text-slate-500 truncate">{{ user.email }}</p>
            </div>
            <span class="badge capitalize bg-slate-700 text-slate-400 text-[10px]">{{ user.role?.name }}</span>
          </div>
          <p v-if="!recentUsers.length" class="text-sm text-slate-500 py-4 text-center">No hay usuarios</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Distribución por rol</h2>
          <RouterLink to="/roles" class="text-xs text-primary-400 hover:text-primary-300">Gestionar →</RouterLink>
        </div>
        <div class="space-y-2.5">
          <div v-for="(count, roleName) in roleDistribution" :key="roleName" class="flex items-center gap-3">
            <span class="text-sm capitalize text-slate-300 w-36 truncate">{{ roleName }}</span>
            <div class="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full transition-all"
                :style="{ width: usersStore.users.length ? `${(count / usersStore.users.length) * 100}%` : '0%' }"
              ></div>
            </div>
            <span class="text-xs text-slate-500 w-5 text-right">{{ count }}</span>
          </div>
          <p v-if="!usersStore.users.length" class="text-sm text-slate-500 py-4 text-center">Sin datos</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users.store'
import { useRolesStore } from '@/stores/roles.store'
import StatCard from '@/components/common/StatCard.vue'

const usersStore = useUsersStore()
const rolesStore = useRolesStore()

onMounted(async () => {
  await usersStore.fetchAll()
  await rolesStore.fetchAll()
})

const activeUsers = computed(() => usersStore.users.filter((u) => u.status === 'active').length)
const recentUsers = computed(() => usersStore.users.slice(0, 5))
const roleDistribution = computed(() => {
  const dist: Record<string, number> = {}
  usersStore.users.forEach((u) => {
    const name = u.role?.name ?? 'sin rol'
    dist[name] = (dist[name] ?? 0) + 1
  })
  return dist
})

function avatarInitials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`
  return name.slice(0, 2)
}
</script>
