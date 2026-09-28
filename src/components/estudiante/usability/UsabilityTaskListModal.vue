<template>
  <q-dialog :model-value="show" persistent>
    <q-card style="min-width: 600px; max-width: 90vw; max-height: 90vh">
      <!-- Header -->
      <q-card-section class="bg-primary text-white">
        <div class="row items-center">
          <q-icon name="list_alt" size="32px" class="q-mr-sm" />
          <div class="col">
            <div class="text-h6">Tareas de la evaluación</div>
            <div class="text-caption" style="opacity: 0.85">
              {{ tasks.length }} tarea(s) · {{ completedCount }} completada(s)
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Filtros -->
      <q-card-section class="q-py-sm bg-grey-2">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-md-6">
            <q-input
              v-model="searchQuery"
              dense
              outlined
              placeholder="Buscar tarea..."
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-btn-toggle
              v-model="filterStatus"
              spread
              no-caps
              dense
              unelevated
              toggle-color="primary"
              :options="[
                { label: 'Todas', value: 'all' },
                { label: 'Pendientes', value: 'pending' },
                { label: 'Completadas', value: 'completed' },
              ]"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Lista de tareas -->
      <q-card-section class="q-py-md" style="max-height: 55vh; overflow-y: auto">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-center q-py-xl">
          <q-spinner color="primary" size="48px" />
          <div class="q-ml-sm text-grey-7">Cargando tareas...</div>
        </div>

        <!-- Sin tareas -->
        <div
          v-else-if="filteredTasks.length === 0"
          class="text-center q-py-xl text-grey-6"
        >
          <q-icon name="inbox" size="64px" />
          <div class="text-h6 q-mt-sm">No hay tareas</div>
          <div class="text-caption">
            {{ tasks.length === 0 ? 'El proyecto no tiene tareas asignadas' : 'Ninguna tarea coincide con los filtros' }}
          </div>
        </div>

        <!-- Lista agrupada por requerimiento -->
        <template v-else>
          <div
            v-for="group in groupedTasks"
            :key="group.requirementId || 'sin-requerimiento'"
            class="q-mb-lg"
          >
            <!-- Subtítulo del requerimiento -->
            <div
              v-if="group.requirement"
              class="requirement-header q-mb-sm"
            >
              <div class="row items-center q-gutter-sm">
                <q-badge color="primary" outline class="text-weight-bold">
                  {{ group.requirement.code }}
                </q-badge>
                <div class="text-subtitle2 text-weight-medium">
                  {{ group.requirement.title }}
                </div>
              </div>
              <div
                v-if="group.requirement.description"
                class="text-caption text-grey-6 q-mt-xs"
              >
                {{ group.requirement.description }}
              </div>
            </div>

            <!-- Tareas del requerimiento -->
            <div class="q-gutter-y-sm">
              <q-card
                v-for="task in group.tasks"
                :key="task.taskId"
                flat
                bordered
                :class="[
                  'task-card cursor-pointer',
                  isCompleted(task.taskId) ? 'task-card--completed' : 'task-card--pending',
                ]"
                @click="!isCompleted(task.taskId) && $emit('seleccionar-tarea', task)"
              >
                <q-card-section class="q-py-sm">
                  <div class="row items-center no-wrap">
                    <!-- Icono de estado -->
                    <q-avatar
                      :color="isCompleted(task.taskId) ? 'positive' : 'primary'"
                      text-color="white"
                      size="36px"
                      class="q-mr-sm"
                    >
                      <q-icon
                        :name="isCompleted(task.taskId) ? 'check' : 'play_arrow'"
                        size="20px"
                      />
                    </q-avatar>

                    <!-- Contenido -->
                    <div class="col">
                      <div class="text-subtitle2 text-weight-medium ellipsis">
                        {{ task.title }}
                      </div>
                      <div
                        v-if="task.description"
                        class="text-caption text-grey-6 ellipsis-2-lines q-mt-xs"
                      >
                        {{ task.description }}
                      </div>
                    </div>

                    <!-- Chip de estado -->
                    <q-chip
                      v-if="isCompleted(task.taskId)"
                      color="positive"
                      text-color="white"
                      icon="check_circle"
                      size="sm"
                      dense
                    >
                      Completada
                    </q-chip>
                    <q-icon
                      v-else
                      name="arrow_forward"
                      color="primary"
                      size="20px"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Task } from '@/types/usability'

