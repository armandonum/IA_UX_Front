<!-- components/coordinador/heuristic/detail/HeuristicFindingsGenerator.vue -->
<template>
  <div class="findings-generator">
    <q-card flat bordered class="q-pa-md">
      <div class="row items-center q-col-gutter-md">
        <div class="col">
          <div class="text-subtitle1 text-weight-medium">
            🤖 Generador Automático de Hallazgos
          </div>
          <div class="text-caption text-grey-6">
            Analiza la línea de tiempo completa y genera hallazgos automáticamente
            desde emociones, sentimientos, observaciones, aspectos positivos y comentarios.
          </div>
        </div>

        <div class="col-auto">
          <div class="row q-gutter-sm">
            <!-- Progreso -->
            <div v-if="isGenerating" class="flex items-center q-mr-sm">
              <q-spinner color="primary" size="24px" class="q-mr-sm" />
              <span class="text-caption">{{ generationProgress }}%</span>
            </div>

            <q-btn
              v-if="!isGenerating && generatedCount === 0"
              color="primary"
              icon="auto_awesome"
              label="Generar Hallazgos"
              unelevated
              @click="startGeneration"
            />

            <q-btn
              v-if="!isGenerating && generatedCount > 0"
              color="primary"
              icon="auto_awesome"
              label="Re-analizar"
              outline
              @click="startGeneration"
            />

            <q-btn
              v-if="generatedCount > 0"
              color="positive"
              icon="visibility"
              label="Revisar Hallazgos"
              unelevated
              @click="openReviewModal"
            >
              <q-badge color="negative" floating>
                {{ generatedCount }}
              </q-badge>
            </q-btn>

            <q-btn
              v-if="generatedCount > 0"
              color="negative"
              icon="delete"
              flat
              dense
              @click="clearFindings"
            >
              <q-tooltip>Limpiar hallazgos generados</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Resumen de hallazgos generados -->
      <div v-if="generatedCount > 0" class="row q-gutter-md q-mt-md">
        <q-chip
          v-for="(count, type) in findingsByType"
          :key="type"
          :color="getTypeColor(type)"
          text-color="white"
          size="sm"
        >
          {{ getTypeLabel(type) }}: {{ count }}
        </q-chip>

        <q-chip color="grey-7" text-color="white" size="sm">
          Total: {{ generatedCount }}
        </q-chip>
      </div>

      <!-- Barra de progreso -->
      <q-linear-progress
        v-if="isGenerating"
        :value="generationProgress / 100"
        color="primary"
        class="q-mt-sm"
        size="8px"
      />
    </q-card>

    <!-- Modal de revisión -->
    <HeuristicFindingsReviewModal
      v-model="showReviewModal"
      :findings="generatedFindings"
      :evaluation-id="evaluationId"
      @save="handleSaveFindings"
      @dismiss="handleDismissFindings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import HeuristicFindingsReviewModal from './HeuristicFindingsReviewModal.vue'
import { useHeuristicFindingsGenerator } from '@/composables/coordinator/heuristic/useHeuristicFindingsGenerator'
import type {
  GeneratedFinding,
  TimelineData,
} from '@/composables/coordinator/heuristic/useHeuristicFindingsGenerator'
import { TYPE_COLORS } from '@/data/heuristicFindingsDictionary'

// ============================================================
// PROPS
// ============================================================
const props = defineProps<{
  evaluationId: string
  sessionId: string
  taskId: string | null
  timelineData: TimelineData
}>()

const emit = defineEmits<{
  (e: 'findings-saved'): void
}>()

// ============================================================
// ESTADO
// ============================================================
const $q = useQuasar()
const { generateFindings } = useHeuristicFindingsGenerator()

const showReviewModal = ref(false)
const generatedFindings = ref<GeneratedFinding[]>([])
const isGenerating = ref(false)
const generationProgress = ref(0)

const generatedCount = computed(() => generatedFindings.value.length)

const findingsByType = computed(() => {
  const types: Record<string, number> = {}
  generatedFindings.value.forEach(f => {
    types[f.type] = (types[f.type] || 0) + 1
  })
  return types
})

// ============================================================
// GENERACIÓN
// ============================================================
async function startGeneration() {
  if (!props.timelineData) {
    $q.notify({
      type: 'warning',
      message: 'No hay datos de línea de tiempo para analizar',
    })
    return
  }

  isGenerating.value = true
  generationProgress.value = 0

  const interval = setInterval(() => {
    generationProgress.value = Math.min(95, generationProgress.value + 8)
  }, 150)

  try {
    const findings = await generateFindings(props.timelineData, {
      minConfidence: 0.4,
      includeEmotions: true,
      includeSentiments: true,
      includeUserComments: true,
      includeExpertComments: true,
      includeObservations: true,
      includePositives: true,
      includeEvents: false,
    })

    clearInterval(interval)
    generationProgress.value = 100

    generatedFindings.value = findings

    $q.notify({
      type: 'positive',
      message: `✅ ${findings.length} hallazgos generados`,
    })

    // Abrir modal automáticamente
    if (findings.length > 0) {
      setTimeout(() => {
        showReviewModal.value = true
      }, 400)
    } else {
      $q.notify({
        type: 'info',
        message: 'No se encontraron disparadores para generar hallazgos',
      })
    }
  } catch (error: any) {
    clearInterval(interval)
    console.error('Error generando hallazgos:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al generar hallazgos',
    })
  } finally {
    isGenerating.value = false
  }
}

// ============================================================
// MODAL
// ============================================================
function openReviewModal() {
  showReviewModal.value = true
}

function clearFindings() {
  $q.dialog({
    title: 'Limpiar Hallazgos',
    message: '¿Eliminar todos los hallazgos generados?',
    ok: { label: 'Limpiar', color: 'negative' },
    cancel: 'Cancelar',
  }).onOk(() => {
    generatedFindings.value = []
    showReviewModal.value = false
    $q.notify({ type: 'info', message: 'Hallazgos eliminados' })
  })
}

function handleSaveFindings(savedFindings: any[]) {
  emit('findings-saved')
  $q.notify({
    type: 'positive',
    message: `✅ ${savedFindings.length} hallazgos guardados`,
  })
  showReviewModal.value = false
  generatedFindings.value = []
}

function handleDismissFindings() {
  showReviewModal.value = false
}

// ============================================================
// HELPERS
// ============================================================
function getTypeColor(type: string): string {
  return TYPE_COLORS[type as keyof typeof TYPE_COLORS] || 'grey'
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    problem: 'Problema',
    difficulty: 'Dificultad',
    accessibility: 'Accesibilidad',
    friction: 'Fricción',
    positive: 'Positivo',
    opportunity: 'Oportunidad',
  }
  return labels[type] || type
}
</script>