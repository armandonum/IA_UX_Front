<template>
  <div class="q-pa-lg">
    <div class="text-h5 text-weight-bold q-mb-md">
      Mis Evaluaciones Heurísticas Asignadas
    </div>
<ClientIdInput
  :model-value="figmaSession.clientId"
  @update:model-value="figmaSession.setClientId"
/>
    <q-banner v-if="error" dense rounded class="bg-negative text-white q-mb-md">
      {{ error }}
    </q-banner>

    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <div v-else-if="myEvaluations.length === 0" class="text-center q-mt-xl">
      <q-icon name="assignment" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">No tienes evaluaciones asignadas</div>
      <div class="text-caption text-grey-5">
        Contacta al coordinador para que te asigne una evaluación
      </div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="evaluation in myEvaluations"
        :key="evaluation.evaluationId"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="cursor-pointer" @click="seleccionarEvaluacion(evaluation)">
          <q-card-section>
            <div class="text-h6">{{ evaluation.name }}</div>
            <div class="text-caption text-grey-6">
              {{ evaluation.description || 'Sin descripción' }}
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-badge :color="getStatusColor(evaluation.status)">
                {{ getStatusLabel(evaluation.status) }}
              </q-badge>
              <q-badge color="info">
                {{ evaluation.maxDurationMinutes }} min
              </q-badge>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              color="primary"
              label="Evaluar"
              icon="play_arrow"
              @click.stop="seleccionarEvaluacion(evaluation)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHeuristicExpert } from '@/composables/expert/useHeuristicExpert'
import { useFigmaSessionStore } from '@/stores/figmaSession.store'
import type { HeuristicEvaluation } from '@/api/heuristic.api'
import  ClientIdInput  from '@/components/estudiante/figma/ClientIdInput.vue'

const router = useRouter()
const figmaSession = useFigmaSessionStore()
const { loading, error, myEvaluations, loadMyEvaluations } = useHeuristicExpert()
// stores/figmaSession.store.ts
const CLIENT_ID_STORAGE_KEY = 'figma_client_id'
const clientId = ref<string>(localStorage.getItem(CLIENT_ID_STORAGE_KEY) ?? '')
onMounted(loadMyEvaluations)

function seleccionarEvaluacion(evaluation: HeuristicEvaluation) {
  // Guardar evaluación seleccionada
  figmaSession.selectProject({
    projectId: evaluation.projectId,
    fileKey: '', // Se cargará después
    projectName: evaluation.name,
  })

  // Redirigir a la vista de evaluación
  router.push({
    name: 'experto-heuristic-evaluation',
    params: { evaluationId: evaluation.evaluationId },
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'grey',
    planning: 'info',
    in_progress: 'warning',
    completed: 'positive',
    archived: 'grey-7',
  }
  return colors[status] || 'grey'
}

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
</script>