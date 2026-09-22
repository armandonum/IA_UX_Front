<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-100">Gestión de Roles</h1>
        <p class="text-sm text-slate-500 mt-0.5">Define y administra los roles del sistema</p>
      </div>
      <button @click="openCreate" class="btn-primary btn-sm">+ Nuevo rol</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="role in rolesStore.roles"
        :key="role.role_id"
        class="card group hover:border-slate-700 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" :class="roleColor(role.name)">
              {{ roleIcon(role.name) }}
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-200 capitalize">{{ role.name }}</p>
              <p class="text-xs text-slate-500 mt-0.5 font-mono">{{ role.code }}</p>
            </div>
          </div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button v-if="!role.is_system_role" @click="openEdit(role)" class="btn-ghost btn-sm p-1.5">✏️</button>
            <button v-if="!role.is_system_role" @click="confirmDelete(role)" class="btn-ghost btn-sm p-1.5 text-red-400">🗑️</button>
            <span v-if="role.is_system_role" class="text-xs text-slate-600 px-2 self-center">sistema</span>
          </div>
        </div>
        <p v-if="role.description" class="text-xs text-slate-500 mt-3">{{ role.description }}</p>
      </div>

      <div v-if="rolesStore.loading" class="col-span-3 text-center text-slate-500 py-10">Cargando…</div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="modalOpen = false">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 class="text-base font-semibold text-slate-100">{{ editingRole ? 'Editar rol' : 'Nuevo rol' }}</h2>
            <button @click="modalOpen = false" class="btn-ghost btn-sm p-1.5 rounded-lg">✕</button>
          </div>
          <form @submit.prevent="handleSave" class="p-6 space-y-4">
            <div v-if="!editingRole">
              <label class="form-label">Código (único)</label>
              <input v-model="form.code" type="text" class="form-input font-mono" placeholder="ej: tutor_externo" required />
            </div>
            <div>
              <label class="form-label">Nombre del rol</label>
              <input v-model="form.name" type="text" class="form-input" required />
            </div>
            <div>
              <label class="form-label">Descripción (opcional)</label>
              <textarea v-model="form.description" class="form-input resize-none" rows="2"></textarea>
            </div>
            <div class="flex gap-3">
              <button type="button" @click="modalOpen = false" class="btn-secondary flex-1">Cancelar</button>
              <button type="submit" class="btn-primary flex-1" :disabled="saving">
                {{ saving ? '…' : (editingRole ? 'Guardar' : 'Crear') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRolesStore } from '@/stores/roles.store'
import { useToast } from '@/composables/useToast'
import type { Role } from '@/types'

const rolesStore = useRolesStore()
const toast = useToast()
onMounted(() => rolesStore.fetchAll())

const modalOpen = ref(false)
const editingRole = ref<Role | null>(null)
const saving = ref(false)
const form = reactive({ code: '', name: '', description: '' })

function openCreate() {
  editingRole.value = null
  form.code = ''; form.name = ''; form.description = ''
  modalOpen.value = true
}
function openEdit(role: Role) {
  editingRole.value = role
  form.code = role.code; form.name = role.name; form.description = role.description ?? ''
  modalOpen.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (editingRole.value) {
      await rolesStore.update(editingRole.value.role_id, { name: form.name, description: form.description })
      toast.success('Rol actualizado')
    } else {
      await rolesStore.create({ code: form.code, name: form.name, description: form.description })
      toast.success('Rol creado')
    }
    modalOpen.value = false
  } catch {
    toast.error('Error al guardar el rol')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(role: Role) {
  if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return
  try {
    await rolesStore.remove(role.role_id)
    toast.success('Rol eliminado')
  } catch {
    toast.error('No se pudo eliminar el rol')
  }
}

const ICONS: Record<string, string> = {
  Administrador: '⚙️', Coordinador: '📋', Docente: '📚',
  Estudiante: '🎓', 'Experto UX': '🎨', moderador: '🛡️',
  observador: '👁️', 'especialista IA': '🤖', 'responsable ético': '⚖️',
}
const COLORS: Record<string, string> = {
  Administrador: 'bg-violet-500/20', Coordinador: 'bg-blue-500/20',
  Docente: 'bg-emerald-500/20', Estudiante: 'bg-cyan-500/20',
  'experto UX': 'bg-pink-500/20', moderador: 'bg-orange-500/20',
  observador: 'bg-slate-500/20', 'especialista IA': 'bg-teal-500/20',
  'responsable ético': 'bg-amber-500/20',
}
const roleIcon = (name: string) => ICONS[name] ?? '🔑'
const roleColor = (name: string) => COLORS[name] ?? 'bg-slate-600/20'
</script>
