<!-- views/roles/docente/heuristics/EvaluationsListView.vue -->
<template>
  <div>
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row p-5 items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">
             Evaluaciones Heurísticas
        </div>
        <div class="text-caption text-grey-7">
          Crea y gestiona evaluaciones por expertos UX
        </div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn
          flat
          icon="refresh"
          label="Actualizar"
          color="primary"
          :loading="loading"
          @click="reload"
        />
        <q-btn
          unelevated
          icon="add"
          label="Nueva evaluación"
          color="primary"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- STATS                                                         -->
    <!-- ============================================================ -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-primary text-weight-bold">
            {{ stats.total }}
          </div>
          <div class="text-caption text-grey-7">Total</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-warning text-weight-bold">
            {{ stats.inProgress }}
          </div>
          <div class="text-caption text-grey-7">En progreso</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-positive text-weight-bold">
            {{ stats.completed }}
          </div>
          <div class="text-caption text-grey-7">Completadas</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-grey-6 text-weight-bold">
            {{ stats.draft + stats.planning }}
          </div>
          <div class="text-caption text-grey-7">Pendientes</div>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- FILTROS                                                       -->
    <!-- ============================================================ -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="q-py-sm">
        <div class="row items-center q-gutter-md">
          <q-input
            v-model="searchText"
            dense
            outlined
            placeholder="Buscar por nombre..."
            style="min-width: 250px;"
          >
            <template v-slot:prepend>
              <q-icon name="search" size="sm" />
            </template>
            <template v-slot:append v-if="searchText">
              <q-icon
                name="close"
                size="sm"
                class="cursor-pointer"
                @click="searchText = ''"
              />
            </template>
          </q-input>

          <q-select
            v-model="filterStatus"
            :options="statusFilterOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            dense
            outlined
            label="Estado"
            clearable
            style="min-width: 180px;"
          />

          <q-select
            v-model="filterProject"
            :options="projectFilterOptions"
            option-label="projectName"
            option-value="projectId"
            emit-value
            map-options
            dense
            outlined
            label="Proyecto"
            clearable
            style="min-width: 220px;"
          />

          <q-space />

          <span class="text-caption text-grey-6">
            {{ filteredEvaluations.length }} de {{ evaluations.length }} evaluaciones
          </span>
        </div>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- LOADING                                                       -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">
        Cargando evaluaciones...
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- EMPTY                                                         -->
    <!-- ============================================================ -->
    <div
      v-else-if="!evaluations.length"
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="fact_check" size="64px" />
      <div class="text-h6 q-mt-md">No hay evaluaciones creadas</div>
      <div class="text-caption q-mb-md">
        Crea tu primera evaluación heurística para comenzar
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Crear primera evaluación"
        @click="openCreateDialog"
      />
    </div>

    <!-- Sin resultados de filtro -->
    <div
      v-else-if="!filteredEvaluations.length"
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="search_off" size="48px" />
      <div class="text-h6 q-mt-sm">Sin resultados</div>
      <div class="text-caption q-mb-md">
        Ajusta los filtros para ver más evaluaciones
      </div>
      <q-btn
        flat
        color="primary"
        icon="clear"
        label="Limpiar filtros"
        @click="clearFilters"
      />
    </div>

    <!-- ============================================================ -->
    <!-- GRID                                                          -->
    <!-- ============================================================ -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="ev in filteredEvaluations"
        :key="ev.evaluationId"
        class="col-12 col-sm-6 col-md-4"
      >
        <EvaluationCard
          :evaluation="ev"
          :framework-name="getFrameworkName(ev.frameworkId)"
          @view="goToDetail"
          @edit="openEditDialog"
          @delete="confirmDelete"
          @change-status="onChangeStatus"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- DIALOG                                                        -->
    <!-- ============================================================ -->
    <EvaluationFormDialog
      v-model="dialogOpen"
      :evaluation="editingEvaluation"
      :saving="saving"
      @save="onSaveEvaluation"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth.store'
import { useDocenteStore } from '@/stores/docente.stores'
import { useHeuristicEvaluations } from '@/composables/docente/useHeuristicEvaluations'
import {
  heuristicApi,
  type HeuristicEvaluation,
  type HeuristicFramework,
} from '@/api/heuristic.api'
import EvaluationCard from '@/components/docente/heuristics/EvaluationCard.vue'
import EvaluationFormDialog from '@/components/docente/heuristics/EvaluationFormDialog.vue'

