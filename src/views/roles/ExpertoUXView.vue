<!-- views/roles/experto/ExpertoUXView.vue -->
<template>
  <div class="q-pa-md q-gutter-y-md">
    <q-card flat bordered>
      <!-- ============================================================ -->
      <!-- HEADER                                                        -->
      <!-- ============================================================ -->
      <q-card-section>
        <div class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold text-primary">
              📊 Proyectos y Evaluaciones
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              Revisa las sesiones de usabilidad agrupadas por proyecto y requerimiento
            </div>
          </div>

          <q-btn
            flat
            color="primary"
            icon="refresh"
            label="Actualizar"
            :loading="loadingProjects || loadingSessions || loadingUsers"
            @click="loadAll"
          />
        </div>
      </q-card-section>

      <!-- ============================================================ -->
      <!-- FILTROS GLOBALES                                              -->
      <!-- ============================================================ -->
      <q-separator />

      <q-card-section class="q-pb-sm">
        <div class="row q-col-gutter-sm items-center">
          <!-- Búsqueda general -->
          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.search"
              dense
              outlined
              placeholder="Buscar proyecto, tarea o usuario..."
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" size="sm" />
              </template>
            </q-input>
          </div>

          <!-- Filtro por estado -->
          <div class="col-6 col-md-2">
            <q-select
              v-model="filters.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              dense
              outlined
              label="Estado"
              clearable
            />
          </div>

          <!-- Fecha desde -->
          <div class="col-6 col-md-2">
            <q-input
              v-model="filters.dateFrom"
              dense
              outlined
              type="date"
              label="Desde"
              clearable
            />
          </div>

          <!-- Fecha hasta -->
          <div class="col-6 col-md-2">
            <q-input
              v-model="filters.dateTo"
              dense
              outlined
              type="date"
              label="Hasta"
              clearable
            />
          </div>

          <!-- Botón limpiar -->
          <div class="col-6 col-md-2">
            <q-btn
              v-if="hasActiveFilters"
              flat
              dense
              color="primary"
              icon="clear"
              label="Limpiar"
              class="full-width"
              @click="clearFilters"
            />
          </div>
        </div>

        <!-- Stats de filtros -->
        <div
          v-if="hasActiveFilters || sessions.length > 0"
          class="row q-gutter-md q-mt-sm"
        >
          <div class="text-caption text-grey-7">
            <q-icon name="filter_alt" size="14px" />
            Mostrando <strong>{{ totalFilteredSessions }}</strong>
            de <strong>{{ sessions.length }}</strong> sesiones
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- ============================================================ -->
      <!-- CONTENIDO                                                     -->
      <!-- ============================================================ -->
      <q-card-section>
        <!-- Loading -->
        <div v-if="loadingProjects" class="text-center q-py-lg">
          <q-spinner color="primary" size="md" />
          <div class="text-grey-7 q-mt-sm">Cargando proyectos…</div>
        </div>

        <!-- Sin proyectos -->
        <div
          v-else-if="filteredProjects.length === 0"
          class="text-center q-py-lg text-grey-7"
        >
          <q-icon name="inbox" size="48px" color="grey-5" />
          <div class="text-h6 q-mt-sm">
            {{ hasActiveFilters ? 'Sin resultados' : 'No hay proyectos' }}
          </div>
          <div class="text-caption">
            {{
              hasActiveFilters
                ? 'Ajusta los filtros para ver más proyectos'
                : 'No hay proyectos de Figma vinculados todavía'
            }}
          </div>
          <q-btn
            v-if="hasActiveFilters"
            flat
            color="primary"
            icon="clear"
            label="Limpiar filtros"
            class="q-mt-md"
            @click="clearFilters"
          />
        </div>

        <!-- Lista de proyectos -->
        <div v-else class="q-gutter-y-sm">
          <div
            v-for="project in filteredProjects"
            :key="project.projectId"
            class="rounded-borders overflow-hidden"
            style="border: 1px solid #e2e8f0; background: #ffffff;"
          >
            <!-- ==================================================== -->
            <!-- CABECERA DEL PROYECTO                                 -->
            <!-- ==================================================== -->
            <q-btn
              flat
              no-caps
              class="full-width text-left q-pa-md project-header"
              :class="{
                'project-header-active': expandedProjectId === project.projectId,
              }"
              @click="toggleProject(project.projectId)"
            >
              <div class="row items-center full-width no-wrap">
                <!-- Thumbnail -->
                <div class="col-auto q-mr-md">
                  <q-img
                    v-if="project.thumbnailUrl"
                    :src="project.thumbnailUrl"
                    class="rounded-borders"
                    style="width: 56px; height: 36px; object-fit: cover"
                    spinner-color="primary"
                  >
                    <template v-slot:error>
                      <div class="absolute-full flex flex-center bg-grey-3">
                        <q-icon name="image_not_supported" size="20px" color="grey-6" />
                      </div>
                    </template>
                  </q-img>
                  <div
                    v-else
                    class="rounded-borders flex flex-center"
                    style="width: 56px; height: 36px; background: #1E3A8A;"
                  >
                    <q-icon name="image" color="white" size="24px" style="opacity: 0.6" />
                  </div>
                </div>

                <!-- Info -->
                <div class="col text-left">
                  <div class="text-weight-medium text-grey-9">
                    {{ project.projectName }}
                  </div>
                  <div class="text-caption text-grey-6 q-mt-xs">
                    <q-icon name="folder" size="12px" class="q-mr-xs" />
                    {{ project.fileKey }}
                    <span class="q-mx-xs">•</span>
                    {{ getFilteredSessionCount(project.projectId) }} evaluación(es)
                  </div>
                </div>

                <!-- URL pública -->
                <div v-if="project.publicUrl" class="col-auto q-mr-sm">
                  <q-btn
                    flat
                    dense
                    round
                    icon="link"
                    color="positive"
                    size="sm"
                    @click.stop="openPublicUrl(project.publicUrl)"
                  >
                    <q-tooltip>Abrir prototipo público</q-tooltip>
                  </q-btn>
                </div>

                <!-- Expand icon -->
                <div class="col-auto text-grey-7">
                  <q-icon
                    :name="
                      expandedProjectId === project.projectId
                        ? 'expand_less'
                        : 'expand_more'
                    "
                    size="24px"
                  />
                </div>
              </div>
            </q-btn>

            <!-- ==================================================== -->
            <!-- CONTENIDO EXPANDIDO                                   -->
            <!-- ==================================================== -->
            <q-slide-transition>
              <div v-show="expandedProjectId === project.projectId">
                <q-separator />

                <!-- Loading contexto del proyecto -->
                <div
                  v-if="loadingContext.has(project.projectId)"
                  class="text-center q-py-lg text-grey-7"
                >
                  <q-spinner color="primary" size="sm" />
                  <span class="q-ml-sm">Cargando estructura del proyecto…</span>
                </div>

                <template v-else>
                  <!-- ============================================ -->
                  <!-- FILTROS INTERNOS DEL PROYECTO                 -->
                  <!-- ============================================ -->
                  <div class="project-filters q-pa-md bg-grey-1">
                    <div class="text-caption text-grey-7 q-mb-sm">
                      <q-icon name="filter_alt" size="14px" class="q-mr-xs" />
                      Filtrar sesiones de este proyecto
                    </div>

                    <div class="row q-col-gutter-sm">
                      <!-- Usuario -->
                      <div class="col-12 col-md-3">
                        <q-select
                          v-model="projectFilters[project.projectId].userId"
                          :options="getUserOptionsForProject(project.projectId)"
                          option-label="label"
                          option-value="value"
                          emit-value
                          map-options
                          dense
                          outlined
                          label="Usuario"
                          clearable
                          bg-color="white"
                        >
                          <template v-slot:prepend>
                            <q-icon name="person" size="sm" color="primary" />
                          </template>
                          <template v-slot:option="scope">
                            <q-item v-bind="scope.itemProps">
                              <q-item-section avatar>
                                <q-avatar
                                  size="32px"
                                  color="primary"
                                  text-color="white"
                                  class="text-caption"
                                >
                                  {{ scope.opt.initials }}
                                </q-avatar>
                              </q-item-section>
                              <q-item-section>
                                <q-item-label>{{ scope.opt.label }}</q-item-label>
                                <q-item-label caption>
                                  {{ scope.opt.email }} • {{ scope.opt.sessionCount }} sesiones
                                </q-item-label>
                              </q-item-section>
                            </q-item>
                          </template>
                        </q-select>
                      </div>

                      <!-- Requerimiento -->
                      <div class="col-12 col-md-3">
                        <q-select
                          v-model="projectFilters[project.projectId].requirementId"
                          :options="getRequirementOptions(project.projectId)"
                          option-label="label"
                          option-value="value"
                          emit-value
                          map-options
                          dense
                          outlined
                          label="Requerimiento"
                          clearable
                          bg-color="white"
                          @update:model-value="onRequirementChange(project.projectId)"
                        >
                          <template v-slot:prepend>
                            <q-icon name="rule" size="sm" color="primary" />
                          </template>
                          <template v-slot:option="scope">
                            <q-item v-bind="scope.itemProps">
                              <q-item-section>
                                <q-item-label>{{ scope.opt.label }}</q-item-label>
                                <q-item-label caption>
                                  {{ scope.opt.tasksCount }} tarea(s)
                                </q-item-label>
                              </q-item-section>
                            </q-item>
                          </template>
                        </q-select>
                      </div>

                      <!-- Tarea -->
                      <div class="col-12 col-md-3">
                        <q-select
                          v-model="projectFilters[project.projectId].taskId"
                          :options="
                            getTaskOptions(
                              project.projectId,
                              projectFilters[project.projectId].requirementId
                            )
                          "
                          option-label="label"
                          option-value="value"
                          emit-value
                          map-options
                          dense
                          outlined
                          label="Tarea"
                          clearable
                          bg-color="white"
                        >
                          <template v-slot:prepend>
                            <q-icon name="assignment" size="sm" color="primary" />
                          </template>
                        </q-select>
                      </div>

                      <!-- Botón limpiar -->
                      <div class="col-12 col-md-3 flex items-center">
                        <q-btn
                          v-if="hasProjectFilters(project.projectId)"
                          flat
                          dense
                          color="primary"
                          icon="clear"
                          label="Limpiar filtros"
                          no-caps
                          @click="clearProjectFilters(project.projectId)"
                        />
                      </div>
                    </div>

                    <!-- Info del filtro activo -->
                    <div
                      v-if="hasProjectFilters(project.projectId)"
                      class="text-caption text-grey-6 q-mt-sm"
                    >
                      <q-icon name="check_circle" size="14px" color="positive" />
                      Mostrando
                      {{ getFilteredSessionsByProject(project.projectId).length }}
                      sesiones con los filtros aplicados
                    </div>
                  </div>

                  <q-separator />

                  <!-- ============================================ -->
                  <!-- SESIONES AGRUPADAS POR REQUERIMIENTO          -->
                  <!-- ============================================ -->
                  <div class="q-pa-md">
                    <!-- Loading sesiones -->
                    <div
                      v-if="loadingSessions"
                      class="text-center q-py-lg text-grey-7"
                    >
                      <q-spinner color="primary" size="sm" />
                      <span class="q-ml-sm">Cargando evaluaciones…</span>
                    </div>

                    <!-- Sin sesiones -->
                    <div
                      v-else-if="
                        getFilteredSessionsByProject(project.projectId).length === 0
                      "
                      class="text-center q-py-lg text-grey-7"
                    >
                      <q-icon name="inbox" size="32px" color="grey-5" />
                      <div class="text-body2 q-mt-sm">
                        {{
                          hasAnyFilter(project.projectId)
                            ? 'No hay sesiones que coincidan con los filtros'
                            : 'Todavía no hay evaluaciones registradas'
                        }}
                      </div>
                    </div>

                    <!-- Grupos por requerimiento -->
                    <template v-else>
                      <div
                        v-for="group in getGroupedSessions(project.projectId)"
                        :key="group.requirementId"
                        class="requirement-group q-mb-lg"
                      >
                        <!-- Header del requerimiento -->
                        <div class="requirement-header q-pa-sm rounded-borders">
                          <div class="row items-center no-wrap">
                            <q-icon name="rule" size="20px" color="primary" class="q-mr-sm" />
                            <div class="col">
                              <div class="text-subtitle2 text-weight-bold">
                                <q-badge color="primary" text-color="white" class="q-mr-sm">
                                  {{ group.requirementCode }}
                                </q-badge>
                                {{ group.requirementTitle }}
                              </div>
                              <div class="text-caption text-grey-7 q-mt-xs">
                                {{ group.tasks.length }} tarea(s) •
                                {{ group.sessions.length }} sesión(es)
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Tareas dentro del requerimiento -->
                        <div
                          v-for="taskGroup in group.tasks"
                          :key="taskGroup.taskId"
                          class="task-group q-mt-md"
                        >
                          <!-- Subheader de tarea -->
                          <div class="task-header q-pa-xs q-pl-sm">
                            <div class="row items-center no-wrap">
                              <q-icon
                                name="assignment"
                                size="16px"
                                color="info"
                                class="q-mr-xs"
                              />
                              <div class="text-body2 text-weight-medium">
                                {{ taskGroup.taskTitle }}
                              </div>
                              <q-badge
                                color="info"
                                outline
                                :label="`${taskGroup.sessions.length} sesión(es)`"
                                class="q-ml-sm"
                              />
                            </div>
                          </div>

                          <!-- Tabla de sesiones -->
                          <q-table
                            :rows="taskGroup.sessions"
                            :columns="columns"
                            row-key="sessionId"
                            flat
                            dense
                            class="bg-transparent custom-table q-mt-xs"
                            :pagination="{ rowsPerPage: 5 }"
                            :rows-per-page-options="[5, 10, 25]"
                          >
                            <!-- Participante -->
                            <template v-slot:body-cell-userId="props">
                              <q-td :props="props">
                                <div class="row items-center no-wrap q-gutter-xs">
                                  <q-avatar
                                    size="28px"
                                    color="primary"
                                    text-color="white"
                                    class="text-caption"
                                  >
                                    {{ getUserInitials(props.row.userId) }}
                                  </q-avatar>
                                  <div class="column">
                                    <span
                                      class="text-body2 text-weight-medium text-grey-9"
                                    >
                                      {{ getUserName(props.row.userId) }}
                                    </span>
                                    <span class="text-caption text-grey-6">
                                      {{ getUserEmail(props.row.userId) }}
                                    </span>
                                  </div>
                                </div>
                              </q-td>
                            </template>

                            <!-- Estado -->
                            <template v-slot:body-cell-status="props">
                              <q-td :props="props">
                                <q-badge
                                  :color="getStatusColor(props.row.status)"
                                  text-color="white"
                                  :label="statusLabel(props.row.status)"
                                />
                              </q-td>
                            </template>

                            <!-- Duración -->
                            <template v-slot:body-cell-durationSeconds="props">
                              <q-td :props="props">
                                <span class="text-caption text-grey-7">
                                  {{ formatDuracion(props.row.durationSeconds) }}
                                </span>
                              </q-td>
                            </template>

                            <!-- Fecha -->
                            <template v-slot:body-cell-startedAt="props">
                              <q-td :props="props">
                                <span class="text-caption text-grey-7">
                                  {{ formatFecha(props.row.startedAt) }}
                                </span>
                              </q-td>
                            </template>

                            <!-- Acciones -->
                            <template v-slot:body-cell-actions="props">
                              <q-td :props="props" class="text-right">
                                <q-btn
                                  flat
                                  dense
                                  no-caps
                                  color="primary"
                                  icon="visibility"
                                  label="Revisar"
                                  size="sm"
                                  :disable="props.row.status === 'in_progress'"
                                  @click="irADetalle(props.row.sessionId)"
                                >
                                  <q-tooltip
                                    v-if="props.row.status === 'in_progress'"
                                  >
                                    La sesión está en curso
                                  </q-tooltip>
                                </q-btn>
                              </q-td>
                            </template>
                          </q-table>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </q-slide-transition>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserDirectory } from '@/composables/useUserDirectory'
