<!-- ExpertoUXView - Sin fondo principal, solo colores Quasar -->
<template>
  <div class="q-pa-md q-gutter-y-md">
    <!-- Tarjeta sin fondo oscuro -->
    <q-card>
      <q-card-section>
        <div class="text-h6" style="color: #1E3A8A;">Proyectos y evaluaciones</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <!-- Loading -->
        <div v-if="loadingProjects" class="text-center q-py-lg">
          <q-spinner color="primary" size="md" />
          <div style="color: #334155;">Cargando proyectos…</div>
        </div>

        <!-- Sin proyectos -->
        <div v-else-if="projects.length === 0" style="color: #334155;" class="text-center q-py-lg">
          No hay proyectos de Figma vinculados todavía.
        </div>

        <!-- Lista de proyectos -->
        <div v-else class="q-gutter-y-sm">
          <div
            v-for="project in projects"
            :key="project.projectId"
            class="rounded-borders overflow-hidden"
            style="border: 1px solid #e2e8f0; background: #ffffff;"
          >
            <!-- Cabecera del proyecto -->
            <q-btn
              flat
              no-caps
              class="full-width text-left q-pa-md"
              :style="expandedProjectId === project.projectId 
                ? 'background: #EBF4FF; color: #1E3A8A;' 
                : 'hover:background: #F1F5F9; color: #1E3A8A;'"
              @click="toggleProject(project.projectId)"
            >
              <div class="row items-center full-width">
                <div class="col-auto q-mr-md">
                  <q-img
                    v-if="project.thumbnailUrl"
                    :src="project.thumbnailUrl"
                    class="rounded-borders"
                    style="width: 56px; height: 36px; object-fit: cover"
                    spinner-color="primary"
                  />
                  <div v-else class="rounded-borders" style="width: 56px; height: 36px; background: #1E3A8A;">
                    <q-icon name="image" color="white" size="24px" class="absolute-center" style="opacity: 0.4" />
                  </div>
                </div>
                <div class="col text-left">
                  <div style="color: #0F172A; font-weight: 500;">{{ project.projectName }}</div>
                  <div style="color: #334155; font-size: 0.75rem;">{{ sessionCountLabel(project.projectId) }}</div>
                </div>
                <div class="col-auto" style="color: #334155;">
                  <q-icon :name="expandedProjectId === project.projectId ? 'expand_less' : 'expand_more'" />
                </div>
              </div>
            </q-btn>

            <!-- Contenido expandido -->
            <q-slide-transition>
              <div v-show="expandedProjectId === project.projectId">
                <q-separator />

                <!-- Tabla de sesiones -->
                <div class="q-pa-md">
                  <div v-if="loadingSessions" class="text-center q-py-lg" style="color: #334155;">
                    <q-spinner color="primary" size="sm" />
                    <span class="q-ml-sm">Cargando evaluaciones…</span>
                  </div>

                  <div v-else-if="sessionsPorProyecto(project.projectId).length === 0" class="text-center q-py-lg" style="color: #334155;">
                    Todavía no hay evaluaciones registradas para este proyecto.
                  </div>

                  <q-table
                    v-else
                    :rows="sessionsPorProyecto(project.projectId)"
                    :columns="columns"
                    row-key="sessionId"
                    flat
                    dense
                    class="bg-transparent"
                    :pagination="{ rowsPerPage: 10 }"
                  >
                    <!-- Columna: Participante -->
                    <template v-slot:body-cell-userId="props">
                      <q-td :props="props">
                        <span class="font-mono text-xs" style="color: #0F172A; opacity: 0.7;">
                          {{ (props.row.userId ?? '').slice(0, 8) || '—' }}
                        </span>
                      </q-td>
                    </template>

                    <!-- Columna: Tarea -->
                    <template v-slot:body-cell-taskDescription="props">
                      <q-td :props="props">
                        <span style="color: #0F172A;" :title="props.row.taskDescription">
                          {{ props.row.taskDescription || '—' }}
                        </span>
                      </q-td>
                    </template>

                    <!-- Columna: Estado -->
                    <template v-slot:body-cell-status="props">
                      <q-td :props="props">
                        <span
                          class="text-xs q-px-sm q-py-xs rounded-borders"
                          :style="{
                            background: statusBadgeBackground(props.row.status),
                            color: '#FFFFFF',
                            fontWeight: '500'
                          }"
                        >
                          {{ statusLabel(props.row.status) }}
                        </span>
                      </q-td>
                    </template>

                    <!-- Columna: Duración -->
                    <template v-slot:body-cell-durationSeconds="props">
                      <q-td :props="props">
                        <span style="color: #0F172A; opacity: 0.7;">{{ formatDuracion(props.row.durationSeconds) }}</span>
                      </q-td>
                    </template>

                    <!-- Columna: Fecha -->
                    <template v-slot:body-cell-startedAt="props">
                      <q-td :props="props">
                        <span style="color: #0F172A; opacity: 0.7;">{{ formatFecha(props.row.startedAt) }}</span>
                      </q-td>
                    </template>

                    <!-- Columna: Acciones -->
                    <template v-slot:body-cell-actions="props">
                      <q-td :props="props" class="text-right">
                        <q-btn
                          flat
                          dense
                          no-caps
                          :disable="props.row.status === 'in_progress'"
                          @click="irADetalle(props.row.sessionId)"
                          label="Revisar"
                          :style="props.row.status === 'in_progress' 
                            ? 'opacity: 0.3; color: #334155;' 
                            : 'color: #3B82F6; font-weight: 500;'"
                        />
                      </q-td>
                    </template>
                  </q-table>
                </div>
              </div>
            </q-slide-transition>
          </div>
        </div>
      </q-card-section>

      <!-- Estadísticas -->
      <q-separator v-if="sessions.length > 0" />

   
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FigmaProject, UsabilitySession } from '@/types/evaluation'

