<!-- components/docente/ReviewersPanel.vue -->
<template>
  <div>
    <div class="text-h6 text-weight-bold text-grey-9 q-mb-md">
      Asignar Coordinadores
    </div>

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
    <q-banner
      v-if="!semesterId"
      rounded
      class="bg-orange-1 text-orange-10 q-mb-md"
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>
      Selecciona un semestre para ver y asignar coordinadores.
    </q-banner>

    <q-card v-if="selectedProject && semesterId" flat bordered class="q-pa-md">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">
        Asignar coordinador
      </div>
      <div class="text-caption text-grey-6 q-mb-sm">
        <q-icon name="info" size="14px" class="q-mr-xs" />
        Solo se muestran usuarios con rol de <strong>Coordinador</strong>
        disponibles: {{ availableCoordinators.length }}
      </div>

      <!-- Formulario simplificado: solo usuario -->
      <q-form
        ref="assignFormRef"
        class="row q-col-gutter-md items-end"
        @submit.prevent="onAssign"
      >
        <div class="col-12 col-md-8">
          <q-select
            ref="userSelectRef"
            v-model="form.userId"
            filled
            :options="availableCoordinators"
            option-label="display_name"
            option-value="user_id"
            label="Coordinador"
            emit-value
            map-options
            :rules="[required]"
            :loading="loadingCoordinators"
            lazy-rules
            use-input
            input-debounce="300"
            @filter="filterCoordinators"
          >
            <template v-slot:prepend>
              <q-icon name="supervisor_account" color="primary" />
            </template>

            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="32px">
                    {{ getInitials(scope.opt.display_name) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.display_name }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.email }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template v-slot:no-option>
              <div class="text-center q-pa-md text-grey-6">
                <q-icon name="person_off" size="24px" />
                <div>No hay coordinadores disponibles</div>
                <div class="text-caption">
                  Los usuarios deben tener el rol "Coordinador" asignado
                </div>
              </div>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-md-4">
          <q-btn
            unelevated
            color="primary"
            type="submit"
            icon="person_add"
            label="Asignar"
            class="full-width"
            :loading="assigning"
            :disable="!form.userId"
          />
        </div>
      </q-form>

      <!-- Tabla de coordinadores asignados -->
      <div class="q-mt-lg">
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          Coordinadores asignados ({{ assignedReviewers.length }})
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
          <template v-slot:body-cell-display_name="props">
            <q-td :props="props">
              <div class="row items-center no-wrap q-gutter-xs">
                <q-avatar color="primary" text-color="white" size="32px">
                  {{ getInitials(getUserName(props.row.userId)) }}
                </q-avatar>
                <div class="column">
                  <div class="text-body2 text-weight-medium">
                    {{ getUserName(props.row.userId) }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ getUserEmail(props.row.userId) }}
                  </div>
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-role_name="props">
            <q-td :props="props">
              <q-badge color="primary" text-color="white">
                {{ getRoleLabel(props.row.roleId) }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-assigned_at="props">
            <q-td :props="props">
              {{
                props.row.assignedAt
                  ? new Date(props.row.assignedAt).toLocaleDateString('es-ES')
                  : '—'
              }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                @click="onDeleteReviewer(props.row.projectReviewerId)"
              >
                <q-tooltip>Quitar asignación</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="text-grey-6 q-pa-md text-center">
              <q-icon name="group_off" size="32px" />
              <div>No hay coordinadores asignados a este proyecto</div>
            </div>
          </template>
        </q-table>
      </div>
    </q-card>

    <div
      v-else-if="semesterId && !selectedProject"
      class="text-grey-6 q-mt-md"
    >
      <q-icon name="info" size="20px" />
      Selecciona un proyecto para ver y asignar sus coordinadores.
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

// ============================================================
// REFS
// ============================================================
const assignFormRef = ref<any>(null)
const userSelectRef = ref<any>(null)

// ============================================================
// STATE
// ============================================================
const selectedProject = ref<string | null>(null)
const assigning = ref(false)
const loadingReviewers = ref(false)
const loadingProjects = ref(false)
const loadingCoordinators = ref(false)
const assignedReviewers = ref<any[]>([])

// Lista completa y filtrada de coordinadores
const allCoordinators = ref<any[]>([])
const filterText = ref('')

const pagination = ref({
  rowsPerPage: 10,
})

const form = reactive({
  userId: '',
})

const required = (val: string) => !!val || 'Campo obligatorio'

// ============================================================
// COMPUTED
// ============================================================
const filteredProjects = computed(() => {
  if (!props.semesterId) return []
  return store.projects.filter((p) => p.semesterId === props.semesterId)
})

const semesterName = computed(() => {
  const sem = semesterStore.semesters.find(
    (s) => s.semesterId === props.semesterId,
  )
  return sem ? `${sem.name} (${sem.code})` : ''
})

/**
 * Coordinadores disponibles para asignar:
 * - Tienen rol "Coordinador" en sus roles
 * - NO están ya asignados a este proyecto
 */
const availableCoordinators = computed(() => {
  const assignedIds = assignedReviewers.value.map((r) => r.userId)

  // Filtrar coordinadores que NO están ya asignados
  let list = allCoordinators.value.filter(
    (u) => !assignedIds.includes(u.user_id),
  )

  // Aplicar filtro de texto si hay
  if (filterText.value.trim()) {
    const needle = filterText.value.toLowerCase().trim()
    list = list.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(needle) ||
        u.email?.toLowerCase().includes(needle),
    )
  }

  return list.sort((a, b) =>
    (a.display_name || '').localeCompare(b.display_name || ''),
  )
})

// ============================================================
// COLUMNS
// ============================================================
const columns = [
  {
    name: 'display_name',
    label: 'Coordinador',
    field: 'display_name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'email',
    label: 'Email',
    field: (row: any) => getUserEmail(row.userId),
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'role_name',
    label: 'Rol',
    field: (row: any) => getRoleLabel(row.roleId),
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'assigned_at',
    label: 'Asignado el',
    field: 'assignedAt',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Acciones',
    field: 'actions',
    align: 'center' as const,
  },
]

// ============================================================
// HELPERS
// ============================================================
function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getUserName(userId: string): string {
  const user = allCoordinators.value.find((u) => u.user_id === userId)
  if (user?.display_name) return user.display_name

  // Fallback: buscar en todos los students
  const fallback = store.students.find((u) => u.user_id === userId)
  return fallback?.display_name || 'Usuario'
}

function getUserEmail(userId: string): string {
  const user = allCoordinators.value.find((u) => u.user_id === userId)
  if (user?.email) return user.email

  const fallback = store.students.find((u) => u.user_id === userId)
  return fallback?.email || ''
}

function getRoleLabel(roleId: any): string {
  if (!roleId) return 'Coordinador'

  // Si viene como objeto
  if (typeof roleId === 'object' && roleId.name) return roleId.name

  // Buscar en roles del store
  const role = store.roles.find(
    (r) => String(r.role_id) === String(roleId),
  )
  if (role?.name) return role.name

  // Fallback: buscar en los roles del sistema
  return 'Coordinador'
}

/**
 * Filtra los coordinadores cuando el usuario escribe en el select
 */
function filterCoordinators(val: string, update: any) {
  filterText.value = val

  update(() => {
    // La computed `availableCoordinators` ya aplica el filtro
  })
}

// ============================================================
// CARGA DE DATOS
// ============================================================

/**
 * Carga TODOS los usuarios con rol "Coordinador"
 */
async function loadAllCoordinators() {
  loadingCoordinators.value = true

  try {
    // Asegurarse de que tenemos los usuarios cargados
    if (store.students.length === 0) {
      await store.fetchStudents()
    }

    // Asegurarse de que tenemos los roles cargados
    if (store.roles.length === 0) {
      await store.fetchRoles()
    }

    // Encontrar el role_id de "Coordinador"
    const coordinatorRole = store.roles.find((r: any) =>
      r.name?.toLowerCase().includes('coordinador'),
    )

    if (!coordinatorRole) {
      console.warn('⚠️ No se encontró el rol "Coordinador" en el sistema')
      allCoordinators.value = []
      return
    }

    // Filtrar usuarios que tengan el rol "Coordinador"
    allCoordinators.value = store.students.filter((user: any) => {
      if (!user.roles || !Array.isArray(user.roles)) return false
      return user.roles.some(
        (r: any) =>
          String(r.role_id) === String(coordinatorRole.role_id) ||
          r.name?.toLowerCase().includes('coordinador'),
      )
    })

    console.log(`✅ ${allCoordinators.value.length} coordinadores cargados`)
  } catch (error: any) {
    console.error('Error cargando coordinadores:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los coordinadores',
    })
  } finally {
    loadingCoordinators.value = false
  }
}

