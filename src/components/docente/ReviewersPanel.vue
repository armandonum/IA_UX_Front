<template>
  <div>
    <div class="text-h6 text-weight-bold text-grey-9 q-mb-md">Asignar evaluadores</div>

    <!-- Indicador de semestre -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-select
          v-model="selectedProject"
          filled
          :options="filteredProjects"
          option-label="projectName"
          option-value="projectId"
          label="Proyecto"
          emit-value
          map-options
          :loading="loadingProjects"
          @update:model-value="onProjectChange"
        >
          <template v-slot:prepend>
            <q-icon name="dashboard" color="primary" />
          </template>
          <template v-slot:no-option>
            <div class="text-center q-pa-md text-grey-6">
              <q-icon name="info" size="24px" />
              <div>No hay proyectos en este semestre</div>
            </div>
          </template>
        </q-select>
      </div>

      <div class="col-12 col-md-4" v-if="semesterId">
        <div class="text-caption text-grey-6 q-mt-sm">
          <q-icon name="calendar_month" size="16px" />
          Semestre: {{ semesterName }}
        </div>
      </div>
    </div>

    <!-- Indicador de semestre no seleccionado -->
    <q-banner v-if="!semesterId" rounded class="bg-orange-1 text-orange-10 q-mb-md">
      <template #avatar>
        <q-icon name="warning" />
      </template>
      Selecciona un semestre para ver y asignar evaluadores.
    </q-banner>

    <q-card flat bordered class="q-pa-md" v-if="selectedProject && semesterId">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Asignar evaluador</div>
      <div class="text-caption text-grey-6 q-mb-sm">
        Estudiantes disponibles en el semestre: {{ availableStudents.length }}
      </div>

      <!-- ✅ Formulario corregido -->
      <q-form @submit.prevent="onAssign" ref="assignFormRef" class="row q-col-gutter-md items-end">
        <div class="col-12 col-md-5">
          <q-select
            v-model="form.userId"
            filled
            :options="availableStudents"
            option-label="display_name"
            option-value="user_id"
            label="Usuario"
            emit-value
            map-options
            :rules="[required]"
            :loading="loadingStudents"
            ref="userSelectRef"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="person" color="primary" />
            </template>
            <template v-slot:no-option>
              <div class="text-center q-pa-md text-grey-6">
                No hay estudiantes disponibles en este semestre
              </div>
            </template>
          </q-select>
        </div>
        <div class="col-12 col-md-5">
          <q-select
            v-model="form.roleId"
            filled
            :options="reviewerRoleOptions"
            option-label="name"
            option-value="role_id"
            label="Rol"
            emit-value
            map-options
            :rules="[required]"
            ref="roleSelectRef"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="badge" color="primary" />
            </template>
          </q-select>
        </div>
        <div class="col-12 col-md-2">
          <q-btn 
            unelevated 
            color="primary" 
            type="submit" 
            label="Asignar" 
            class="full-width" 
            :loading="assigning" 
          />
        </div>
      </q-form>

      <!-- Tabla de evaluadores asignados -->
      <div class="q-mt-lg">
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          Evaluadores asignados ({{ assignedReviewers.length }})
        </div>
        
        <q-table
          :rows="assignedReviewers"
          :columns="columns"
          row-key="projectReviewerId"
          flat
          bordered
          :loading="loadingReviewers"
          v-model:pagination="pagination"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                @click="onDeleteReviewer(props.row.projectReviewerId)"
              />
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="text-grey-6 q-pa-md text-center">
              <q-icon name="people" size="32px" />
              <div>No hay evaluadores asignados a este proyecto</div>
            </div>
          </template>
        </q-table>
      </div>
    </q-card>

    <div v-else-if="semesterId && !selectedProject" class="text-grey-6 q-mt-md">
      <q-icon name="info" size="20px" />
      Selecciona un proyecto para ver y asignar sus evaluadores.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useDocenteStore } from '@/stores/docente.stores'