const router = useRouter()

// Definición de columnas para la tabla
const columns = [
  { name: 'userId', label: 'Participante', field: 'userId', sortable: true, align: 'left' },
  { name: 'taskDescription', label: 'Tarea', field: 'taskDescription', sortable: true, align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', sortable: true, align: 'left' },
  { name: 'durationSeconds', label: 'Duración', field: 'durationSeconds', sortable: true, align: 'left' },
  { name: 'startedAt', label: 'Fecha', field: 'startedAt', sortable: true, align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

const projects = ref<FigmaProject[]>([])
const sessions = ref<UsabilitySession[]>([])
const loadingProjects = ref(false)
const loadingSessions = ref(false)
const expandedProjectId = ref<string | null>(null)

// Estadísticas
const totalCompletadas = computed(() => sessions.value.filter((s) => s.status === 'completed').length)
const totalEnCurso = computed(() => sessions.value.filter((s) => s.status === 'in_progress').length)
const totalAbandonadas = computed(() => sessions.value.filter((s) => s.status === 'abandoned').length)

onMounted(async () => {
  loadingProjects.value = true
  try {
    const res = await fetch('/api/figma-projects')
    if (res.ok) projects.value = await res.json()
  } catch (error) {
    console.error('Error cargando proyectos:', error)
  } finally {
    loadingProjects.value = false
  }
})

async function toggleProject(projectId: string) {
  if (expandedProjectId.value === projectId) {
    expandedProjectId.value = null
    return
  }
  expandedProjectId.value = projectId

  if (sessions.value.length === 0) {
    loadingSessions.value = true
    try {
      const res = await fetch('/api/usability-sessions')
      if (res.ok) sessions.value = await res.json()
    } catch (error) {
      console.error('Error cargando sesiones:', error)
    } finally {
      loadingSessions.value = false
    }
  }
}

function sessionsPorProyecto(projectId: string) {
  return sessions.value
    .filter((s) => s.proyectId === projectId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
}

function sessionCountLabel(projectId: string) {
  if (sessions.value.length === 0 && expandedProjectId.value !== projectId) {
    return 'Ver evaluaciones'
  }
  const count = sessionsPorProyecto(projectId).length
  return `${count} evaluación${count === 1 ? '' : 'es'}`
}

function statusLabel(status: UsabilitySession['status']) {
  const labels = {
    in_progress: 'En curso',
    completed: 'Completada',
    abandoned: 'Abandonada'
  }
  return labels[status] || status
}

function statusBadgeBackground(status: UsabilitySession['status']) {
  const colors = {
    in_progress: '#D97706',  // warning
    completed: '#16A34A',   // positive
    abandoned: '#DC2626'    // negative
  }
  return colors[status] || '#334155'  // secondary
}

function formatDuracion(seconds: number) {
  if (!seconds && seconds !== 0) return '--:--'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function formatFecha(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
}

function irADetalle(sessionId: string) {
  router.push({ name: 'experto-sesion-detalle', params: { sessionId } })
}
</script>

<style scoped>
/* Estilos para la tabla en modo claro */
:deep(.q-table thead tr th) {
  color: #0F172A !important;
  opacity: 0.7 !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

:deep(.q-table tbody td) {
  color: #0F172A !important;
  border-bottom: 1px solid #f1f5f9 !important;
}

:deep(.q-table tbody tr:hover) {
  background: #F1F5F9 !important;
}

/* Scrollbar personalizada */
:deep(.q-table__container) {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

:deep(.q-table__container::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(.q-table__container::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.q-table__container::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 3px;
}

:deep(.q-table__container::-webkit-scrollbar-thumb:hover) {
  background: #94a3b8;
}
</style>