import { useProjectContext } from '@/composables/useProjectContext'
import type { FigmaProject, UsabilitySession } from '@/types/evaluation'

const router = useRouter()

// ============================================================
// COMPOSABLES
// ============================================================
const {
  loading: loadingUsers,
  loadAllUsers,
  getUserName,
  getUserEmail,
  getUserInitials,
  usersCache,
} = useUserDirectory()

const {
  loadProjectContext,
  getRequirementBySession,
  getRequirementOptions,
  getTaskOptions,
  getTasks,
  getRequirements,
} = useProjectContext()

// ============================================================
// STATE
// ============================================================
const projects = ref<FigmaProject[]>([])
const sessions = ref<UsabilitySession[]>([])
const loadingProjects = ref(false)
const loadingSessions = ref(false)
const expandedProjectId = ref<string | null>(null)

// Loading de contexto por proyecto
const loadingContext = ref<Set<string>>(new Set())

// Filtros globales
const filters = reactive({
  search: '',
  status: null as string | null,
  dateFrom: '',
  dateTo: '',
})

// Filtros POR PROYECTO (usando un objeto indexado por projectId)
const projectFilters = reactive<
  Record<
    string,
    {
      userId: string | null
      taskId: string | null
      requirementId: string | null
    }
  >
>({})

