<template>
  <q-dialog v-model="localOpen" persistent>
    <q-card style="min-width: 450px; max-width: 500px;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">{{ user ? 'Editar Usuario' : 'Nuevo Usuario' }}</div>
        <div class="text-subtitle2">Registra usuarios con roles de Estudiante o Experto UX</div>
        <div v-if="semesterName" class="text-caption q-mt-xs text-white/70">
          Se asignará al semestre: {{ semesterName }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit">
        <q-card-section class="q-gutter-md">
          <!-- Nombre -->
          <q-input
            v-model="form.displayName"
            filled
            label="Nombre completo"
            :rules="[(v) => !!v || 'Campo obligatorio']"
          />

          <!-- Email -->
          <q-input
            v-model="form.email"
            filled
            type="email"
            label="Correo electrónico"
            :rules="[
              (v) => !!v || 'Campo obligatorio',
              (v) => /.+@.+\..+/.test(v) || 'Correo inválido'
            ]"
          />

          <!-- Contraseña (solo en creación) -->
          <q-input
            v-if="!user"
            v-model="form.password"
            filled
            type="password"
            label="Contraseña temporal"
            :rules="[
              (v) => !!v || 'Campo obligatorio',
              (v) => v?.length >= 8 || 'Mínimo 8 caracteres'
            ]"
          />

          <!-- Estado -->
          <q-select
            v-model="form.status"
            filled
            :options="statusOptions"
            label="Estado"
            emit-value
            map-options
            :rules="[(v) => !!v || 'Campo obligatorio']"
          />

          <!-- Rol - SOLO ESTUDIANTE Y EXPERTO UX -->
          <q-select
            v-model="form.roleIds"
            filled
            :options="availableRoles"
            label="Rol"
            emit-value
            map-options
            :rules="[(v) => v && v.length > 0 || 'Selecciona un rol']"
            multiple
            dense
            use-chips
            stack-label
          >
            <template v-slot:no-option>
              <div class="text-center q-pa-md text-grey-6">
                No hay roles disponibles
              </div>
            </template>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon :name="getRoleIcon(scope.opt.value)" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Info adicional -->
          <div class="text-caption text-grey-6 q-mt-sm">
            <q-icon name="info" size="14px" />
            Solo se permiten roles de <strong>Estudiante</strong> y <strong>Experto UX</strong>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="close" />
          <q-btn
            unelevated
            color="primary"
            type="submit"
            :label="user ? 'Actualizar' : 'Crear'"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useUsersStore } from '@/stores/users.store'
import { useSemesterStore } from '@/stores/semester.store'
import { useAuthStore } from '@/stores/auth.store'
import type { User, Role } from '@/types'

const props = defineProps<{
  modelValue: boolean
  user?: User | null
  roles: Role[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'saved'): void
}>()

const $q = useQuasar()
const usersStore = useUsersStore()
const semesterStore = useSemesterStore()
const authStore = useAuthStore()

const loading = ref(false)
const semesterId = ref<string | null>(null)
const authUserId = ref<string | null>(null)

const localOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// ✅ Obtener el semestre del usuario autenticado
const loadUserSemester = async () => {
  const userId = authStore.user?.user_id
  authUserId.value = userId || null
  
  if (!userId) return

  try {
    const userSemesters = await semesterStore.getSemestersByUser(userId)
    
    if (userSemesters && userSemesters.length > 0) {
      semesterId.value = userSemesters[0].semesterId
      console.log('✅ Semestre del usuario:', semesterId.value)
    } else {
      console.warn('⚠️ Usuario sin semestre asignado')
      $q.notify({
        type: 'warning',
        message: 'No tienes un semestre asignado. Contacta al administrador.'
      })
    }
  } catch (error) {
    console.error('Error al cargar semestre del usuario:', error)
  }
}

// ✅ Nombre del semestre para mostrar
const semesterName = computed(() => {
  if (!semesterId.value) return ''
  const sem = semesterStore.semesters.find(s => s.semesterId === semesterId.value)
  return sem ? `${sem.name} (${sem.code})` : ''
})

