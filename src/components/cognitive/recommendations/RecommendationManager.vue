<!-- components/recommendations/RecommendationManager.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-md font-semibold text-slate-100">Recomendaciones</h3>
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="add"
        label="Agregar Recomendaciones"
        size="sm"
        @click="showCreateDialog = true"
      />
    </div>

    <div v-if="recommendations.length === 0" class="text-center py-8">
      <q-icon name="lightbulb" size="48px" color="grey-6" />
      <p class="text-grey-6 mt-2">No hay recomendaciones</p>
      <q-btn
        v-if="canEdit"
        flat
        color="primary"
        label="Agregar recomendaciones"
        @click="showCreateDialog = true"
      />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <q-card
        v-for="recommendation in sortedRecommendations"
        :key="recommendation.id"
        class="bg-slate-700 border-slate-600"
        :class="{
          'border-positive/50': recommendation.implemented,
          'border-warning/50': !recommendation.implemented && recommendation.priority === 'high',
          'border-primary/50': !recommendation.implemented && recommendation.priority === 'medium'
        }"
      >
        <q-card-section>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <q-icon
                  :name="recommendation.implemented ? 'check_circle' : 'pending'"
                  :color="recommendation.implemented ? 'positive' : 'warning'"
                  size="20px"
                />
                <div class="font-semibold text-slate-100">
                  {{ recommendation.title }}
                </div>
                <q-badge :color="getPriorityColor(recommendation.priority)" size="sm">
                  {{ getPriorityLabel(recommendation.priority) }}
                </q-badge>
              </div>
              <div class="text-sm text-slate-400 mt-1">
                {{ recommendation.description }}
              </div>
            </div>
            <div class="flex gap-1 ml-4">
              <q-btn
                v-if="canEdit && !recommendation.implemented"
                color="positive"
                icon="check"
                label="Implementar"
                size="sm"
                flat
                @click="handleImplement(recommendation)"
              />
              <q-btn
                v-if="canEdit"
                icon="delete"
                flat
                dense
                size="sm"
                color="negative"
                @click="confirmDelete(recommendation.id)"
              />
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mt-2 text-xs">
            <q-badge
              v-if="recommendation.problemTitle"
              color="grey"
              size="sm"
              outline
            >
              Problema: {{ recommendation.problemTitle }}
            </q-badge>
            <q-badge
              v-if="recommendation.recommendationType"
              color="info"
              size="sm"
              outline
            >
              {{ getTypeLabel(recommendation.recommendationType) }}
            </q-badge>
            <span v-if="recommendation.implementedAt" class="text-slate-500">
              Implementado: {{ formatDate(recommendation.implementedAt) }}
            </span>
          </div>

          <div v-if="recommendation.implementationNotes" class="mt-2 text-sm text-slate-400 bg-slate-800 p-2 rounded">
            <q-icon name="note" size="14px" />
            {{ recommendation.implementationNotes }}
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Dialog: Crear Recomendaciones -->
    <RecommendationForm
      v-model="showCreateDialog"
      :evaluation-id="evaluationId"
      :problems="problems"
      @save="$emit('add', $event)"
    />

    <!-- Dialog: Implementar -->
    <q-dialog v-model="showImplementDialog">
      <q-card style="min-width: 400px;">
        <q-card-section class="bg-positive text-white">
          <div class="text-h6">Implementar Recomendación</div>
          <div class="text-subtitle2">Registra los detalles de la implementación</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="implementationNotes"
            label="Notas de Implementación"
            filled
            dense
            type="textarea"
            rows="4"
            placeholder="Describe cómo se implementó la recomendación..."
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="showImplementDialog = false" />
          <q-btn
            color="positive"
            label="Confirmar Implementación"
            :loading="implementing"
            :disable="!implementationNotes"
            @click="confirmImplement"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import RecommendationForm from './RecommendationForm.vue'

const props = defineProps<{
  recommendations: any[]
  problems: any[]
  evaluationId?: string
  canEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'add', data: any): void
  (e: 'implement', id: string, notes: string): void
  (e: 'delete', id: string): void
}>()

const $q = useQuasar()

const showCreateDialog = ref(false)
const showImplementDialog = ref(false)
const implementing = ref(false)
const selectedRecommendation = ref<any>(null)
const implementationNotes = ref('')

const sortedRecommendations = computed(() => {
  return [...props.recommendations].sort((a, b) => {
    // Implementadas al final
    if (a.implemented && !b.implemented) return 1
    if (!a.implemented && b.implemented) return -1
    // Luego por prioridad
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)
  })
})

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    critical: 'negative',
    high: 'orange',
    medium: 'warning',
    low: 'info'
  }
  return colors[priority] || 'grey'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo'
  }
  return labels[priority] || priority
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    design_change: 'Cambio de Diseño',
    feature_addition: 'Nueva Funcionalidad',
    content_update: 'Actualización de Contenido',
    connectivity_improvement: 'Mejora de Conectividad'
  }
  return labels[type] || type
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleImplement = (recommendation: any) => {
  selectedRecommendation.value = recommendation
  implementationNotes.value = ''
  showImplementDialog.value = true
}

const confirmImplement = async () => {
  if (!implementationNotes.value || !selectedRecommendation.value) return

  implementing.value = true
  try {
    emit('implement', selectedRecommendation.value.id, implementationNotes.value)
    showImplementDialog.value = false
  } finally {
    implementing.value = false
  }
}

const confirmDelete = (id: string) => {
  $q.dialog({
    title: 'Eliminar Recomendación',
    message: '¿Estás seguro de eliminar esta recomendación?',
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: 'Cancelar',
  }).onOk(() => {
    emit('delete', id)
  })
}
</script>