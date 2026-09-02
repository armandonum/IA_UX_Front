<!-- components/problems/ProblemManager.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-md font-semibold text-slate-100">Problemas de Usabilidad</h3>
      <div class="flex gap-2">
        <q-btn
          v-if="canEdit"
          color="primary"
          icon="add"
          label="Identificar Problema"
          size="sm"
          @click="showCreateDialog = true"
        />
        <q-btn
          v-if="canEdit && problems.length > 1"
          color="warning"
          icon="merge_type"
          label="Unificar"
          size="sm"
          flat
          @click="showUnifyDialog = true"
        />
      </div>
    </div>

    <!-- Resumen de problemas -->
    <div v-if="summary" class="grid grid-cols-2 md:grid-cols-4 gap-4 q-mb-4">
      <q-card class="bg-slate-700 border-slate-600">
        <q-card-section class="py-2 text-center">
          <div class="text-2xl font-bold text-primary">{{ summary.totalProblems || 0 }}</div>
          <div class="text-xs text-slate-500">Total Problemas</div>
        </q-card-section>
      </q-card>
      <q-card class="bg-slate-700 border-slate-600">
        <q-card-section class="py-2 text-center">
          <div class="text-2xl font-bold text-negative">{{ summary.bySeverity?.critical || 0 }}</div>
          <div class="text-xs text-slate-500">Críticos</div>
        </q-card-section>
      </q-card>
      <q-card class="bg-slate-700 border-slate-600">
        <q-card-section class="py-2 text-center">
          <div class="text-2xl font-bold text-warning">{{ summary.activeProblems || 0 }}</div>
          <div class="text-xs text-slate-500">Activos</div>
        </q-card-section>
      </q-card>
      <q-card class="bg-slate-700 border-slate-600">
        <q-card-section class="py-2 text-center">
          <div class="text-2xl font-bold text-positive">{{ summary.resolutionRate || 0 }}%</div>
          <div class="text-xs text-slate-500">Tasa de Resolución</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Lista de problemas -->
    <q-table
      :rows="problems"
      :columns="columns"
      row-key="id"
      class="bg-slate-800 rounded-lg"
      dark
      :loading="loading"
      :pagination="{ rowsPerPage: 10 }"
    >
      <template v-slot:body-cell-severity="props">
        <q-td>
          <q-badge :color="getSeverityColor(props.row.severity)">
            {{ getSeverityLabel(props.row.severity) }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td>
          <q-badge :color="getStatusColor(props.row.status)">
            {{ getStatusLabel(props.row.status) }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-category="props">
        <q-td>
          <q-badge :color="getCategoryColor(props.row.category)" outline>
            {{ getCategoryLabel(props.row.category) }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td>
          <div class="flex gap-1">
            <q-btn
              icon="visibility"
              flat
              dense
              size="sm"
              @click="viewProblem(props.row)"
            />
            <q-btn
              v-if="canEdit"
              icon="edit"
              flat
              dense
              size="sm"
              @click="editProblem(props.row)"
            />
            <q-btn
              v-if="canEdit"
              icon="delete"
              flat
              dense
              size="sm"
              color="negative"
              @click="confirmDelete(props.row.id)"
            />
          </div>
        </q-td>
      </template>
    </q-table>

    <!-- Dialog: Crear Problema -->
    <ProblemForm
      v-model="showCreateDialog"
      :evaluation-id="evaluationId"
      :tasks="tasks"
      @save="$emit('add', $event)"
    />

    <!-- Dialog: Editar Problema -->
    <ProblemForm
      v-model="showEditDialog"
      :problem="editingProblem"
      :tasks="tasks"
      @save="$emit('edit', $event)"
    />

    <!-- Dialog: Unificar Problemas -->
    <q-dialog v-model="showUnifyDialog" persistent>
      <q-card style="min-width: 500px; max-width: 700px;">
        <q-card-section class="bg-warning text-white">
          <div class="text-h6">Unificar Problemas</div>
          <div class="text-subtitle2">Combina problemas similares en uno solo</div>
        </q-card-section>

        <q-card-section>
          <div class="text-sm text-slate-500 q-mb-md">
            Selecciona los problemas que deseas unificar
          </div>

          <q-list bordered separator class="rounded-lg max-h-60 overflow-auto">
            <q-item
              v-for="problem in problems"
              :key="problem.id"
              class="hover:bg-slate-700 transition-colors"
            >
              <q-item-section avatar>
                <q-checkbox
                  v-model="unifySelected"
                  :val="problem"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ problem.title }}</q-item-label>
                <q-item-label caption class="text-slate-500">
                  {{ problem.severity }} - {{ problem.status }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="getSeverityColor(problem.severity)">
                  {{ getSeverityLabel(problem.severity) }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="unifySelected.length > 1" class="q-mt-md">
            <q-input
              v-model="unifiedTitle"
              label="Título Unificado"
              filled
              dense
            />
            <q-input
              v-model="unifiedDescription"
              label="Descripción Unificada"
              filled
              dense
              type="textarea"
              rows="2"
            />
            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6">
                <q-select
                  v-model="unifiedSeverity"
                  :options="severityOptions"
                  label="Severidad"
                  filled
                  dense
                  emit-value
                  map-options
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="unifiedCategory"
                  :options="categoryOptions"
                  label="Categoría"
                  filled
                  dense
                  emit-value
                  map-options
                />
              </div>
            </div>
          </div>
          <div v-else class="q-mt-md text-center text-slate-500">
            Selecciona al menos 2 problemas para unificar
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="showUnifyDialog = false" />
          <q-btn
            color="warning"
            label="Unificar"
            :loading="unifying"
            :disable="unifySelected.length < 2 || !unifiedTitle"
            @click="unify"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: Ver Detalle -->
    <q-dialog v-model="showDetail">
      <q-card style="min-width: 500px; max-width: 700px;">
        <q-card-section :class="getSeverityHeaderColor(viewingProblem?.severity)">
          <div class="text-h6">{{ viewingProblem?.title }}</div>
          <div class="text-subtitle2">
            {{ getSeverityLabel(viewingProblem?.severity) }} - {{ getStatusLabel(viewingProblem?.status) }}
          </div>
        </q-card-section>

        <q-card-section v-if="viewingProblem">
          <div class="space-y-3">
            <div>
              <div class="text-sm font-semibold text-slate-300">Descripción</div>
              <div class="text-slate-100">{{ viewingProblem.description }}</div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <div class="text-sm font-semibold text-slate-300">Categoría</div>
                <q-badge :color="getCategoryColor(viewingProblem.category)">
                  {{ getCategoryLabel(viewingProblem.category) }}
                </q-badge>
              </div>
              <div>
                <div class="text-sm font-semibold text-slate-300">Tareas Afectadas</div>
                <div class="flex flex-wrap gap-1">
                  <q-badge
                    v-for="taskId in viewingProblem.affectedTasks"
                    :key="taskId"
                    color="info"
                    size="sm"
                  >
                    {{ getTaskTitle(taskId) }}
                  </q-badge>
                  <span v-if="viewingProblem.affectedTasks.length === 0" class="text-slate-500 text-sm">
                    Ninguna
                  </span>
                </div>
              </div>
            </div>

            <div v-if="viewingProblem.resolutionNotes">
              <div class="text-sm font-semibold text-slate-300 text-positive">Notas de Resolución</div>
              <div class="text-slate-100">{{ viewingProblem.resolutionNotes }}</div>
            </div>

            <div class="text-xs text-slate-500">
              Creado: {{ formatDate(viewingProblem.createdAt) }}
              <span v-if="viewingProblem.updatedAt"> - Actualizado: {{ formatDate(viewingProblem.updatedAt) }}</span>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            v-if="canEdit && viewingProblem?.status !== 'resolved' && viewingProblem?.status !== 'rejected'"
            color="positive"
            label="Resolver"
            @click="changeStatus(viewingProblem.id, 'resolved')"
          />
          <q-btn
            v-if="canEdit && viewingProblem?.status !== 'resolved' && viewingProblem?.status !== 'rejected'"
            color="negative"
            label="Rechazar"
            @click="changeStatus(viewingProblem.id, 'rejected')"
          />
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import ProblemForm from './ProblemForm.vue'

const props = defineProps<{
  problems: any[]
  tasks: any[]
  evaluationId?: string
  canEdit?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'add', data: any): void
  (e: 'edit', data: any): void
  (e: 'delete', id: string): void
  (e: 'unify', data: any): void
  (e: 'status-change', id: string, status: string, notes?: string): void
}>()

const $q = useQuasar()

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showUnifyDialog = ref(false)
const showDetail = ref(false)
const editingProblem = ref<any>(null)
const viewingProblem = ref<any>(null)
const unifying = ref(false)

const unifySelected = ref<any[]>([])
const unifiedTitle = ref('')
const unifiedDescription = ref('')
const unifiedSeverity = ref('medium')
const unifiedCategory = ref('usability')

const severityOptions = [
  { label: 'Crítico', value: 'critical' },
  { label: 'Alto', value: 'high' },
  { label: 'Medio', value: 'medium' },
  { label: 'Bajo', value: 'low' }
]

const categoryOptions = [
  { label: 'Diseño', value: 'design' },
  { label: 'Funcionalidad', value: 'functionality' },
  { label: 'Navegación', value: 'navigation' },
  { label: 'Contenido', value: 'content' },
  { label: 'Rendimiento', value: 'performance' },
  { label: 'Accesibilidad', value: 'accessibility' },
  { label: 'Usabilidad', value: 'usability' },
  { label: 'Otro', value: 'other' }
]

const columns = [
  { name: 'title', label: 'Título', field: 'title', align: 'left', sortable: true },
  { name: 'severity', label: 'Severidad', field: 'severity', align: 'center' },
  { name: 'category', label: 'Categoría', field: 'category', align: 'center' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' }
]

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: 'negative',
    high: 'orange',
    medium: 'warning',
    low: 'info'
  }
  return colors[severity] || 'grey'
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo'
  }
  return labels[severity] || severity
}

const getSeverityHeaderColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: 'bg-negative text-white',
    high: 'bg-orange text-white',
    medium: 'bg-warning text-white',
    low: 'bg-info text-white'
  }
  return colors[severity] || 'bg-primary text-white'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    identified: 'grey',
    analyzing: 'orange',
    resolved: 'positive',
    rejected: 'negative'
  }
  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    identified: 'Identificado',
    analyzing: 'Analizando',
    resolved: 'Resuelto',
    rejected: 'Rechazado'
  }
  return labels[status] || status
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    design: 'primary',
    functionality: 'info',
    navigation: 'secondary',
    content: 'warning',
    performance: 'orange',
    accessibility: 'teal',
    usability: 'purple',
    other: 'grey'
  }
  return colors[category] || 'grey'
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    design: 'Diseño',
    functionality: 'Funcionalidad',
    navigation: 'Navegación',
    content: 'Contenido',
    performance: 'Rendimiento',
    accessibility: 'Accesibilidad',
    usability: 'Usabilidad',
    other: 'Otro'
  }
  return labels[category] || category
}

const getTaskTitle = (taskId: string) => {
  const task = props.tasks.find(t => t.id === taskId)
  return task?.title || taskId.slice(0, 8)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const viewProblem = (problem: any) => {
  viewingProblem.value = problem
  showDetail.value = true
}

const editProblem = (problem: any) => {
  editingProblem.value = problem
  showEditDialog.value = true
}

const changeStatus = (id: string, status: string) => {
  $q.dialog({
    title: 'Cambiar Estado',
    message: 'Ingresa notas adicionales (opcional)',
    prompt: {
      model: '',
      type: 'textarea',
      rows: 3,
      placeholder: 'Notas sobre el cambio de estado...'
    },
    ok: 'Confirmar',
    cancel: 'Cancelar',
  }).onOk((notes: string) => {
    emit('status-change', id, status, notes)
    showDetail.value = false
  })
}

const confirmDelete = (id: string) => {
  $q.dialog({
    title: 'Eliminar Problema',
    message: '¿Estás seguro de eliminar este problema?',
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: 'Cancelar',
  }).onOk(() => {
    emit('delete', id)
  })
}

const unify = async () => {
  if (unifySelected.value.length < 2 || !unifiedTitle.value) return

  unifying.value = true
  try {
    emit('unify', {
      problemIds: unifySelected.value.map(p => p.id),
      unifiedTitle: unifiedTitle.value,
      unifiedDescription: unifiedDescription.value,
      severity: unifiedSeverity.value,
      category: unifiedCategory.value
    })
    showUnifyDialog.value = false
    unifySelected.value = []
    unifiedTitle.value = ''
    unifiedDescription.value = ''
  } finally {
    unifying.value = false
  }
}
</script>