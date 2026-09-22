<!-- components/findings/FindingsSummary.vue -->
<template>
  <div>
    <!-- ========================================================== -->
    <!-- TARJETAS DE ESTADÍSTICAS                                  -->
    <!-- ========================================================== -->
    <div class="row q-col-gutter-md q-mb-md">

      <!-- Total -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-primary text-weight-bold">
              {{ summary?.total || 0 }}
            </div>

            <div class="text-caption text-secondary">
              Total Hallazgos
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Críticos -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-negative text-weight-bold">
              {{ summary?.critical || 0 }}
            </div>

            <div class="text-caption text-secondary">
              Críticos
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Activos -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-warning text-weight-bold">
              {{ summary?.active || 0 }}
            </div>

            <div class="text-caption text-secondary">
              Activos
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Tasa de resolución -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-positive text-weight-bold">
              {{ summary?.resolutionRate || 0 }}%
            </div>

            <div class="text-caption text-secondary">
              Tasa de Resolución
            </div>
          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- ========================================================== -->
    <!-- GRÁFICOS DE DISTRIBUCIÓN                                  -->
    <!-- ========================================================== -->
    <div class="row q-col-gutter-md q-mb-md">

      <!-- ======================================================== -->
      <!-- SEVERIDAD                                                -->
      <!-- ======================================================== -->
      <div class="col-12 col-md-4">
        <q-card bordered>
          <q-card-section>

            <div class="text-subtitle1 text-secondary text-weight-bold q-mb-md">
              Severidad
            </div>

            <div class="q-gutter-y-md">

              <div
                v-for="(count, severity) in summary?.bySeverity || {}"
                :key="severity"
              >

                <div class="row justify-between items-center q-mb-xs">
                  <div class="text-caption text-secondary">
                    {{ capitalize(severity) }}
                  </div>

                  <div class="text-caption text-weight-bold">
                    {{ count }}
                  </div>
                </div>

                <q-linear-progress
                  :value="Number(count) / maxSeverity"
                  :color="getSeverityColor(severity)"
                  track-color="secondary"
                  size="6px"
                  rounded
                />

              </div>

            </div>

          </q-card-section>
        </q-card>
      </div>

      <!-- ======================================================== -->
      <!-- ESTADO                                                   -->
      <!-- ======================================================== -->
      <div class="col-12 col-md-4">
        <q-card bordered>
          <q-card-section>

            <div class="text-subtitle1 text-secondary text-weight-bold q-mb-md">
              Estado
            </div>

            <div class="q-gutter-y-md">

              <div
                v-for="(count, status) in summary?.byStatus || {}"
                :key="status"
              >

                <div class="row justify-between items-center q-mb-xs">

                  <div class="text-caption text-secondary">
                    {{ getStatusLabel(status) }}
                  </div>

                  <div class="text-caption text-weight-bold">
                    {{ count }}
                  </div>

                </div>

                <q-linear-progress
                  :value="Number(count) / maxStatus"
                  :color="getStatusColor(status)"
                  track-color="secondary"
                  size="6px"
                  rounded
                />

              </div>

            </div>

          </q-card-section>
        </q-card>
      </div>

      <!-- ======================================================== -->
      <!-- TIPO                                                     -->
      <!-- ======================================================== -->
      <div class="col-12 col-md-4">
        <q-card bordered>
          <q-card-section>

            <div class="text-subtitle1 text-secondary text-weight-bold q-mb-md">
              Tipo
            </div>

            <div class="q-gutter-y-md">

              <div
                v-for="(count, type) in summary?.byType || {}"
                :key="type"
              >

                <div class="row justify-between items-center q-mb-xs">

                  <div class="text-caption text-secondary">
                    {{ getTypeLabel(type) }}
                  </div>

                  <div class="text-caption text-weight-bold">
                    {{ count }}
                  </div>

                </div>

                <q-linear-progress
                  :value="Number(count) / maxType"
                  :color="getTypeColor(type)"
                  track-color="secondary"
                  size="6px"
                  rounded
                />

              </div>

            </div>

          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- ========================================================== -->
    <!-- DONUT + DISTRIBUCIÓN                                      -->
    <!-- ========================================================== -->
    <div class="row q-col-gutter-md">

      <!-- ======================================================== -->
      <!-- GRÁFICO DONUT                                            -->
      <!-- ======================================================== -->
      <div class="col-12 col-md-6">
        <q-card bordered>
          <q-card-section>

            <div class="text-subtitle1 text-secondary text-weight-bold q-mb-md">
              Distribución por Severidad
            </div>

            <div class="row justify-center">
              <div style="width: 100%; max-width: 350px;">
                <q-chart
                  type="donut"
                  :data="donutData"
                  :options="donutOptions"
                  style="height: 250px;"
                />
              </div>
            </div>

          </q-card-section>
        </q-card>
      </div>

      <!-- ======================================================== -->
      <!-- DISTRIBUCIÓN DE HALLAZGOS                               -->
      <!-- ======================================================== -->
      <div class="col-12 col-md-6">
        <q-card bordered>
          <q-card-section>

            <div class="text-subtitle1 text-secondary text-weight-bold q-mb-md">
              Distribución de Hallazgos
            </div>

            <div class="row q-col-gutter-sm">

              <div
                v-for="(count, type) in summary?.byType || {}"
                :key="type"
                class="col-auto"
              >
                <q-chip
                  :color="getTypeColor(type)"
                  text-color="white"
                  dense
                >
                  {{ getTypeLabel(type) }}: {{ count }}
                </q-chip>
              </div>

            </div>

            <q-separator class="q-my-md" />

            <div class="row q-col-gutter-md">

              <div class="col-4">
                <div class="text-caption text-secondary">
                  Resueltos
                </div>

                <div class="text-h6 text-positive text-weight-bold">
                  {{ summary?.resolved || 0 }}
                </div>
              </div>

              <div class="col-4">
                <div class="text-caption text-secondary">
                  Activos
                </div>

                <div class="text-h6 text-warning text-weight-bold">
                  {{ summary?.active || 0 }}
                </div>
              </div>

              <div class="col-4">
                <div class="text-caption text-secondary">
                  Críticos
                </div>

                <div class="text-h6 text-negative text-weight-bold">
                  {{ summary?.critical || 0 }}
                </div>
              </div>

            </div>

          </q-card-section>
        </q-card>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  summary?: any
  findings?: any[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

// ============================================================
// VALORES MÁXIMOS
// ============================================================

const maxSeverity = computed(() => {
  if (!props.summary?.bySeverity) {
    return 1
  }

  return Math.max(
    ...(Object.values(props.summary.bySeverity) as number[]),
    1
  )
})

const maxStatus = computed(() => {
  if (!props.summary?.byStatus) {
    return 1
  }

  return Math.max(
    ...(Object.values(props.summary.byStatus) as number[]),
    1
  )
})

const maxType = computed(() => {
  if (!props.summary?.byType) {
    return 1
  }

  return Math.max(
    ...(Object.values(props.summary.byType) as number[]),
    1
  )
})

// ============================================================
// DONUT
// ============================================================

const donutData = computed(() => {
  if (!props.summary?.bySeverity) {
    return {
      labels: [],
      datasets: []
    }
  }

  const labels: string[] = []
  const data: number[] = []
  const colors: string[] = []

  for (const [severity, count] of Object.entries(
    props.summary.bySeverity
  )) {
    if (Number(count) > 0) {
      labels.push(capitalize(severity))
      data.push(Number(count))

      /*
       * Chart.js necesita colores CSS reales.
       * Estos corresponden a los colores definidos
       * en main.ts.
       */
      colors.push(getChartSeverityColor(severity))
    }
  }

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderWidth: 0
      }
    ]
  }
})

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: {
          size: 10
        }
      }
    }
  }
}