// ============================================================
// COLUMNS
// ============================================================
const columns = [
  {
    name: 'userId',
    label: 'Participante',
    field: 'userId',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'status',
    label: 'Estado',
    field: 'status',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'durationSeconds',
    label: 'Duración',
    field: 'durationSeconds',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'startedAt',
    label: 'Fecha',
    field: 'startedAt',
    sortable: true,
    align: 'center' as const,
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right' as const,
  },
]

// ============================================================
// FILTER OPTIONS GLOBALES
// ============================================================
const statusOptions = [
  { label: 'En curso', value: 'in_progress' },
  { label: 'Completada', value: 'completed' },
  { label: 'Abandonada', value: 'abandoned' },
]

// ============================================================
// COMPUTED - FILTROS GLOBALES
// ============================================================
const hasActiveFilters = computed(
  () =>
    !!filters.search?.trim() ||
    !!filters.status ||
    !!filters.dateFrom ||
    !!filters.dateTo,
)

/**
 * Sesiones filtradas por los filtros GLOBALES
 */
const filteredSessions = computed(() => {
  let result = [...sessions.value]

  // Búsqueda por texto
  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase().trim()
    result = result.filter((s) => {
      const userName = getUserName(s.userId).toLowerCase()
      const email = getUserEmail(s.userId).toLowerCase()
      const task = (s.taskDescription || '').toLowerCase()
      return userName.includes(q) || email.includes(q) || task.includes(q)
    })
  }

  // Estado
  if (filters.status) {
    result = result.filter((s) => s.status === filters.status)
  }

  // Fecha desde
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime()
    result = result.filter((s) => new Date(s.startedAt).getTime() >= from)
  }

  // Fecha hasta
  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime() + 24 * 60 * 60 * 1000
    result = result.filter((s) => new Date(s.startedAt).getTime() <= to)
  }

  return result
})

