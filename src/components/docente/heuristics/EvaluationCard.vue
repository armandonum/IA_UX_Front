<!-- components/docente/heuristics/EvaluationCard.vue -->
<template>
  <q-card class="evaluation-card">
    <!-- Header -->
    <q-card-section class="q-pb-sm">
      <div class="row items-start justify-between no-wrap">
        <div class="col">
          <div class="row items-center q-gutter-xs q-mb-xs">
            <q-icon name="menu_book" size="18px" color="primary" />
            <div class="text-subtitle1 text-weight-bold ellipsis">
              {{ frameworkName }}
            </div>
          </div>
          <div class="text-body2 text-weight-medium ellipsis">
            {{ evaluation.name }}
          </div>
        </div>

        <q-btn flat round dense icon="more_vert" size="sm">
          <q-menu auto-close>
            <q-list style="min-width: 200px">
              <q-item clickable @click="$emit('view', evaluation)">
                <q-item-section avatar>
                  <q-icon name="visibility" color="primary" />
                </q-item-section>
                <q-item-section>Ver detalle</q-item-section>
              </q-item>

              <q-item clickable @click="$emit('edit', evaluation)">
                <q-item-section avatar>
                  <q-icon name="edit" color="primary" />
                </q-item-section>
                <q-item-section>Editar</q-item-section>
              </q-item>

              <q-separator />

              <!-- Cambio de estado -->
              <q-item
                v-for="opt in nextStatuses"
                :key="opt.value"
                clickable
                @click="$emit('change-status', evaluation, opt.value)"
              >
                <q-item-section avatar>
                  <q-icon :name="getStatusIcon(opt.value)" :color="getStatusColor(opt.value)" />
                </q-item-section>
                <q-item-section>
                  Marcar como {{ opt.label }}
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable @click="$emit('delete', evaluation)">
                <q-item-section avatar>
                  <q-icon name="delete" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative">Eliminar</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-card-section>

    <!-- Badges -->
    <q-card-section class="q-py-sm">
      <div class="row items-center q-gutter-xs">
        <q-badge
          :color="getStatusColor(evaluation.status)"
          text-color="white"
        >
          <q-icon :name="getStatusIcon(evaluation.status)" size="12px" class="q-mr-xs" />
          {{ getStatusLabel(evaluation.status) }}
        </q-badge>

        <q-badge color="info" outline>
          <q-icon name="timer" size="12px" class="q-mr-xs" />
          {{ evaluation.maxDurationMinutes }} min
        </q-badge>

        <q-badge v-if="projectName" color="blue-grey" outline>
          <q-icon name="folder" size="12px" class="q-mr-xs" />
          {{ projectName }}
        </q-badge>
      </div>
    </q-card-section>

    <!-- Descripción -->
    <q-card-section
      v-if="evaluation.description"
      class="q-pt-none q-pb-sm"
    >
      <div class="text-caption text-grey-7 ellipsis-2">
        {{ evaluation.description }}
      </div>
    </q-card-section>

    <!-- Metadata -->
    <q-card-section class="q-pt-none q-pb-sm">
      <div class="row items-center q-gutter-md text-caption text-grey-6">
        <div class="row items-center">
          <q-icon name="calendar_today" size="12px" class="q-mr-xs" />
          {{ formatDate(evaluation.createdAt) }}
        </div>
      </div>
    </q-card-section>

    <q-space />

    <!-- Actions -->
    <q-card-actions class="q-pa-sm">
      <q-btn
        unelevated
        color="primary"
        icon="visibility"
        label="Ver detalle"
        size="sm"
        class="col"
        @click="$emit('view', evaluation)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HeuristicEvaluation } from '@/api/heuristic.api'
import { useDocenteStore } from '@/stores/docente.stores'

const props = defineProps<{
  evaluation: HeuristicEvaluation
  frameworkName?: string
}>()

defineEmits<{
  (e: 'view', evaluation: HeuristicEvaluation): void
  (e: 'edit', evaluation: HeuristicEvaluation): void
  (e: 'delete', evaluation: HeuristicEvaluation): void
  (e: 'change-status', evaluation: HeuristicEvaluation, status: string): void
}>()

const docenteStore = useDocenteStore()

// ============================================================
// COMPUTED
// ============================================================
const projectName = computed(() => {
  const p = docenteStore.projects.find(
    (pr) => pr.projectId === props.evaluation.projectId,
  )
  return p?.projectName || ''
})

const nextStatuses = computed(() => {
  const all = [
    { label: 'Borrador', value: 'draft' },
    { label: 'Planificación', value: 'planning' },
    { label: 'En progreso', value: 'in_progress' },
    { label: 'Completada', value: 'completed' },
    { label: 'Archivada', value: 'archived' },
  ]
  return all.filter((s) => s.value !== props.evaluation.status)
})

// ============================================================
// HELPERS
// ============================================================
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

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    draft: 'edit_note',
    planning: 'event_note',
    in_progress: 'play_circle',
    completed: 'check_circle',
    archived: 'archive',
  }
  return icons[status] || 'help'
}

function formatDate(date: string): string {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return date
  }
}
</script>

<style scoped>
.evaluation-card {
  transition: all 0.2s ease;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.evaluation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(30, 58, 138, 0.12);
  border-color: #1e3a8a;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>