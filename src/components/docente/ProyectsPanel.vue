<template>
  <div>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">Proyectos de Figma</div>
        <div class="text-caption text-grey-6" v-if="semesterId">
          Semestre: {{ semesterName }}
        </div>
      </div>

      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Nuevo proyecto"
        @click="openCreateDialog"
        :disable="!semesterId"
      />
    </div>

    <!-- Indicador de semestre no seleccionado -->
    <q-banner v-if="!semesterId" rounded class="bg-orange-1 text-orange-10 q-mb-md">
      <template #avatar>
        <q-icon name="warning" />
      </template>
      Selecciona un semestre para ver y gestionar proyectos.
    </q-banner>

    <FigmaConnectionManager />

    <FigmaProjectsTable
      :rows="filteredProjects"
      :loading="loading"
      @edit="onEditProject"
    />

    <FigmaProjectFormDialog
      v-model="dialogOpen"
      :editing-row="editingRow"
      :figma-token="store.figmaConnections[0]?.personalAccessToken ?? null"
      :semester-id="semesterId"
      @saved="onProjectSaved"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDocenteStore } from '@/stores/docente.stores'
import { useAuthStore } from '@/stores/auth.store'
import { useSemesterStore } from '@/stores/semester.store'
import type { FigmaProject } from '@/types/docente.types'

import FigmaConnectionManager from './figma/FigmaConnectionManager.vue'
import FigmaProjectsTable from './figma/FigmaProjectsTable.vue'
import FigmaProjectFormDialog from './figma/FigmaProjectFormDialog.vue'

const props = defineProps<{
  semesterId: string | null
}>()

const $q = useQuasar()
const store = useDocenteStore()
const auth = useAuthStore()
const semesterStore = useSemesterStore()

const loading = ref(false)
const dialogOpen = ref(false)
const editingRow = ref<FigmaProject | null>(null)

const semesterName = computed(() => {
  const sem = semesterStore.semesters.find(s => s.semesterId === props.semesterId)
  return sem ? `${sem.name} (${sem.code})` : ''
})

// ✅ CORREGIDO: Filtrar proyectos usando semester_projects
const filteredProjects = computed(() => {
  if (!props.semesterId) return []
  
  // Obtener los IDs de los proyectos asignados a este semestre
  const assignedProjectIds = semesterStore.semesterProjects.map(
    (sp) => sp.projectId
  )
  
  // Filtrar solo los proyectos que están asignados a este semestre
  return store.projects.filter(p => assignedProjectIds.includes(p.projectId))
})

function openCreateDialog() {
  editingRow.value = null
  dialogOpen.value = true
}

function onEditProject(row: FigmaProject) {
  editingRow.value = row
  dialogOpen.value = true
}

async function onProjectSaved() {
  await load()
}

async function load() {
  if (!props.semesterId) {
    await store.fetchProjects()
    return
  }
  
  loading.value = true
  try {
    const userId = auth.user?.user_id
    if (!userId) {
      throw new Error('No existe un usuario autenticado')
    }

    // Cargar proyectos y conexiones Figma
    await Promise.all([
      store.fetchProjects(),
      store.fetchFigmaConnections(userId)
    ])
    
    // ✅ Obtener las asignaciones del semestre (esto llena semesterStore.semesterProjects)
    await semesterStore.getProjectsBySemester(props.semesterId)
    
  } catch (e: any) {
    console.error('Error loading:', e)
    $q.notify({
      type: 'negative',
      message: e.message ?? 'No se pudo cargar la información',
    })
  } finally {
    loading.value = false
  }
}

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