/**
 * Proyectos filtrados: mantener todos si no hay filtros globales
 */
const filteredProjects = computed(() => {
  if (!hasActiveFilters.value) {
    return projects.value
  }

  const searchQuery = filters.search?.toLowerCase().trim() || ''

  return projects.value.filter((project) => {
    const projectMatchesSearch =
      searchQuery &&
      (project.projectName?.toLowerCase().includes(searchQuery) ||
        project.fileKey?.toLowerCase().includes(searchQuery))

    const projectSessions = sessions.value.filter(
      (s) => s.proyectId === project.projectId,
    )
    const projectSessionIds = new Set(projectSessions.map((s) => s.sessionId))
    const hasMatchingSessions = filteredSessions.value.some((s) =>
      projectSessionIds.has(s.sessionId),
    )

    return projectMatchesSearch || hasMatchingSessions
  })
})

const totalFilteredSessions = computed(() => filteredSessions.value.length)

// ============================================================
// HELPERS - FILTROS POR PROYECTO
// ============================================================
function ensureProjectFilters(projectId: string) {
  if (!projectFilters[projectId]) {
    projectFilters[projectId] = {
      userId: null,
      taskId: null,
      requirementId: null,
    }
  }
}

function hasProjectFilters(projectId: string): boolean {
  const f = projectFilters[projectId]
  if (!f) return false
  return !!f.userId || !!f.taskId || !!f.requirementId
}