async function loadProjectReviewers(projectId: string) {
  loadingReviewers.value = true
  try {
    const response = await store.fetchProjectReviewers(projectId)

    // Mostrar SOLO los que tienen rol de Coordinador
    // (por si hay datos viejos con otros roles)
    assignedReviewers.value = response || []
  } catch (error: any) {
    console.error('Error loading reviewers:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudieron cargar los coordinadores',
    })
  } finally {
    loadingReviewers.value = false
  }
}

// ============================================================
// ACCIONES
// ============================================================
async function onProjectChange(projectId: string | null) {
  if (projectId) {
    await loadProjectReviewers(projectId)
  } else {
    assignedReviewers.value = []
  }
}

function resetForm() {
  form.userId = ''
  filterText.value = ''

  nextTick(() => {
    if (
      userSelectRef.value &&
      typeof userSelectRef.value.resetValidation === 'function'
    ) {
      userSelectRef.value.resetValidation()
    }
    if (
      assignFormRef.value &&
      typeof assignFormRef.value.resetValidation === 'function'
    ) {
      assignFormRef.value.resetValidation()
    }
  })
}

async function onAssign() {
  if (!selectedProject.value) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona un proyecto primero',
    })
    return
  }

  if (!form.userId) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona un coordinador',
    })
    return
  }

  // Encontrar el role_id de "Coordinador"
  const coordinatorRole = store.roles.find((r: any) =>
    r.name?.toLowerCase().includes('coordinador'),
  )

  if (!coordinatorRole) {
    $q.notify({
      type: 'negative',
      message: 'No se encontró el rol "Coordinador" en el sistema',
    })
    return
  }

  assigning.value = true
  try {
    await store.assignReviewer({
      projectId: selectedProject.value,
      userId: form.userId,
      roleId: coordinatorRole.role_id,
    })

    await loadProjectReviewers(selectedProject.value)
    resetForm()

    $q.notify({
      type: 'positive',
      message: '✅ Coordinador asignado correctamente',
    })
  } catch (error: any) {
    console.error('Error assigning reviewer:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo asignar el coordinador',
    })
  } finally {
    assigning.value = false
  }
}