// ============================================================
// HELPERS
// ============================================================

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ============================================================
// COLORES QUASAR
// ============================================================

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: 'negative',
    high: 'negative',
    medium: 'warning',
    low: 'info'
  }

  return colors[severity] || 'secondary'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'secondary',
    in_progress: 'info',
    resolved: 'positive',
    not_resolved: 'negative',
    kept: 'info'
  }

  return colors[status] || 'secondary'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    not_resolved: 'No Resuelto',
    kept: 'Conservado'
  }

  return labels[status] || status
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    problem: 'negative',
    difficulty: 'warning',
    accessibility: 'info',
    friction: 'warning',
    positive: 'positive',
    opportunity: 'info'
  }

  return colors[type] || 'secondary'
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    problem: 'Problema',
    difficulty: 'Dificultad',
    accessibility: 'Accesibilidad',
    friction: 'Fricción',
    positive: 'Positivo',
    opportunity: 'Oportunidad'
  }

  return labels[type] || type
}

// ============================================================
// COLORES PARA CHART.JS
// ============================================================
//
// Chart.js no entiende directamente "negative", "warning", etc.
// Por eso aquí usamos los mismos valores definidos en main.ts.
//

const getChartSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: '#DC2626',
    high: '#DC2626',
    medium: '#D97706',
    low: '#0284C7'
  }

  return colors[severity] || '#334155'
}
</script>