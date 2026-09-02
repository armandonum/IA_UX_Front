<!-- components/evaluations/EvaluationList.vue -->
<template>
  <div>
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 text-weight-medium">
        Evaluaciones
      </div>

      <q-btn
        v-if="canCreate"
        color="primary"
        icon="add"
        label="Nueva Evaluación"
        unelevated
        @click="$emit('create')"
      />
    </div>

    <!-- Lista -->
    <q-list
      bordered
      separator
      class="rounded-borders"
    >
      <q-item
        v-for="evaluation in evaluations"
        :key="evaluation.cognitiveEvaluationId"
        clickable
        @click="$emit('select', evaluation.cognitiveEvaluationId)"
        :active="selectedId === evaluation.cognitiveEvaluationId"
        active-class="bg-blue-1 text-primary"
      >
        <!-- Información -->
        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ evaluation.name }}
          </q-item-label>

          <q-item-label caption>
            Proyecto:
            {{ evaluation.projectName || 'Sin proyecto' }}
          </q-item-label>
        </q-item-section>

        <!-- Información adicional -->
        <q-item-section side>
          <div class="row items-center q-gutter-sm">

            <!-- Estado -->
            <q-badge
              :color="getStatusColor(evaluation.status)"
              class="q-px-sm"
            >
              {{ getStatusLabel(evaluation.status) }}
            </q-badge>

            <!-- Tareas -->
            <q-badge
              color="info"
              class="q-px-sm"
            >
              <q-icon
                name="task_alt"
                size="14px"
                class="q-mr-xs"
              />
              {{ evaluation.totalTasks || 0 }} tareas
            </q-badge>

            <!-- Evaluadores -->
            <q-badge
              color="secondary"
              class="q-px-sm"
            >
              <q-icon
                name="groups"
                size="14px"
                class="q-mr-xs"
              />
              {{ evaluation.totalEvaluators || 0 }} evaluadores
            </q-badge>

            <!-- Progreso -->
            <q-circular-progress
              v-if="evaluation.progress !== undefined"
              :value="evaluation.progress"
              size="34px"
              :color="getProgressColor(evaluation.progress)"
              track-color="grey-3"
              show-value
              font-size="8px"
            />

          </div>
        </q-item-section>
      </q-item>

      <!-- Sin evaluaciones -->
      <q-item v-if="evaluations.length === 0">
        <q-item-section class="items-center q-py-lg">

          <q-icon
            name="assignment"
            size="48px"
            color="grey-5"
          />

          <q-item-label class="text-grey-6 q-mt-sm">
            No hay evaluaciones
          </q-item-label>

          <q-btn
            v-if="canCreate"
            flat
            color="primary"
            icon="add"
            label="Crear primera evaluación"
            class="q-mt-sm"
            @click="$emit('create')"
          />

        </q-item-section>
      </q-item>

    </q-list>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  evaluations: any[]
  selectedId?: string
  canCreate?: boolean
}>()

defineEmits<{
  (e: 'select', id: string): void
  (e: 'create'): void
}>()

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'grey',
    planning: 'warning',
    in_progress: 'accent',
    completed: 'positive',
    archived: 'grey-7'
  }

  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    planning: 'Planificación',
    in_progress: 'En progreso',
    completed: 'Completada',
    archived: 'Archivada'
  }

  return labels[status] || status
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'positive'
  if (progress >= 50) return 'warning'
  return 'accent'
}
</script>