function hasAnyFilter(projectId: string): boolean {
  return hasActiveFilters.value || hasProjectFilters(projectId)
}

function clearProjectFilters(projectId: string) {
  projectFilters[projectId] = {
    userId: null,
    taskId: null,
    requirementId: null,
  }
}

function onRequirementChange(projectId: string) {
  // Al cambiar el requerimiento, resetear la tarea
  if (projectFilters[projectId]) {
    projectFilters[projectId].taskId = null
  }
}

// ============================================================
// GETTERS DE OPCIONES POR PROYECTO
// ============================================================
interface UserOption {
  label: string
  value: string
  email: string
  initials: string
  sessionCount: number
}

/**
 * Usuarios que tienen sesiones en el proyecto
 */
function getUserOptionsForProject(projectId: string): UserOption[] {
  const projectSessions = sessions.value.filter(
    (s) => s.proyectId === projectId,
  )

  // Contar sesiones por usuario
  const countByUser = new Map<string, number>()
  for (const s of projectSessions) {
    if (!s.userId) continue
    countByUser.set(s.userId, (countByUser.get(s.userId) || 0) + 1)
  }

  // Construir opciones
  const options: UserOption[] = []
  for (const [userId, count] of countByUser) {
    options.push({
      label: getUserName(userId),
      value: userId,
      email: getUserEmail(userId),
      initials: getUserInitials(userId),
      sessionCount: count,
    })
  }

  return options.sort((a, b) => a.label.localeCompare(b.label))
}

