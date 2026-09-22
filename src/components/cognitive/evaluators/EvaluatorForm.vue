<!-- components/evaluators/EvaluatorForm.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 500px; max-width: 700px;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Asignar Evaluadores</div>
        <div class="text-subtitle2">Selecciona los evaluadores para esta evaluación</div>
        <div v-if="creatorName" class="text-caption q-mt-xs text-white/70">
          Usuarios creados por: {{ creatorName }}
        </div>
      </q-card-section>

      <q-card-section>
        <div class="text-sm text-slate-500 q-mb-md">
          Usuarios disponibles para asignar ({{ filteredUsers.length }})
        </div>

        <!-- 🔥 SELECTOR DE FILTRO -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="filterRole"
              filled
              dense
              :options="roleFilterOptions"
              label="Filtrar por rol"
              emit-value
              map-options
              clearable
            />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="filterSearch"
              filled
              dense
              clearable
              debounce="300"
              label="Buscar por nombre o email"
              prepend-icon="search"
            />
          </div>
        </div>

        <q-list bordered separator class="rounded-lg">
          <q-item
            v-for="user in filteredUsers"
            :key="user.user_id"
            class="hover:bg-slate-700 transition-colors"
          >
            <q-item-section avatar>
              <q-checkbox
                v-model="selectedUsers"
                :val="user"
                color="primary"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ user.display_name || user.email }}</q-item-label>
              <q-item-label caption class="text-slate-500">
                {{ user.email }}
                <q-badge 
                  v-if="user.roles && user.roles.length > 0"
                  :color="getRoleColor(user.roles[0].name)"
                  size="sm"
                  class="q-ml-sm"
                >
                  {{ user.roles[0].name }}
                </q-badge>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-select
                v-model="userRoles[user.user_id]"
                :options="roleOptions"
                dense
                borderless
                style="min-width: 120px;"
                @update:model-value="(val) => setUserRole(user.user_id, val)"
              />
            </q-item-section>
          </q-item>

          <q-item v-if="filteredUsers.length === 0">
            <q-item-section class="text-center py-4">
              <q-icon name="info" size="32px" color="grey-6" />
              <p class="text-grey-6 mt-2">No hay usuarios disponibles para asignar</p>
              <p class="text-grey-6 text-sm" v-if="props.availableUsers.length > 0">
                Todos los usuarios ya están asignados o no cumplen los filtros
              </p>
              <p class="text-grey-6 text-sm" v-else>
                No has creado ningún usuario aún. Crea usuarios en la sección "Gestión de Usuarios"
              </p>
            </q-item-section>
          </q-item>
        </q-list>

        <q-input
          v-model="notes"
          label="Notas generales (opcional)"
          filled
          dense
          type="textarea"
          rows="2"
          class="q-mt-md"
          placeholder="Instrucciones adicionales para los evaluadores"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <div class="text-xs text-slate-500 q-mr-auto">
          {{ selectedUsers.length }} seleccionados de {{ filteredUsers.length }} disponibles
        </div>
        <q-btn flat label="Cancelar" v-close-popup @click="close" />
        <q-btn
          color="primary"
          label="Asignar Evaluadores"
          :loading="loading"
          :disable="selectedUsers.length === 0"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth.store'
import { useUsersStore } from '@/stores/users.store'

const props = defineProps<{
  modelValue: boolean
  evaluationId?: string
  availableUsers: any[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
}>()

const $q = useQuasar()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const selectedUsers = ref<any[]>([])
const userRoles = ref<Record<string, string>>({})
const notes = ref('')
const filterRole = ref<string | null>(null)
const filterSearch = ref('')

// ✅ Obtener el creador (usuario autenticado)
const creatorName = computed(() => {
  return authStore.user?.display_name || 'Usuario'
})

// ✅ Roles disponibles para los evaluadores
const roleOptions = [
  { label: 'Coordinador', value: 'coordinator' },
  { label: 'Evaluador', value: 'evaluator' },
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Observador', value: 'observer' }
]

// ✅ Opciones de filtro por rol
const roleFilterOptions = computed(() => {
  const roles = new Set<string>()
  props.availableUsers.forEach(user => {
    if (user.roles && user.roles.length > 0) {
      roles.add(user.roles[0].name)
    }
  })
  return Array.from(roles).map(name => ({
    label: name,
    value: name
  }))
})

// ✅ COLORES PARA BADGES
const getRoleColor = (roleName: string) => {
  const name = roleName?.toLowerCase() || ''
  if (name.includes('estudiante')) return 'info'
  if (name.includes('experto')) return 'purple'
  if (name.includes('admin')) return 'negative'
  return 'primary'
}

// ✅ FILTRAR USUARIOS: SOLO los que el usuario autenticado creó
const filteredUsers = computed(() => {
  const authUserId = authStore.user?.user_id
  
  console.log('🔍 Filtrando usuarios...')
  console.log('📌 Usuario autenticado:', authUserId)
  console.log('📌 Total disponibles:', props.availableUsers.length)
  
  // ✅ Solo usuarios donde created_by === authUserId
  let users = props.availableUsers.filter(user => {
    const isCreator = user.created_by === authUserId
    console.log(`  - ${user.display_name}: created_by=${user.created_by} → ${isCreator ? '✅' : '❌'}`)
    return isCreator
  })

  // Filtrar por rol
  if (filterRole.value) {
    users = users.filter(user => 
      user.roles && user.roles.some((r: any) => r.name === filterRole.value)
    )
  }

  // Filtrar por búsqueda
  if (filterSearch.value) {
    const q = filterSearch.value.toLowerCase()
    users = users.filter(user =>
      user.display_name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q)
    )
  }

  return users
})

const setUserRole = (user_id: string, role: string) => {
  userRoles.value[user_id] = role
}

// ✅ Cuando se abre el diálogo, cargar los usuarios del creador
watch(() => props.modelValue, async (open) => {
  if (open) {
    console.log('📡 Abriendo diálogo, cargando usuarios...')
    // ✅ Asegurar que tenemos los usuarios del creador
    await usersStore.fetchAll()
    // ✅ Actualizar availableUsers con los usuarios filtrados
    // Nota: El padre debe pasar todos los usuarios y aquí filtramos
  }
}, { immediate: true })

const save = async () => {
  console.log("📋 Usuarios disponibles:", props.availableUsers)
  console.log("📋 Usuarios seleccionados:", selectedUsers.value)

  if (selectedUsers.value.length === 0) return

  loading.value = true
  try {
    const evaluators = selectedUsers.value.map(user => ({
      user_id: user.user_id,
      evaluatorRole: userRoles.value[user.user_id] || 'evaluator',
      notes: notes.value || null
    }))

    emit('save', {
      evaluationId: props.evaluationId,
      evaluators
    })
    close()
  } catch (error: any) {
    console.error('Error al guardar:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al asignar evaluadores'
    })
  } finally {
    loading.value = false
  }
}

const close = () => {
  visible.value = false
  selectedUsers.value = []
  userRoles.value = {}
  notes.value = ''
  filterRole.value = null
  filterSearch.value = ''
}

// Cargar usuarios al montar
onMounted(() => {
  usersStore.fetchAll()
})
</script>