const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()
const docenteStore = useDocenteStore()

const {
  evaluations,
  loading,
  saving,
  stats,
  fetchEvaluations,
  createEvaluation,
  updateEvaluation,
  updateEvaluationStatus,
  deleteEvaluation,
  getStatusLabel,
} = useHeuristicEvaluations()

// ============================================================
// STATE
// ============================================================
const dialogOpen = ref(false)
const editingEvaluation = ref<HeuristicEvaluation | null>(null)

const searchText = ref('')
const filterStatus = ref<string | null>(null)
const filterProject = ref<string | null>(null)

const frameworks = ref<HeuristicFramework[]>([])

// ============================================================
// COMPUTED
// ============================================================
const statusFilterOptions = [
  { label: 'Borrador', value: 'draft' },
  { label: 'Planificación', value: 'planning' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completada', value: 'completed' },
  { label: 'Archivada', value: 'archived' },
]

const projectFilterOptions = computed(() => docenteStore.projects)

const filteredEvaluations = computed(() => {
  let result = [...evaluations.value]

  // Filtro por texto
  if (searchText.value.trim()) {
    const q = searchText.value.toLowerCase().trim()
    result = result.filter((ev) =>
      ev.name.toLowerCase().includes(q),
    )
  }

  // Filtro por estado
  if (filterStatus.value) {
    result = result.filter((ev) => ev.status === filterStatus.value)
  }

  // Filtro por proyecto
  if (filterProject.value) {
    result = result.filter((ev) => ev.projectId === filterProject.value)
  }

  return result
})

// ============================================================
// HELPERS
// ============================================================
function getFrameworkName(frameworkId: string): string {
  const f = frameworks.value.find((fw) => fw.frameworkId === frameworkId)
  return f?.name || 'Framework'
}

// ============================================================
// LOAD
// ============================================================
async function reload() {
  const supervisorId = auth.user?.user_id
  if (supervisorId) {
    await fetchEvaluations({ supervisorId })
  } else {
    await fetchEvaluations()
  }
}

async function loadFrameworks() {
  try {
    const { data } = await heuristicApi.getFrameworks()
    frameworks.value = data
  } catch (e) {
    console.error('Error cargando frameworks:', e)
  }
}

// ============================================================
// ACTIONS
// ============================================================
function openCreateDialog() {
  editingEvaluation.value = null
  dialogOpen.value = true
}

function openEditDialog(ev: HeuristicEvaluation) {
  editingEvaluation.value = ev
  dialogOpen.value = true
}

async function onSaveEvaluation(data: any) {
  try {
    if (editingEvaluation.value) {
      await updateEvaluation(editingEvaluation.value.evaluationId, data)
    } else {
      await createEvaluation(data)
    }
    dialogOpen.value = false
    editingEvaluation.value = null
  } catch (e) {
    // Error manejado en composable
  }
}

async function onChangeStatus(ev: HeuristicEvaluation, status: string) {
  try {
    await updateEvaluationStatus(ev.evaluationId, status)
  } catch (e) {
    // Error manejado
  }
}

function confirmDelete(ev: HeuristicEvaluation) {
  $q.dialog({
    title: 'Eliminar evaluación',
    message: `¿Estás seguro de eliminar "${ev.name}"?<br><br>
              <strong class="text-negative">Se eliminarán también:</strong>
              <ul class="q-mt-sm">
                <li>Evaluadores asignados</li>
                <li>Tareas</li>
                <li>Observaciones registradas</li>
                <li>Resultados finales</li>
              </ul>
              Esta acción no se puede deshacer.`,
    html: true,
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7',
    },
    ok: {
      label: 'Eliminar',
      color: 'negative',
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    try {
      await deleteEvaluation(ev.evaluationId)
    } catch (e) {
      // Error manejado
    }
  })
}

function goToDetail(ev: HeuristicEvaluation) {
  router.push({
    name: 'docente-heuristic-evaluation-detail',
    params: { evaluationId: ev.evaluationId },
  })
}

function clearFilters() {
  searchText.value = ''
  filterStatus.value = null
  filterProject.value = null
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  await Promise.all([reload(), loadFrameworks(), docenteStore.fetchProjects()])
})
</script>