// ============================================================
// FILTRADO DE SESIONES POR PROYECTO
// ============================================================
function getFilteredSessionsByProject(projectId: string) {
  ensureProjectFilters(projectId)
  const pf = projectFilters[projectId]

  // Partimos de las sesiones filtradas por los filtros GLOBALES
  let result = filteredSessions.value.filter(
    (s) => s.proyectId === projectId,
  )

  // Filtro por usuario
  if (pf.userId) {
    result = result.filter((s) => s.userId === pf.userId)
  }

  // Filtro por tarea
  if (pf.taskId) {
    result = result.filter((s) => s.taskId === pf.taskId)
  }

  // Filtro por requerimiento
  if (pf.requirementId) {
    result = result.filter((s) => {
      const req = getRequirementBySession(s.taskId)
      return req?.requirementId === pf.requirementId
    })
  }

  return result.sort(
    (a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
}

function getFilteredSessionCount(projectId: string): number {
  return getFilteredSessionsByProject(projectId).length
}

// ============================================================
// AGRUPACIÓN DE SESIONES POR REQUERIMIENTO → TAREA
// ============================================================
interface TaskGroup {
  taskId: string
  taskTitle: string
  sessions: UsabilitySession[]
}

interface RequirementGroup {
  requirementId: string
  requirementCode: string
  requirementTitle: string
  tasks: TaskGroup[]
  sessions: UsabilitySession[]
}

function getGroupedSessions(projectId: string): RequirementGroup[] {
  const filtered = getFilteredSessionsByProject(projectId)
  const grouped = new Map<string, RequirementGroup>()

  for (const session of filtered) {
    // Obtener requerimiento desde el taskId
    const req = getRequirementBySession(session.taskId)

    const reqId = req?.requirementId || '__orphan__'
    const reqCode = req?.code || 'SIN-REQ'
    const reqTitle = req?.title || 'Sin requerimiento asignado'

    // Crear grupo de requerimiento si no existe
    if (!grouped.has(reqId)) {
      grouped.set(reqId, {
        requirementId: reqId,
        requirementCode: reqCode,
        requirementTitle: reqTitle,
        tasks: [],
        sessions: [],
      })
    }
    const group = grouped.get(reqId)!
    group.sessions.push(session)

    // Buscar o crear subgrupo de tarea
    const taskId = session.taskId || '__notask__'
    let taskGroup = group.tasks.find((t) => t.taskId === taskId)

    if (!taskGroup) {
      // Buscar el título de la tarea
      const task = session.taskId
        ? getTasks(projectId).find((t) => t.taskId === session.taskId)
        : null

      taskGroup = {
        taskId,
        taskTitle:
          task?.title || session.taskDescription || 'Sin tarea asignada',
        sessions: [],
      }
      group.tasks.push(taskGroup)
    }

    taskGroup.sessions.push(session)
  }

  // Ordenar tareas dentro de cada requerimiento
  for (const group of grouped.values()) {
    group.tasks.sort((a, b) => a.taskTitle.localeCompare(b.taskTitle))
  }

  return Array.from(grouped.values())
}

// ============================================================
// HELPERS UI
// ============================================================
function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    in_progress: 'En curso',
    completed: 'Completada',
    abandoned: 'Abandonada',
  }
  return labels[status] || status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    in_progress: 'warning',
    completed: 'positive',
    abandoned: 'negative',
  }
  return colors[status] || 'grey'
}

