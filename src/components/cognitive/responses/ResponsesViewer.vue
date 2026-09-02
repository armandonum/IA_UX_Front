<!-- components/responses/ResponsesViewer.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-md font-semibold text-slate-100">Respuestas de Evaluadores</h3>
      <q-btn
        color="primary"
        icon="refresh"
        label="Actualizar"
        size="sm"
        flat
        @click="$emit('refresh')"
        :loading="loading"
      />
    </div>

    <!-- Resumen de estadísticas -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 q-mb-4">
      <q-card class="bg-slate-700 border-slate-600">
        <q-card-section class="py-2 text-center">
          <div class="text-2xl font-bold text-primary">{{ stats.total || 0 }}</div>
          <div class="text-xs text-slate-500">Total Respuestas</div>
        </q-card-section>
      </q-card>
      <q-card class="bg-slate-700 border-slate-600">
        <q-card-section class="py-2 text-center">
          <div class="text-2xl font-bold text-positive">{{ stats.completed || 0 }}</div>
          <div class="text-xs text-slate-500">Completadas</div>
        </q-card-section>
      </q-card>
      <q-card class="bg-slate-700 border-slate-600">
        <q-card-section class="py-2 text-center">
          <div class="text-2xl font-bold text-negative">{{ stats.withIssues || 0 }}</div>
          <div class="text-xs text-slate-500">Con Problemas</div>
        </q-card-section>
      </q-card>
      <q-card class="bg-slate-700 border-slate-600">
        <q-card-section class="py-2 text-center">
          <div class="text-2xl font-bold text-warning">{{ stats.successRate || 0 }}%</div>
          <div class="text-xs text-slate-500">Tasa de Éxito</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Tabla de respuestas -->
    <q-table
      :rows="responses"
      :columns="columns"
      row-key="id"
      class="bg-slate-800 rounded-lg"
      dark
      :loading="loading"
      :pagination="{ rowsPerPage: 10 }"
    >
      <template v-slot:body-cell-status="props">
        <q-td>
          <q-badge :color="getStatusColor(props.row.status)">
            {{ getStatusLabel(props.row.status) }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-questions="props">
        <q-td>
          <div class="flex gap-1">
            <q-icon
              :name="getQuestionIcon(props.row.q1WillUserTryCorrectOutcome)"
              :color="getQuestionColor(props.row.q1WillUserTryCorrectOutcome)"
              size="16px"
              title="¿Intentará lograr el resultado correcto?"
            />
            <q-icon
              :name="getQuestionIcon(props.row.q2WillUserNoticeAction)"
              :color="getQuestionColor(props.row.q2WillUserNoticeAction)"
              size="16px"
              title="¿Notará la acción disponible?"
            />
            <q-icon
              :name="getQuestionIcon(props.row.q3WillUserAssociateAction)"
              :color="getQuestionColor(props.row.q3WillUserAssociateAction)"
              size="16px"
              title="¿Asociará acción con resultado?"
            />
            <q-icon
              :name="getQuestionIcon(props.row.q4WillUserSeeProgress)"
              :color="getQuestionColor(props.row.q4WillUserSeeProgress)"
              size="16px"
              title="¿Verá progreso?"
            />
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td>
          <q-btn
            icon="visibility"
            flat
            dense
            size="sm"
            @click="viewResponse(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Dialog: Ver respuesta detallada -->
    <q-dialog v-model="showDetail">
      <q-card style="min-width: 500px; max-width: 700px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Detalle de Respuesta</div>
          <div class="text-subtitle2">{{ selectedResponse?.taskTitle || 'Tarea' }}</div>
        </q-card-section>

        <q-card-section v-if="selectedResponse">
          <div class="space-y-3">
            <div>
              <div class="text-sm font-semibold text-slate-300">Descripción</div>
              <div class="text-slate-100">{{ selectedResponse.responseDescription || 'Sin descripción' }}</div>
            </div>

            <div>
              <div class="text-sm font-semibold text-slate-300">Respuesta del Sistema</div>
              <div class="text-slate-100">{{ selectedResponse.systemResponse || 'Sin respuesta' }}</div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div v-for="(q, key) in questions" :key="key">
                <div class="text-sm font-semibold text-slate-300">{{ q.label }}</div>
                <div class="flex items-center gap-2">
                  <q-icon
                    :name="getQuestionIcon(selectedResponse[key])"
                    :color="getQuestionColor(selectedResponse[key])"
                    size="20px"
                  />
                  <span class="text-slate-100">
                    {{ getQuestionLabel(selectedResponse[key]) }}
                  </span>
                </div>
                <div v-if="selectedResponse[`${key}Reasoning`]" class="text-xs text-slate-500 mt-1">
                  {{ selectedResponse[`${key}Reasoning`] }}
                </div>
              </div>
            </div>

            <div v-if="selectedResponse.problemIdentified">
              <div class="text-sm font-semibold text-slate-300 text-negative">Problema Identificado</div>
              <div class="text-slate-100">{{ selectedResponse.problemIdentified }}</div>
            </div>

            <div v-if="selectedResponse.designSuggestion">
              <div class="text-sm font-semibold text-slate-300 text-positive">Sugerencia de Diseño</div>
              <div class="text-slate-100">{{ selectedResponse.designSuggestion }}</div>
            </div>

            <div v-if="selectedResponse.otherComments">
              <div class="text-sm font-semibold text-slate-300">Otros Comentarios</div>
              <div class="text-slate-100">{{ selectedResponse.otherComments }}</div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-slate-500">Tiempo:</span>
                <span class="text-slate-100">{{ selectedResponse.timeSpentSeconds || 0 }}s</span>
              </div>
              <div>
                <span class="text-slate-500">Éxito:</span>
                <q-badge :color="selectedResponse.success ? 'positive' : 'negative'">
                  {{ selectedResponse.success ? 'Sí' : 'No' }}
                </q-badge>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  responses: any[]
  summary?: any
  stats?: any
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const showDetail = ref(false)
const selectedResponse = ref<any>(null)

const columns = [
  { name: 'taskTitle', label: 'Tarea', field: 'taskTitle', align: 'left', sortable: true },
  { name: 'evaluatorId', label: 'Evaluador', field: 'evaluatorId', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
  { name: 'questions', label: 'Preguntas', field: 'questions', align: 'center' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' }
]

const questions = {
  q1WillUserTryCorrectOutcome: { label: '¿Intentará lograr el resultado correcto?', key: 'q1WillUserTryCorrectOutcome' },
  q2WillUserNoticeAction: { label: '¿Notará la acción disponible?', key: 'q2WillUserNoticeAction' },
  q3WillUserAssociateAction: { label: '¿Asociará acción con resultado?', key: 'q3WillUserAssociateAction' },
  q4WillUserSeeProgress: { label: '¿Verá progreso?', key: 'q4WillUserSeeProgress' }
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

const getQuestionIcon = (answer: string) => {
  const icons: Record<string, string> = {
    yes: 'check_circle',
    no: 'cancel',
    uncertain: 'help'
  }
  return icons[answer] || 'circle'
}

const getQuestionColor = (answer: string) => {
  const colors: Record<string, string> = {
    yes: 'positive',
    no: 'negative',
    uncertain: 'warning'
  }
  return colors[answer] || 'grey'
}

const getQuestionLabel = (answer: string) => {
  const labels: Record<string, string> = {
    yes: 'Sí',
    no: 'No',
    uncertain: 'Incierto'
  }
  return labels[answer] || answer
}

const viewResponse = (response: any) => {
  selectedResponse.value = response
  showDetail.value = true
}
</script>