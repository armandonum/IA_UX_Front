<!-- components/findings/FindingsGenerator.vue -->
<template>
  <div class="findings-generator">
    <q-card flat bordered class="q-pa-md">
      <div class="row items-center q-col-gutter-md">
        <div class="col">
          <div class="text-subtitle1 text-weight-medium">
            🤖 Generador Automático de Hallazgos
          </div>
          <div class="text-caption text-grey-6">
            Analiza la línea de tiempo y genera hallazgos automáticamente desde emociones, sentimientos y comentarios
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
              label="Analizar y Generar"
              @click="startGeneration"
              :loading="isGenerating"
            />

            <q-btn
              v-if="!isGenerating && generatedCount > 0"
              color="primary"
              icon="auto_awesome"
              label="Re-analizar"
              flat
              @click="startGeneration"
              :loading="isGenerating"
            />

            <q-btn
              v-if="generatedCount > 0"
              color="positive"
              icon="visibility"
              label="Revisar Hallazgos"
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
            />
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
          {{ type }}: {{ count }}
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
    <FindingsReviewModal
      v-model="showReviewModal"
      :findings="generatedFindings"
      :evaluation-id="evaluationId"
      @save="handleSaveFindings"
      @dismiss="handleDismissFindings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import FindingsReviewModal from './FindingsReviewModal.vue'
import type { GeneratedFinding } from '@/types/expert/findings.types'


const props = defineProps<{
  evaluationId: string
  sessionId?: string
  taskId?: string
  timelineData: {
    events: any[]
    emotionReadings: any[]
    sentiments: any[]
    comments: any[]
    expertComments: any[]
    durationMs: number
    getNodeIdFromEvent: (ev: any) => string
    getEmotionLabel: (em: any) => string
    getNearestEvent: (ms: number) => any
    getNearestEmotion: (ms: number) => any
    getNearestComment: (ms: number) => any
    getNearestSentiment: (ms: number) => any
  }
}>()

const emit = defineEmits<{
  (e: 'findings-generated', findings: GeneratedFinding[]): void
  (e: 'findings-saved'): void
}>()

const $q = useQuasar()
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

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    usability: 'orange',
    emotional: 'purple',
    sentiment: 'info',
    expert: 'positive',
    mixed: 'warning',
  }
  return colors[type] || 'grey'
}

async function startGeneration() {
  if (!props.timelineData) {
    $q.notify({
      type: 'warning',
      message: 'No hay datos de línea de tiempo para analizar'
    })
    return
  }

  isGenerating.value = true
  generationProgress.value = 0

  try {
    // Simular progreso
    const interval = setInterval(() => {
      generationProgress.value = Math.min(95, generationProgress.value + 5)
    }, 200)

    // Importar dinámicamente el composable
    const { useFindingsGenerator } = await import('@/composables/expert/useFindingsGenerator')
    const { generateFindings } = useFindingsGenerator()

    // Generar hallazgos
    const findings = await generateFindings(props.timelineData, {
      minConfidence: 0.5,
      includeEmotions: true,
      includeSentiments: true,
      includeUserComments: true,
      includeExpertComments: true,
    })

    clearInterval(interval)
    generationProgress.value = 100

    generatedFindings.value = findings

    emit('findings-generated', findings)

    $q.notify({
      type: 'positive',
      message: `✅ ${findings.length} hallazgos generados automáticamente`
    })

    // Abrir modal de revisión automáticamente
    if (findings.length > 0) {
      setTimeout(() => {
        showReviewModal.value = true
      }, 500)
    }

  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al generar hallazgos'
    })
  } finally {
    isGenerating.value = false
  }
}

function openReviewModal() {
  showReviewModal.value = true
}

function clearFindings() {
  $q.dialog({
    title: 'Limpiar Hallazgos',
    message: '¿Estás seguro de eliminar todos los hallazgos generados?',
    ok: { label: 'Limpiar', color: 'negative' },
    cancel: 'Cancelar'
  }).onOk(() => {
    generatedFindings.value = []
    showReviewModal.value = false
    $q.notify({
      type: 'info',
      message: 'Hallazgos eliminados'
    })
  })
}

function handleSaveFindings(savedFindings: any[]) {
  emit('findings-saved')
  $q.notify({
    type: 'positive',
    message: `✅ ${savedFindings.length} hallazgos guardados`
  })
  showReviewModal.value = false
  generatedFindings.value = []
}

function handleDismissFindings() {
  showReviewModal.value = false
}
</script>