function formatDuracion(seconds: number): string {
  if (seconds === null || seconds === undefined) return '--:--'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function formatFecha(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-BO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function openPublicUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ============================================================
// ACTIONS
// ============================================================
async function toggleProject(projectId: string) {
  if (expandedProjectId.value === projectId) {
    expandedProjectId.value = null
    return
  }

  expandedProjectId.value = projectId
  ensureProjectFilters(projectId)

  // Cargar contexto del proyecto (tareas + requerimientos)
  if (!loadingContext.value.has(projectId)) {
    loadingContext.value.add(projectId)
    try {
      await loadProjectContext(projectId)
    } finally {
      loadingContext.value.delete(projectId)
    }
  }
}

function clearFilters() {
  filters.search = ''
  filters.status = null
  filters.dateFrom = ''
  filters.dateTo = ''
}

function irADetalle(sessionId: string) {
  router.push({
    name: 'experto-sesion-detalle',
    params: { sessionId },
  })
}

// ============================================================
// LOAD DATA
// ============================================================
async function loadProjects() {
  loadingProjects.value = true
  try {
    const res = await fetch('/api/figma-projects')
    if (res.ok) {
      projects.value = await res.json()
    }
  } catch (error) {
    console.error('Error cargando proyectos:', error)
  } finally {
    loadingProjects.value = false
  }
}

async function loadSessions() {
  loadingSessions.value = true
  try {
    const res = await fetch('/api/usability-sessions')
    if (res.ok) {
      sessions.value = await res.json()
    }
  } catch (error) {
    console.error('Error cargando sesiones:', error)
  } finally {
    loadingSessions.value = false
  }
}

async function loadAll() {
  await Promise.all([loadProjects(), loadSessions(), loadAllUsers()])
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  await loadAll()
})
</script>

<style scoped>
/* ============================================================ */
/* HEADER DEL PROYECTO                                           */
/* ============================================================ */
.project-header {
  transition: background 0.15s ease;
}

.project-header:hover {
  background: #f1f5f9;
}

.project-header-active {
  background: #ebf4ff !important;
}

/* ============================================================ */
/* FILTROS INTERNOS                                              */
/* ============================================================ */
.project-filters {
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

/* ============================================================ */
/* GRUPOS DE REQUERIMIENTO                                        */
/* ============================================================ */
.requirement-group {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: white;
}

.requirement-header {
  background: linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
}

.task-group {
  padding: 0 12px;
}

.task-header {
  background: #f8fafc;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
}

/* ============================================================ */
/* TABLA PERSONALIZADA                                           */
/* ============================================================ */
.custom-table :deep(.q-table thead tr th) {
  color: #0f172a !important;
  font-weight: 600 !important;
  font-size: 0.7rem !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0 !important;
  background: #f8fafc;
}

.custom-table :deep(.q-table tbody td) {
  color: #0f172a !important;
  border-bottom: 1px solid #f1f5f9 !important;
  padding: 8px 12px;
}

.custom-table :deep(.q-table tbody tr:hover) {
  background: #f8fafc !important;
}

.custom-table :deep(.q-table tbody tr:last-child td) {
  border-bottom: none !important;
}

/* ============================================================ */
/* SCROLLBAR                                                     */
/* ============================================================ */
.custom-table :deep(.q-table__middle) {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.custom-table :deep(.q-table__middle::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

.custom-table :deep(.q-table__middle::-webkit-scrollbar-track) {
  background: transparent;
}

.custom-table :deep(.q-table__middle::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 3px;
}

.custom-table :deep(.q-table__middle::-webkit-scrollbar-thumb:hover) {
  background: #94a3b8;
}
</style>