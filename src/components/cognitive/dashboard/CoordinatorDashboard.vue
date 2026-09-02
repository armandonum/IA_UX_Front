<!-- components/dashboard/CoordinatorDashboard.vue -->
<template>
  <div>

    <!-- Estadísticas rápidas -->
    <div class="row q-col-gutter-md q-mb-md">

      <!-- Tareas Totales -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center q-py-sm">
            <div class="text-h5 text-weight-bold text-primary">
              {{ dashboard?.totalTasks || 0 }}
            </div>

            <div class="text-caption text-grey-6">
              Tareas Totales
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Tareas Completadas -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center q-py-sm">
            <div class="text-h5 text-weight-bold text-positive">
              {{ dashboard?.completedTasks || 0 }}
            </div>

            <div class="text-caption text-grey-6">
              Tareas Completadas
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- En Progreso -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center q-py-sm">
            <div class="text-h5 text-weight-bold text-warning">
              {{ dashboard?.inProgressTasks || 0 }}
            </div>

            <div class="text-caption text-grey-6">
              En Progreso
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Fallidas -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center q-py-sm">
            <div class="text-h5 text-weight-bold text-negative">
              {{ dashboard?.failedTasks || 0 }}
            </div>

            <div class="text-caption text-grey-6">
              Fallidas
            </div>
          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- Progreso general -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>

        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-weight-medium">
            Progreso General
          </div>

          <div class="text-caption text-grey-6">
            {{ dashboard?.progress || 0 }}%
          </div>
        </div>

        <q-linear-progress
          :value="(dashboard?.progress || 0) / 100"
          color="primary"
          track-color="grey-3"
          rounded
          size="8px"
        />

      </q-card-section>
    </q-card>

    <!-- Progreso por evaluador -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>

        <div class="text-subtitle2 text-weight-medium q-mb-md">
          Progreso por Evaluador
        </div>

        <div class="column q-gutter-md">

          <div
            v-for="evaluator in evaluators"
            :key="evaluator.id"
            class="row items-center q-gutter-sm"
          >

            <!-- Nombre -->
            <div
              class="col-12 col-sm-3 text-body2 ellipsis"
              :title="evaluator.userFullName || evaluator.userId"
            >
              {{ evaluator.userFullName || evaluator.userId.slice(0, 8) }}
            </div>

            <!-- Progreso -->
            <div class="col">
              <q-linear-progress
                :value="(evaluator.progress || 0) / 100"
                :color="getProgressColor(evaluator.progress || 0)"
                track-color="grey-3"
                rounded
                size="7px"
              />
            </div>

            <!-- Porcentaje -->
            <div class="text-caption text-grey-6">
              {{ evaluator.progress || 0 }}%
            </div>

            <!-- Estado -->
            <q-badge
              :color="evaluator.hasCompleted ? 'positive' : 'warning'"
              rounded
            >
              <q-icon
                :name="evaluator.hasCompleted ? 'check' : 'schedule'"
                size="14px"
                class="q-mr-xs"
              />

              {{ evaluator.hasCompleted ? 'Completado' : 'Pendiente' }}
            </q-badge>

          </div>

          <!-- Sin evaluadores -->
          <div
            v-if="!evaluators || evaluators.length === 0"
            class="column items-center q-py-lg"
          >
            <q-icon
              name="groups"
              size="40px"
              color="grey-5"
            />

            <div class="text-caption text-grey-6 q-mt-sm">
              No hay evaluadores asignados
            </div>
          </div>

        </div>

      </q-card-section>
    </q-card>

    <!-- Resúmenes -->
    <div class="row q-col-gutter-md">

      <!-- Resumen de respuestas -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="full-height">
          <q-card-section>

            <div class="text-subtitle2 text-weight-medium q-mb-md">
              Distribución de Respuestas
            </div>

            <div class="row text-center">

              <div class="col">
                <div class="text-h5 text-weight-bold text-positive">
                  {{ responseStats?.completed || 0 }}
                </div>

                <div class="text-caption text-grey-6">
                  Completadas
                </div>
              </div>

              <div class="col">
                <div class="text-h5 text-weight-bold text-warning">
                  {{ responseStats?.pending || 0 }}
                </div>

                <div class="text-caption text-grey-6">
                  Pendientes
                </div>
              </div>

              <div class="col">
                <div class="text-h5 text-weight-bold text-negative">
                  {{ responseStats?.withIssues || 0 }}
                </div>

                <div class="text-caption text-grey-6">
                  Con Problemas
                </div>
              </div>

            </div>

          </q-card-section>
        </q-card>
      </div>

      <!-- Resumen de problemas -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="full-height">
          <q-card-section>

            <div class="text-subtitle2 text-weight-medium q-mb-md">
              Resumen de Problemas
            </div>

            <div class="row text-center">

              <div class="col">
                <div class="text-h5 text-weight-bold text-negative">
                  {{ problemSummary?.bySeverity?.critical || 0 }}
                </div>

                <div class="text-caption text-grey-6">
                  Críticos
                </div>
              </div>

              <div class="col">
                <div class="text-h5 text-weight-bold text-warning">
                  {{ problemSummary?.activeProblems || 0 }}
                </div>

                <div class="text-caption text-grey-6">
                  Activos
                </div>
              </div>

              <div class="col">
                <div class="text-h5 text-weight-bold text-positive">
                  {{ problemSummary?.resolvedProblems || 0 }}
                </div>

                <div class="text-caption text-grey-6">
                  Resueltos
                </div>
              </div>

            </div>

          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- Últimas respuestas -->
    <q-card flat bordered class="q-mt-md">
      <q-card-section>

        <div class="row items-center q-mb-md">
          <q-icon
            name="question_answer"
            color="primary"
            size="20px"
            class="q-mr-sm"
          />

          <div class="text-subtitle2 text-weight-medium">
            Últimas Respuestas
          </div>
        </div>

        <q-table
          :rows="recentResponses"
          :columns="responseColumns"
          row-key="id"
          flat
          dense
          hide-pagination
          :rows-per-page-options="[0]"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="getStatusColor(props.row.status)"
              >
                {{ getStatusLabel(props.row.status) }}
              </q-badge>
            </q-td>
          </template>
        </q-table>

        <!-- Sin respuestas -->
        <div
          v-if="recentResponses.length === 0"
          class="column items-center q-py-lg"
        >
          <q-icon
            name="inbox"
            size="40px"
            color="grey-5"
          />

          <div class="text-caption text-grey-6 q-mt-sm">
            No hay respuestas registradas
          </div>
        </div>

      </q-card-section>
    </q-card>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dashboard?: any
  responses?: any[]
  problems?: any[]
  recommendations?: any[]
  evaluators?: any[]
  responseStats?: any
  problemSummary?: any
  loading?: boolean
}>()

const responseColumns = [
  {
    name: 'taskTitle',
    label: 'Tarea',
    field: 'taskTitle',
    align: 'left'
  },
  {
    name: 'status',
    label: 'Estado',
    field: 'status',
    align: 'center'
  },
  {
    name: 'createdAt',
    label: 'Fecha',
    field: 'createdAt',
    align: 'center'
  }
]

const recentResponses = computed(() => {
  if (!props.responses) return []

  return [...props.responses]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5)
})

const getProgressColor = (progress: number) => {
  if (progress >= 100) return 'positive'
  if (progress >= 50) return 'warning'
  return 'accent'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'grey',
    completed: 'positive',
    skipped: 'warning'
  }

  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    completed: 'Completada',
    skipped: 'Saltada'
  }

  return labels[status] || status
}
</script>