async function onDeleteReviewer(reviewerId: string) {
  if (!selectedProject.value) return

  const confirm = await new Promise<boolean>((resolve) => {
    $q.dialog({
      title: 'Confirmar',
      message: '¿Estás seguro de que deseas quitar a este coordinador?',
      cancel: true,
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
  })

  if (!confirm) return

  try {
    await store.deleteReviewer(reviewerId)
    await loadProjectReviewers(selectedProject.value)

    $q.notify({
      type: 'positive',
      message: 'Coordinador removido correctamente',
    })
  } catch (error: any) {
    console.error('Error deleting reviewer:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo remover el coordinador',
    })
  }
}

// ============================================================
// CARGA INICIAL
// ============================================================
async function loadInitialData() {
  if (!props.semesterId) {
    console.log('⏳ Esperando semestre...')
    return
  }

  try {
    loadingProjects.value = true

    console.log('📡 Cargando datos para semestre:', props.semesterId)

    // 1. Cargar proyectos del semestre
    await store.fetchProjectsBySemester(props.semesterId)

    // 2. Cargar TODOS los estudiantes (necesario para saber sus roles)
    await store.fetchStudents()

    // 3. Cargar TODOS los roles
    await store.fetchRoles()

    // 4. Filtrar y guardar solo los coordinadores
    await loadAllCoordinators()

    console.log('✅ Proyectos filtrados:', filteredProjects.value.length)
    console.log('✅ Coordinadores disponibles:', allCoordinators.value.length)

    // 5. Auto-seleccionar el primer proyecto
    if (filteredProjects.value.length > 0 && !selectedProject.value) {
      selectedProject.value = filteredProjects.value[0].projectId
      await loadProjectReviewers(selectedProject.value)
    }
  } catch (error: any) {
    console.error('Error loading initial data:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo cargar la información inicial',
    })
  } finally {
    loadingProjects.value = false
  }
}

// ============================================================
// WATCHERS & LIFECYCLE
// ============================================================
watch(
  () => props.semesterId,
  (newVal) => {
    if (newVal) {
      selectedProject.value = null
      assignedReviewers.value = []
      resetForm()
      loadInitialData()
    }
  },
  { immediate: true },
)

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