import { useSemesterStore } from '@/stores/semester.store'

const props = defineProps<{
  semesterId: string | null
}>()

const $q = useQuasar()
const store = useDocenteStore()
const semesterStore = useSemesterStore()

// ✅ Referencias a los campos
const assignFormRef = ref<any>(null)
const userSelectRef = ref<any>(null)
const roleSelectRef = ref<any>(null)

// Estado
const selectedProject = ref<string | null>(null)
const assigning = ref(false)
const loadingReviewers = ref(false)
const loadingProjects = ref(false)
const loadingStudents = ref(false)
const assignedReviewers = ref<any[]>([])
const pagination = ref({
  rowsPerPage: 10
})

const form = reactive({
  userId: '',
  roleId: ''
})

const required = (val: string) => !!val || 'Campo obligatorio'

// Filtrar proyectos por semestre
const filteredProjects = computed(() => {
  if (!props.semesterId) return []
  return store.projects.filter(p => p.semesterId === props.semesterId)
})

// Obtener nombre del semestre
const semesterName = computed(() => {
  const sem = semesterStore.semesters.find(s => s.semesterId === props.semesterId)
  return sem ? `${sem.name} (${sem.code})` : ''
})

// Filtrar estudiantes por semestre
const availableStudents = computed(() => {
  if (!props.semesterId) return []
  
  const studentIds = semesterStore.semesterStudents.map(ss => ss.userId)
  const assignedIds = assignedReviewers.value.map(r => r.userId)
  
  return store.students.filter((s: any) => 
    studentIds.includes(s.user_id) && !assignedIds.includes(s.user_id)
  )
})

// Opciones de roles incluyendo Coordinador
const reviewerRoleOptions = computed(() => {
  const allRoles = store.roles.filter((r: any) => 
    r.name.toLowerCase().includes("experto ux") || 
    r.name.toLowerCase().includes("estudiante") ||
    r.name.toLowerCase().includes("coordinador")
  )
  
  if (allRoles.length === 0) {
    return [
      { role_id: 'coordinator', name: 'Coordinador' },
      { role_id: 'evaluator', name: 'Evaluador' },
      { role_id: 'supervisor', name: 'Supervisor' },
      { role_id: 'observer', name: 'Observador' }
    ]
  }
  
  return allRoles
})

// Columnas de la tabla
const columns = [
  {
    name: 'display_name',
    label: 'Evaluador',
    field: (row: any) => {
      const user = store.students.find(u => u.user_id === row.userId)
      return user?.display_name || 'Usuario'
    },
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'email',
    label: 'Email',
    field: (row: any) => {
      const user = store.students.find(u => u.user_id === row.userId)
      return user?.email || ''
    },
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'role_name',
    label: 'Rol',
    field: (row: any) => {
      const role = store.roles.find(role => role.role_id === row.roleId)
      if (!role) {
        const found = reviewerRoleOptions.value.find(r => r.role_id === row.roleId)
        return found?.name || 'Revisor'
      }
      return role?.name || 'Revisor'
    },
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'assigned_at',
    label: 'Asignado el',
    field: (row: any) => row.assignedAt ? new Date(row.assignedAt).toLocaleDateString('es-ES') : '',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'actions',
    label: 'Acciones',
    field: 'actions',
    align: 'center' as const
  }
]

// Cargar evaluadores del proyecto seleccionado
async function loadProjectReviewers(projectId: string) {
  loadingReviewers.value = true
  try {
    const response = await store.fetchProjectReviewers(projectId)
    assignedReviewers.value = response || []
  } catch (error: any) {
    console.error('Error loading reviewers:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudieron cargar los evaluadores'
    })
  } finally {
    loadingReviewers.value = false
  }
}

async function onProjectChange(projectId: string | null) {
  if (projectId) {
    await loadProjectReviewers(projectId)
  } else {
    assignedReviewers.value = []
  }
}

