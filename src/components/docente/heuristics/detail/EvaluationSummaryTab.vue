<!-- components/docente/heuristics/detail/EvaluationSummaryTab.vue -->
<template>
  <div>
    <!-- ============================================================ -->
    <!-- INFO GENERAL                                                  -->
    <!-- ============================================================ -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-md">
              📋 Información general
            </div>
            <q-markup-table flat dense separator="none">
              <tbody>
                <tr>
                  <td class="text-grey-6" style="width: 40%">Framework</td>
                  <td class="text-weight-medium">{{ framework?.name || '—' }}</td>
                </tr>
                <tr>
                  <td class="text-grey-6">Autor</td>
                  <td>{{ framework?.author || '—' }}</td>
                </tr>
                <tr>
                  <td class="text-grey-6">Año</td>
                  <td>{{ framework?.year || '—' }}</td>
                </tr>
                <tr>
                  <td class="text-grey-6">Duración máx.</td>
                  <td>{{ evaluation.maxDurationMinutes }} minutos</td>
                </tr>
                <tr>
                  <td class="text-grey-6">Estado</td>
                  <td>
                    <q-badge :color="getStatusColor(evaluation.status)" text-color="white">
                      {{ getStatusLabel(evaluation.status) }}
                    </q-badge>
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-md">
              🎯 Contexto
            </div>
            <div class="q-mb-md">
              <div class="text-caption text-grey-6">Descripción</div>
              <div>{{ evaluation.description || 'Sin descripción' }}</div>
            </div>
            <div class="q-mb-md">
              <div class="text-caption text-grey-6">Sistema a evaluar</div>
              <div>{{ evaluation.systemDescription || '—' }}</div>
            </div>
            <div>
              <div class="text-caption text-grey-6">Usuarios objetivo</div>
              <div>{{ evaluation.targetUserDescription || '—' }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- STATS                                                         -->
    <!-- ============================================================ -->
    <div class="text-subtitle2 text-weight-bold q-mb-sm">
      📊 Estadísticas
    </div>
    <div class="row q-col-gutter-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-primary text-weight-bold">
            {{ stats.totalEvaluators }}
          </div>
          <div class="text-caption text-grey-7">Evaluadores</div>
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ stats.completedEvaluators }} completados
          </div>
        </q-card>
      </div>

      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-warning text-weight-bold">
            {{ stats.totalTasks }}
          </div>
          <div class="text-caption text-grey-7">Tareas</div>
        </q-card>
      </div>

      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-negative text-weight-bold">
            {{ stats.totalObservations }}
          </div>
          <div class="text-caption text-grey-7">Observaciones</div>
        </q-card>
      </div>

      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-positive text-weight-bold">
            {{ stats.totalPositiveAspects }}
          </div>
          <div class="text-caption text-grey-7">Aspectos positivos</div>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- PROGRESO                                                      -->
    <!-- ============================================================ -->
    <q-card flat bordered class="q-mt-md">
      <q-card-section>
        <div class="text-subtitle2 text-weight-bold q-mb-md">
          📈 Progreso general
        </div>
        <div class="row items-center q-gutter-md">
          <q-circular-progress
            :value="stats.progressPercent"
            size="80px"
            :thickness="0.15"
            color="primary"
            track-color="grey-3"
            show-value
            class="text-h6 text-weight-bold"
          >
            {{ stats.progressPercent }}%
          </q-circular-progress>
          <div class="col">
            <div class="text-body2">
              <strong>{{ stats.completedEvaluators }}</strong> de
              <strong>{{ stats.totalEvaluators }}</strong> evaluadores han completado
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- EVALUADORES                                                   -->
    <!-- ============================================================ -->
    <q-card v-if="evaluators.length" flat bordered class="q-mt-md">
      <q-card-section>
        <div class="text-subtitle2 text-weight-bold q-mb-md">
          👥 Evaluadores asignados
        </div>
        <q-list separator>
          <q-item v-for="ev in evaluators" :key="ev.id">
            <q-item-section avatar>
              <q-avatar
                :color="ev.completedAt ? 'positive' : 'primary'"
                text-color="white"
                size="36px"
              >
                <q-icon
                  :name="ev.completedAt ? 'check' : 'person'"
                  size="18px"
                />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>Usuario: {{ shortId(ev.userId) }}</q-item-label>
              <q-item-label caption>{{ ev.role }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge
                :color="ev.completedAt ? 'positive' : 'warning'"
                text-color="white"
              >
                {{ ev.completedAt ? 'Completado' : 'Pendiente' }}
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import type {
  HeuristicEvaluation,
  HeuristicFramework,
  HeuristicEvaluator,
} from '@/api/heuristic.api'

defineProps<{
  evaluation: HeuristicEvaluation
  framework: HeuristicFramework | null
  evaluators: HeuristicEvaluator[]
  stats: {
    totalTasks: number
    totalEvaluators: number
    completedEvaluators: number
    totalObservations: number
    totalPositiveAspects: number
    progressPercent: number
  }
}>()

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    planning: 'Planificación',
    in_progress: 'En progreso',
    completed: 'Completada',
    archived: 'Archivada',
  }
  return labels[status] || status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'grey-6',
    planning: 'info',
    in_progress: 'warning',
    completed: 'positive',
    archived: 'grey-7',
  }
  return colors[status] || 'grey'
}

function shortId(id: string): string {
  return `#${id.substring(0, 8)}`
}
</script>