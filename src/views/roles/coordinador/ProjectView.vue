<template>
  <q-page class="q-pa-md">

    <!-- Header -->
    <q-toolbar class="q-pa-none q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">
          Gestión de Proyectos Figma
        </div>
        <div class="text-grey-6">
          Administra tus proyectos de Figma
        </div>
      </div>

      <q-space />

      <q-btn
        color="primary"
        icon="add"
        label="Nuevo Proyecto"
        @click="openCreateDialog"
        :disable="!hasSemester || !hasToken"
      />
    </q-toolbar>

    <!-- Indicador de semestre -->
    <div v-if="currentSemester" class="q-mb-md text-caption text-grey-6">
      <q-icon name="calendar_month" size="16px" class="q-mr-xs" />
      Semestre: {{ currentSemesterName }}
      <q-badge color="primary" class="q-ml-sm">
        {{ projectsStore.projects.length }} proyectos
      </q-badge>
    </div>

    <!-- Gestión de Token Figma -->
    <FigmaTokenManager ref="tokenManagerRef" />

    <!-- Banner sin semestre -->
    <q-banner v-if="!hasSemester" rounded class="bg-orange-1 text-orange-10 q-mb-md">
      <template #avatar>
        <q-icon name="warning" />
      </template>
      No tienes un semestre asignado. Contacta al administrador para poder crear proyectos.
    </q-banner>

    <!-- Banner sin token -->
    <q-banner v-else-if="!hasToken" rounded class="bg-orange-1 text-orange-10 q-mb-md">
      <template #avatar>
        <q-icon name="warning" />
      </template>
      Configura tu token de Figma para poder importar proyectos.
    </q-banner>

    <!-- Filtros -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-input
          v-model="search"
          outlined
          dense
          clearable
          debounce="300"
          label="Buscar proyecto"
          prepend-icon="search"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="filterStatus"
          outlined
          dense
          clearable
          :options="statusOptions"
          label="Estado"
          emit-value
          map-options
        />
      </div>
      <div class="col-12 col-md-2">
        <q-btn
          flat
          dense
          color="primary"
          icon="refresh"
          label="Recargar"
          @click="loadData"
          :loading="projectsStore.loading"
        />
      </div>
    </div>

    <!-- Lista de proyectos -->
    <ProjectList
      :projects="filteredProjects"
      :loading="projectsStore.loading"
      @edit="openEditDialog"
      @delete="confirmDelete"
      @view="viewProject"
    />

    <!-- Formulario de proyecto -->
    <ProjectForm
      v-model="dialogOpen"
      :project="editingProject"
      :semester-id="currentSemester?.semesterId || null"
      @saved="onProjectSaved"
    />

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/coordinator/projects.store'
import { useSemesterStore } from '@/stores/semester.store'
import { useAuthStore } from '@/stores/auth.store'
import ProjectList from '@/components/coordinator/projects/ProjectList.vue'
import ProjectForm from '@/components/coordinator/projects/ProjectForm.vue'
import FigmaTokenManager from '@/components/coordinator/projects/FigmaTokenManager.vue'
import type { FigmaProject } from '@/types/coordinator/projects.types'

const $q = useQuasar()
const router = useRouter()
const projectsStore = useProjectsStore()
const semesterStore = useSemesterStore()
const authStore = useAuthStore()

// State
const search = ref('')
const filterStatus = ref<string | null>(null)
const dialogOpen = ref(false)
const editingProject = ref<FigmaProject | null>(null)
const tokenManagerRef = ref<InstanceType<typeof FigmaTokenManager> | null>(null)
const hasToken = ref(false)

const statusOptions = [
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' }
]

// Computed
const currentSemester = computed(() => semesterStore.currentSemester)
const currentSemesterName = computed(() => {
  if (!currentSemester.value) return ''
  return `${currentSemester.value.name} (${currentSemester.value.code})`
})

const hasSemester = computed(() => !!currentSemester.value)

const filteredProjects = computed(() => {
  let result = projectsStore.projects

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(p =>
      p.projectName?.toLowerCase().includes(q) ||
      p.fileKey?.toLowerCase().includes(q)
    )
  }

  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }

  return result
})

// Methods
const loadData = async () => {
  try {
    await Promise.all([
      projectsStore.fetchProjectsByCreator(),
      semesterStore.fetchSemesters()
    ])
    
    // Si hay semestre activo, seleccionarlo
    if (!semesterStore.currentSemester && semesterStore.semesters.length > 0) {
      const active = semesterStore.semesters.find(s => s.isActive)
      if (active) {
        semesterStore.setCurrentSemester(active.semesterId)
      }
    }

    // Verificar si tiene token configurado
    const connection = await projectsStore.getFigmaConnection()
    hasToken.value = !!connection

  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al cargar datos'
    })
  }
}

const openCreateDialog = () => {
  if (!hasSemester.value) {
    $q.notify({
      type: 'warning',
      message: 'No tienes un semestre asignado para crear proyectos'
    })
    return
  }
  
  if (!hasToken.value) {
    $q.notify({
      type: 'warning',
      message: 'Configura tu token de Figma primero'
    })
    return
  }
  
  editingProject.value = null
  dialogOpen.value = true
}

const openEditDialog = (project: FigmaProject) => {
  editingProject.value = project
  dialogOpen.value = true
}

const viewProject = (project: FigmaProject) => {
  router.push(`/proyectos/${project.projectId}`)
}

const confirmDelete = (project: FigmaProject) => {
  $q.dialog({
    title: 'Eliminar Proyecto',
    message: `¿Estás seguro de eliminar el proyecto "${project.projectName}"?`,
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: 'Cancelar',
    persistent: true
  }).onOk(async () => {
    try {
      await projectsStore.deleteProject(project.projectId)
      $q.notify({
        type: 'positive',
        message: 'Proyecto eliminado correctamente'
      })
    } catch (error: any) {
      $q.notify({
        type: 'negative',
        message: error.message || 'Error al eliminar proyecto'
      })
    }
  })
}

const onProjectSaved = () => {
  dialogOpen.value = false
  loadData()
  $q.notify({
    type: 'positive',
    message: 'Proyecto guardado correctamente'
  })
}

// Watchers
watch(() => hasToken.value, (newVal) => {
  if (!newVal) {
    $q.notify({
      type: 'info',
      message: 'Configura tu token de Figma para poder crear proyectos'
    })
  }
})

// Lifecycle
onMounted(() => {
  loadData()
})
</script>