// ✅ Función para resetear el formulario SIN validaciones
function resetForm() {
  form.userId = ''
  form.roleId = ''
  
  // ✅ Resetear validaciones usando nextTick para asegurar que el DOM se actualice
  nextTick(() => {
    if (userSelectRef.value && typeof userSelectRef.value.resetValidation === 'function') {
      userSelectRef.value.resetValidation()
      console.log('✅ userSelectRef resetValidation ejecutado')
    }
    if (roleSelectRef.value && typeof roleSelectRef.value.resetValidation === 'function') {
      roleSelectRef.value.resetValidation()
      console.log('✅ roleSelectRef resetValidation ejecutado')
    }
    if (assignFormRef.value && typeof assignFormRef.value.resetValidation === 'function') {
      assignFormRef.value.resetValidation()
      console.log('✅ assignFormRef resetValidation ejecutado')
    }
  })
}

async function onAssign() {
  if (!selectedProject.value) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona un proyecto primero'
    })
    return
  }
  
  if (!form.userId) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona un usuario'
    })
    return
  }
  
  if (!form.roleId) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona un rol'
    })
    return
  }
  
  assigning.value = true
  try {
    await store.assignReviewer({
      projectId: selectedProject.value,
      userId: form.userId,
      roleId: form.roleId
    })
    
    // Recargar la lista
    await loadProjectReviewers(selectedProject.value)
    
    // ✅ Resetear el formulario
    resetForm()
    
    $q.notify({
      type: 'positive',
      message: 'Evaluador asignado correctamente'
    })
  } catch (error: any) {
    console.error('Error assigning reviewer:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo asignar el evaluador'
    })
  } finally {
    assigning.value = false
  }
}

async function onDeleteReviewer(reviewerId: string) {
  if (!selectedProject.value) return
  
  const confirm = await new Promise((resolve) => {
    $q.dialog({
      title: 'Confirmar',
      message: '¿Estás seguro de que deseas eliminar este evaluador?',
      cancel: true,
      persistent: true
    }).onOk(() => resolve(true))
      .onCancel(() => resolve(false))
  })
  
  if (!confirm) return
  
  try {
    await store.deleteReviewer(reviewerId)
    await loadProjectReviewers(selectedProject.value)
    
    $q.notify({
      type: 'positive',
      message: 'Evaluador eliminado correctamente'
    })
  } catch (error: any) {
    console.error('Error deleting reviewer:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo eliminar el evaluador'
    })
  }
}

// Cargar datos iniciales
async function loadInitialData() {
  if (!props.semesterId) {
    console.log('⏳ Esperando semestre...')
    return
  }
  
  try {
    loadingProjects.value = true
    loadingStudents.value = true
    
    console.log('📡 Cargando datos para semestre:', props.semesterId)
    
    await store.fetchProjectsBySemester(props.semesterId)
    await semesterStore.getStudentsBySemester(props.semesterId)
    await store.fetchStudents()
    await store.fetchRoles()
    
    console.log('✅ Proyectos filtrados:', filteredProjects.value.length)
    console.log('✅ Estudiantes disponibles:', availableStudents.value.length)
    
    if (filteredProjects.value.length > 0 && !selectedProject.value) {
      selectedProject.value = filteredProjects.value[0].projectId
      await loadProjectReviewers(selectedProject.value)
    }
    
  } catch (error: any) {
    console.error('Error loading initial data:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo cargar la información inicial'
    })
  } finally {
    loadingProjects.value = false
    loadingStudents.value = false
  }
}

// Watch para recargar si el semestre cambia
watch(() => props.semesterId, (newVal) => {
  if (newVal) {
    selectedProject.value = null
    assignedReviewers.value = []
    resetForm()
    loadInitialData()
  }
}, { immediate: true })

onMounted(() => {
  if (props.semesterId) {
    loadInitialData()
  }
})
</script>

<style scoped>
.q-table {
  margin-top: 8px;
}
</style>