// ✅ FILTRAR SOLO ROLES: Estudiante y Experto UX
const availableRoles = computed(() => {
  const allowedRoleNames = ['estudiante', 'experto ux', 'experto']
  return props.roles
    .filter(role => 
      allowedRoleNames.some(name => 
        role.name?.toLowerCase().includes(name)
      )
    )
    .map(role => ({
      label: role.name,
      value: Number(role.role_id), // ✅ NÚMERO, no string
      description: role.description || role.name
    }))
})

const statusOptions = [
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' },
  { label: 'Suspendido', value: 'suspended' }
]

const getRoleIcon = (roleId: number) => {
  const role = availableRoles.value.find(r => r.value === roleId)
  if (role?.label?.toLowerCase().includes('estudiante')) return 'school'
  if (role?.label?.toLowerCase().includes('experto')) return 'psychology'
  return 'badge'
}

// ✅ roleIds como números
const form = reactive({
  displayName: '',
  email: '',
  password: '',
  status: 'active',
  roleIds: [] as number[]
})

// Resetear formulario
function resetForm() {
  form.displayName = ''
  form.email = ''
  form.password = ''
  form.status = 'active'
  form.roleIds = []
}

// Cargar datos para edición
watch(() => props.user, (newUser) => {
  if (newUser) {
    form.displayName = newUser.display_name || ''
    form.email = newUser.email || ''
    form.status = newUser.status || 'active'
    form.roleIds = newUser.roles?.map((r: any) => Number(r.role_id)) || []
    form.password = ''
  } else {
    resetForm()
  }
}, { immediate: true })

// Cargar al abrir el modal
watch(() => props.modelValue, (open) => {
  if (open) {
    if (!props.user) {
      resetForm()
    }
    loadUserSemester()
  }
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

// ✅ CORREGIDO: Guardar usuario - 2 pasos separados
async function onSubmit() {
  // Validaciones
  if (!form.roleIds || form.roleIds.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Debes seleccionar al menos un rol'
    })
    return
  }

  if (!semesterId.value && !props.user) {
    $q.notify({
      type: 'warning',
      message: 'No tienes un semestre asignado. No puedes crear usuarios.'
    })
    return
  }

  loading.value = true
  try {
    const creatorId = authStore.user?.user_id

    // PASO 1: Crear el usuario (con created_by)
    const payload: any = {
      displayName: form.displayName,
      email: form.email,
      status: form.status,
      roleIds: form.roleIds, // ✅ Números
    }

    if (creatorId) {
      payload.created_by = creatorId // ✅ created_by (con guión bajo)
    }

    if (props.user) {
      // Edición
      await usersStore.update(props.user.user_id, payload)
      $q.notify({
        type: 'positive',
        message: 'Usuario actualizado correctamente'
      })
    } else {
      // Creación - requiere contraseña
      if (!form.password) {
        $q.notify({
          type: 'warning',
          message: 'La contraseña es requerida'
        })
        loading.value = false
        return
      }
      payload.password = form.password

      // PASO 1: Crear usuario
      const newUser = await usersStore.create(payload)
      console.log('✅ Usuario creado:', newUser)

      // PASO 2: Asignar al semestre (endpoint separado)
      if (newUser.user_id && semesterId.value) {
        try {
          await semesterStore.assignStudentToSemester(semesterId.value, newUser.user_id)
          console.log(`✅ Usuario ${newUser.user_id} asignado al semestre ${semesterId.value}`)
          $q.notify({
            type: 'positive',
            message: 'Usuario creado y asignado al semestre correctamente'
          })
        } catch (assignError) {
          console.warn('Error asignando usuario al semestre:', assignError)
          $q.notify({
            type: 'warning',
            message: 'Usuario creado pero hubo un error al asignarlo al semestre'
          })
        }
      }
    }

    emit('saved')
    close()
  } catch (error: any) {
    console.error('Error al guardar usuario:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Error al guardar el usuario'
    })
  } finally {
    loading.value = false
  }
}

// Cargar semestre al montar
onMounted(() => {
  loadUserSemester()
})
</script>