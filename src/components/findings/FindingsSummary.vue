<!-- components/findings/FindingsSummary.vue - LIMPIO -->
<template>
  <div>
    <!-- ========================================================== -->
    <!-- TARJETAS DE ESTADÍSTICAS PRINCIPALES                      -->
    <!-- ========================================================== -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-primary text-weight-bold">
              {{ summary?.total || 0 }}
            </div>
            <div class="text-caption text-grey-7">Total Hallazgos</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-negative text-weight-bold">
              {{ summary?.critical || 0 }}
            </div>
            <div class="text-caption text-grey-7">Críticos</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-warning text-weight-bold">
              {{ summary?.active || 0 }}
            </div>
            <div class="text-caption text-grey-7">Activos</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card bordered>
          <q-card-section class="text-center">
            <div class="text-h4 text-positive text-weight-bold">
              {{ summary?.resolutionRate || 0 }}%
            </div>
            <div class="text-caption text-grey-7">Tasa de Resolución</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- DISTRIBUCIONES SIMPLES                                     -->
    <!-- ========================================================== -->
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Severidad -->
      <div class="col-12 col-md-4">
        <q-card bordered>
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-md">
              Severidad
            </div>

            <div class="q-gutter-y-sm">
              <div
                v-for="(count, severity) in summary?.bySeverity || {}"
                :key="severity"
              >
                <div class="row justify-between items-center q-mb-xs">
                  <div class="text-caption text-grey-7">
                    {{ getSeverityLabel(String(severity)) }}
                  </div>
                  <div class="text-caption text-weight-bold">{{ count }}</div>
                </div>
                <q-linear-progress
                  :value="Number(count) / maxSeverity"
                  :color="getSeverityColor(String(severity))"
                  track-color="grey-3"
                  size="6px"
                  rounded
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Estado -->
      <div class="col-12 col-md-4">
        <q-card bordered>
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-md">
              Estado
            </div>

            <div class="q-gutter-y-sm">
              <div
                v-for="(count, status) in summary?.byStatus || {}"
                :key="status"
              >
                <div class="row justify-between items-center q-mb-xs">
                  <div class="text-caption text-grey-7">
                    {{ getStatusLabel(String(status)) }}
                  </div>
                  <div class="text-caption text-weight-bold">{{ count }}</div>
                </div>
                <q-linear-progress
                  :value="Number(count) / maxStatus"
                  :color="getStatusColor(String(status))"
                  track-color="grey-3"
                  size="6px"
                  rounded
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Tipo -->
      <div class="col-12 col-md-4">
        <q-card bordered>
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-md">
              Tipo
            </div>

            <div class="q-gutter-y-sm">
              <div
                v-for="(count, type) in summary?.byType || {}"
                :key="type"
              >
                <div class="row justify-between items-center q-mb-xs">
                  <div class="text-caption text-grey-7">
                    {{ getTypeLabel(String(type)) }}
                  </div>
                  <div class="text-caption text-weight-bold">{{ count }}</div>
                </div>
                <q-linear-progress
                  :value="Number(count) / maxType"
                  :color="getTypeColor(String(type))"
                  track-color="grey-3"
                  size="6px"
                  rounded
                />
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

const maxSeverity = computed(() => {
  if (!props.summary?.bySeverity) return 1
  return Math.max(...(Object.values(props.summary.bySeverity) as number[]), 1)
})

const maxStatus = computed(() => {
  if (!props.summary?.byStatus) return 1
  return Math.max(...(Object.values(props.summary.byStatus) as number[]), 1)
})

const maxType = computed(() => {
  if (!props.summary?.byType) return 1
  return Math.max(...(Object.values(props.summary.byType) as number[]), 1)
})

// ============================================================
// LABELS
// ============================================================
function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
    info: 'Informativo',
  }
  return labels[severity] || severity
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    not_resolved: 'No Resuelto',
    kept: 'Conservado',
    reviewed: 'Revisado',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  }
  return labels[status] || status
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    usability: 'Usabilidad',
    emotional: 'Emocional',
    sentiment: 'Sentimiento',
    expert: 'Experto',
    mixed: 'Mixto',
    problem: 'Problema',
    difficulty: 'Dificultad',
    accessibility: 'Accesibilidad',
    friction: 'Fricción',
    positive: 'Positivo',
    opportunity: 'Oportunidad',
  }
  return labels[type] || type
}

// ============================================================
// COLORES
// ============================================================
function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'negative',
    high: 'deep-orange',
    medium: 'warning',
    low: 'info',
    info: 'grey',
  }
  return colors[severity] || 'grey'
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'grey',
    in_progress: 'info',
    resolved: 'positive',
    not_resolved: 'negative',
    kept: 'blue',
    reviewed: 'blue',
    approved: 'positive',
    rejected: 'negative',
  }
  return colors[status] || 'grey'
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    usability: 'orange',
    emotional: 'purple',
    sentiment: 'info',
    expert: 'teal',
    mixed: 'warning',
    problem: 'negative',
    difficulty: 'warning',
    accessibility: 'deep-orange',
    friction: 'deep-orange',
    positive: 'positive',
    opportunity: 'info',
  }
  return colors[type] || 'grey'
}
</script>