const props = defineProps<{
  show: boolean
  tasks: Task[]
  completedTaskIds: Set<string>
  loading: boolean
}>()

defineEmits<{
  (e: 'seleccionar-tarea', task: Task): void
}>()

// ============================================================
// ESTADO
// ============================================================
const searchQuery = ref('')
const filterStatus = ref<'all' | 'pending' | 'completed'>('all')
const requirements = ref<Record<string, { code: string; title: string; description?: string }>>({})

// ============================================================
// HELPERS
// ============================================================
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function isCompleted(taskId: string): boolean {
  return props.completedTaskIds.has(taskId)
}

// ============================================================
// CARGAR REQUERIMIENTOS
// ============================================================
async function loadRequirements() {
  // Obtener los requirement_id únicos
  const requirementIds = new Set<string>()
  props.tasks.forEach(t => {
    if ((t as any).requirementId) {
      requirementIds.add((t as any).requirementId)
    }
  })

  if (requirementIds.size === 0) return

  // Cargar cada requerimiento
  try {
    const promises = Array.from(requirementIds).map(async (id) => {
      try {
        const res = await fetch(`${BASE_URL}/project-requirements/${id}`)
        if (!res.ok) return null
        const data = await res.json()
        return { id, data }
      } catch {
        return null
      }
    })

    const results = await Promise.all(promises)

    const map: Record<string, any> = {}
    results.forEach(r => {
      if (r) {
        map[r.id] = {
          code: r.data.code || 'REQ',
          title: r.data.title || 'Requerimiento',
          description: r.data.description || '',
        }
      }
    })

    requirements.value = map
  } catch (e) {
    console.warn('No se pudieron cargar los requerimientos:', e)
  }
}

// ============================================================
// AGRUPAR TAREAS
// ============================================================
const filteredTasks = computed(() => {
  let result = props.tasks

  // Filtro por estado
  if (filterStatus.value === 'pending') {
    result = result.filter(t => !isCompleted(t.taskId))
  } else if (filterStatus.value === 'completed') {
    result = result.filter(t => isCompleted(t.taskId))
  }

  // Filtro por búsqueda
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(
      t =>
        (t.title || '').toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query),
    )
  }

  return result
})

const groupedTasks = computed(() => {
  const groups: Record<string, { requirementId: string | null; requirement: any; tasks: Task[] }> = {}

  filteredTasks.value.forEach(task => {
    const reqId = (task as any).requirementId || 'sin-requerimiento'

    if (!groups[reqId]) {
      groups[reqId] = {
        requirementId: reqId === 'sin-requerimiento' ? null : reqId,
        requirement: requirements.value[reqId] || null,
        tasks: [],
      }
    }

    groups[reqId].tasks.push(task)
  })

  return Object.values(groups)
})

const completedCount = computed(() => {
  return props.tasks.filter(t => isCompleted(t.taskId)).length
})

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(() => {
  if (props.show) {
    loadRequirements()
  }
})

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      loadRequirements()
    }
  },
)
</script>

<style scoped>
.task-card {
  transition: all 0.15s ease-in-out;
}

.task-card--pending:hover {
  border-color: var(--q-primary);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.12);
  transform: translateY(-2px);
}

.task-card--completed {
  background: #f0fdf4;
  border-color: #86efac;
  cursor: default;
  opacity: 0.85;
}

.requirement-header {
  padding: 8px 12px;
  background: #f8fafc;
  border-left: 3px solid var(--q-primary);
  border-radius: 4px;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>