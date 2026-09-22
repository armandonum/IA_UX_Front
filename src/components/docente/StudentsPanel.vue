<template>
  <div>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold text-grey-9">Estudiantes</div>
        <div class="text-caption text-grey-6" v-if="semesterId">
          Semestre: {{ semesterName }}
        </div>
      </div>
      <q-btn 
        unelevated 
        color="primary" 
        icon="person_add" 
        label="Nuevo estudiante" 
        @click="dialogOpen = true"
        :disable="!semesterId"
      />
    </div>

    <!-- Indicador de semestre no seleccionado -->
    <q-banner v-if="!semesterId" rounded class="bg-orange-1 text-orange-10 q-mb-md">
      <template #avatar>
        <q-icon name="warning" />
      </template>
      Selecciona un semestre para ver y gestionar estudiantes.
    </q-banner>

    <q-table
      flat
      bordered
      :rows="filteredStudents"
      :columns="columns"
      row-key="user_id"
      :loading="loading"
    >
      <template v-slot:body-cell-roles="props">
        <q-td :props="props">
          <q-chip
            v-for="r in props.row.roles"
            :key="r.role_id"
            dense
            size="sm"
            color="blue-1"
            text-color="primary"
          >
            {{ r.name }}
          </q-chip>
          <span v-if="!props.row.roles?.length" class="text-grey-5">—</span>
        </q-td>
      </template>

      <template v-slot:top-right>
        <q-btn flat dense icon="refresh" @click="load" :loading="loading">
          <q-tooltip>Recargar</q-tooltip>
        </q-btn>
      </template>
    </q-table>

    <!-- Dialog: Nuevo estudiante -->
    <q-dialog v-model="dialogOpen">
      <q-card style="width: 420px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Nuevo estudiante</div>
          <div class="text-caption text-grey-6" v-if="semesterId">
            Se asignará automáticamente al semestre: {{ semesterName }}
          </div>
        </q-card-section>

        <q-form @submit.prevent="onCreate">
          <q-card-section class="q-gutter-md">
            <q-input 
              v-model="form.displayName" 
              filled 
              label="Nombre completo" 
              :rules="[required]" 
            />
            <q-input 
              v-model="form.email" 
              filled 
              type="email" 
              label="Correo" 
              :rules="[required]" 
            />
            <q-input 
              v-model="form.password" 
              filled 
              type="password" 
              label="Contraseña temporal" 
              :rules="[required]" 
            />
            <q-select
              v-model="form.roleId"
              filled
              label="Rol"
              emit-value
              map-options
              :options="store.roles.map(r => ({
                label: r.name,
                value: r.role_id
              }))"
              :rules="[required]"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" @click="dialogOpen = false" />
            <q-btn unelevated color="primary" type="submit" label="Crear" :loading="creating" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDocenteStore } from '@/stores/docente.stores'
import { useSemesterStore } from '@/stores/semester.store'

const props = defineProps<{
  semesterId: string | null
}>()

const $q = useQuasar()
const store = useDocenteStore()
const semesterStore = useSemesterStore()

const loading = ref(false)
const creating = ref(false)
const dialogOpen = ref(false)

const form = reactive({
  displayName: '',
  email: '',
  password: '',
  roleId: ''
})

const required = (val: string) => !!val || 'Campo obligatorio'

const columns = [
  { name: 'display_name', label: 'Nombre', field: 'display_name', align: 'left' as const },
  { name: 'email', label: 'Correo', field: 'email', align: 'left' as const },
  { name: 'roles', label: 'Roles', field: 'roles', align: 'left' as const },
]

const semesterName = computed(() => {
  const sem = semesterStore.semesters.find(s => s.semesterId === props.semesterId)
  return sem ? `${sem.name} (${sem.code})` : ''
})

// ✅ CORREGIDO: Filtrar estudiantes usando semester_students
const filteredStudents = computed(() => {
  if (!props.semesterId) return []
  
  // Obtener los IDs de los estudiantes asignados a este semestre
  const assignedStudentIds = semesterStore.semesterStudents.map(
    (ss) => ss.userId
  )
  
  // Filtrar solo los estudiantes que están asignados a este semestre
  return store.students.filter(s => assignedStudentIds.includes(s.user_id))
})

async function load() {
  if (!props.semesterId) {
    // Si no hay semestre, cargar todos (pero no se mostrarán)
    await store.fetchStudents()
    await store.fetchRoles()
    return
  }
  
  loading.value = true
  try {
    // Cargar estudiantes y roles
    await Promise.all([
      store.fetchStudents(),
      store.fetchRoles()
    ])
    
    // ✅ Obtener las asignaciones del semestre (esto llena semesterStore.semesterStudents)
    await semesterStore.getStudentsBySemester(props.semesterId)
    
  } catch (e: any) {
    console.error('Error loading:', e)
    $q.notify({ 
      type: 'negative', 
      message: e.message ?? 'No se pudo cargar la lista de estudiantes' 
    })
  } finally {
    loading.value = false
  }
}

async function onCreate() {
  if (!props.semesterId) {
    $q.notify({ 
      type: 'warning', 
      message: 'Primero selecciona un semestre' 
    })
    return
  }

  // Validar que haya seleccionado un rol
  if (!form.roleId) {
    $q.notify({ 
      type: 'warning', 
      message: 'Selecciona un rol para el estudiante' 
    })
    return
  }

  creating.value = true
  try {
    // PASO 1: Crear el usuario (estudiante)
    const newStudent = await store.createStudent({
      displayName: form.displayName,
      email: form.email,
      password: form.password,
      roleIds: [form.roleId],
      status: 'active',
    })

    // PASO 2: Asignar el estudiante al semestre (endpoint separado)
    await store.assignStudentToSemester(props.semesterId, newStudent.user_id)

    $q.notify({
      type: 'positive',
      message: 'Estudiante creado y asignado al semestre'
    })

    dialogOpen.value = false
    
    // Limpiar formulario
    form.displayName = ''
    form.email = ''
    form.password = ''
    form.roleId = ''
    
    // Recargar lista
    await load()
    
  } catch (e: any) {
    console.error('Error creating student:', e)
    $q.notify({ 
      type: 'negative', 
      message: e.message ?? 'No se pudo crear el estudiante' 
    })
  } finally {
    creating.value = false
  }
}

// Recargar cuando cambia el semestre
watch(() => props.semesterId, () => {
  if (props.semesterId) {
    load()
  }
}, { immediate: true })

onMounted(() => {
  if (props.semesterId) {
    load()
  }
})
</script>