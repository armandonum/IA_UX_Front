<!-- components/findings/FindingsReviewModal.vue -->
<template>
  <q-dialog v-model="localOpen" full-width persistent>
    <q-card style="max-width: 1200px; width: 100%; max-height: 90vh;">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h6">📋 Revisión de Hallazgos Generados</div>
            <div class="text-subtitle2">
              {{ findings.length }} hallazgos encontrados. Revisa y edita antes de guardar.
            </div>
          </div>
          <div class="row q-gutter-sm">
            <q-btn
              color="white"
              icon="check_all"
              label="Aceptar Todos"
              flat
              @click="acceptAll"
            />
            <q-btn
              color="white"
              icon="close"
              label="Cerrar"
              flat
              v-close-popup
            />
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-pa-md" style="max-height: 60vh; overflow-y: auto;">
        <div class="row q-col-gutter-md">
          <div
            v-for="(finding, index) in findings"
            :key="finding._tempId || index"
            class="col-12 col-md-6"
          >
            <q-card
              flat
              bordered
              class="finding-card"
              :class="{ 'selected': selectedFindings.has(finding._tempId) }"
              @click="toggleSelect(finding._tempId)"
            >
              <q-card-section class="q-pa-sm">
                <div class="row items-center q-gutter-xs">
                  <q-checkbox
                    :model-value="selectedFindings.has(finding._tempId)"
                    @update:model-value="toggleSelect(finding._tempId)"
                    color="primary"
                    size="sm"
                  />
                  <q-badge :color="getTypeColor(finding.type)">
                    {{ finding.type }}
                  </q-badge>
                  <q-badge :color="getSeverityColor(finding.severity)">
                    {{ finding.severity }}
                  </q-badge>
                  <q-chip size="sm" dense>
                    🔄 {{ finding.frequency }}x
                  </q-chip>
                  <q-space />
                  <q-btn
                    flat
                    dense
                    round
                    icon="edit"
                    size="sm"
                    @click.stop="editFinding(index)"
                  />
                </div>

                <div class="q-mt-sm">
                  <div class="text-caption text-grey-7">Descripción</div>
                  <div class="text-body2">{{ finding.description }}</div>
                </div>

                <div class="row q-gutter-md q-mt-sm">
                  <div v-if="finding.nodeId" class="col-auto">
                    <div class="text-caption text-grey-7">Pantalla</div>
                    <div class="text-caption font-mono">{{ finding.nodeId }}</div>
                  </div>
                  <div v-if="finding.emotionInferred" class="col-auto">
                    <div class="text-caption text-grey-7">Emoción</div>
                    <div class="text-caption">{{ finding.emotionInferred }}</div>
                  </div>
                  <div v-if="finding.textualSentiment" class="col-auto">
                    <div class="text-caption text-grey-7">Sentimiento</div>
                    <div class="text-caption">{{ finding.textualSentiment }}</div>
                  </div>
                </div>

                <div v-if="finding.userComment || finding.expertComment" class="q-mt-sm">
                  <div class="text-caption text-grey-7">Comentario relacionado</div>
                  <div class="text-caption bg-grey-1 q-pa-xs rounded-borders">
                    "{{ finding.userComment || finding.expertComment }}"
                  </div>
                </div>

                <div class="row q-gutter-sm q-mt-sm">
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="primary"
                    icon="visibility"
                    label="Ver contexto"
                    @click.stop="showContext(finding)"
                  />
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="negative"
                    icon="delete"
                    label="Eliminar"
                    @click.stop="removeFinding(index)"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div v-if="findings.length === 0" class="text-center q-py-xl">
          <q-icon name="check_circle" size="48px" color="positive" />
          <div class="text-h6 q-mt-sm">No hay hallazgos pendientes</div>
          <div class="text-grey-6">Todos los hallazgos han sido revisados</div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <div class="row items-center q-gutter-sm">
          <span class="text-caption text-grey-6">
            {{ selectedCount }} de {{ findings.length }} seleccionados
          </span>
          <q-btn
            flat
            label="Cancelar"
            v-close-popup
          />
          <q-btn
            color="primary"
            icon="save"
            label="Guardar Seleccionados"
            :loading="saving"
            :disable="selectedCount === 0"
            @click="saveSelected"
          />
        </div>
      </q-card-actions>
    </q-card>

    <!-- Modal de edición -->
    <FindingEditModal
      v-model="showEditModal"
      :finding="editingFinding"
      @save="updateFinding"
    />

    <!-- Modal de contexto -->
    <FindingContextModal
      v-model="showContextModal"
      :finding="contextFinding"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import FindingEditModal from './FindingEditModal.vue'
import FindingContextModal from './FindingContextModal.vue'
import type { GeneratedFinding } from '@/types/expert/findings.types.ts'
import api from '@/api/axios.ts'


const TYPE_MAPPING: Record<string, string> = {
  usability: 'problem',
  emotional: 'difficulty',
  sentiment: 'friction',
  expert: 'problem',
  mixed: 'problem',
  problem: 'problem',
  difficulty: 'difficulty',
  accessibility: 'accessibility',
  friction: 'friction',
  positive: 'positive',
  opportunity: 'opportunity',
}



const props = defineProps<{
  modelValue: boolean
  findings: GeneratedFinding[]
  evaluationId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', findings: any[]): void
  (e: 'dismiss'): void
}>()

const $q = useQuasar()
const localOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const selectedFindings = ref<Set<string>>(new Set())
const saving = ref(false)
const showEditModal = ref(false)
const showContextModal = ref(false)
const editingFinding = ref<GeneratedFinding | null>(null)
const editingIndex = ref(-1)
const contextFinding = ref<GeneratedFinding | null>(null)

const selectedCount = computed(() => selectedFindings.value.size)

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

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: 'negative',
    high: 'orange',
    medium: 'warning',
    low: 'info',
    info: 'grey',
  }
  return colors[severity] || 'grey'
}

// Inicializar selección cuando se abra el modal
watch(() => props.modelValue, (open) => {
  if (open) {
    // Seleccionar todos por defecto
    props.findings.forEach(f => {
      selectedFindings.value.add(f._tempId)
    })
  }
})

function toggleSelect(id: string) {
  if (selectedFindings.value.has(id)) {
    selectedFindings.value.delete(id)
  } else {
    selectedFindings.value.add(id)
  }
}

function acceptAll() {
  props.findings.forEach(f => {
    selectedFindings.value.add(f._tempId)
  })
}

function editFinding(index: number) {
  editingFinding.value = { ...props.findings[index] }
  editingIndex.value = index
  showEditModal.value = true
}

function updateFinding(updated: GeneratedFinding) {
  if (editingIndex.value !== -1) {
    props.findings[editingIndex.value] = updated
  }
  showEditModal.value = false
}

function removeFinding(index: number) {
  const finding = props.findings[index]
  const id = finding._tempId
  if (selectedFindings.value.has(id)) {
    selectedFindings.value.delete(id)
  }
  props.findings.splice(index, 1)
  $q.notify({
    type: 'info',
    message: 'Hallazgo eliminado de la lista'
  })
}

function showContext(finding: GeneratedFinding) {
  contextFinding.value = finding
  showContextModal.value = true
}

function mapTypeToBackend(type: string): string {
  return TYPE_MAPPING[type] || 'problem'
}

async function saveSelected() {
  const selected = props.findings.filter(f =>
    selectedFindings.value.has(f._tempId)
  )

  if (selected.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona al menos un hallazgo para guardar'
    })
    return
  }

  saving.value = true
  try {
    const toSave = selected.map(f => {
      const payload: any = {
        evaluationId: props.evaluationId,
        // ✅ MAPEAR EL TIPO CORRECTAMENTE
        type: mapTypeToBackend(f.type || 'problem'),
        description: f.description || '',
        severity: f.severity || 'medium',
        impact: f.impact || 'medium',
        priority: f.priority || 'medium',
        status: f.status || 'pending',
        frequency: f.frequency || 1,
        occurrences: f.occurrences || 1,
      }

      // ✅ SIEMPRE agregar estos campos (incluso si son null/undefined)
      payload.sessionId = f.sessionId || null
      payload.taskId = f.taskId || null
      payload.requirementId = f.requirementId || null
      payload.flowId = f.flowId || null
      payload.nodeId = f.nodeId || null
      payload.version = f.version || '1.0'
      
      // ✅ Solo agregar si tienen valor
      if (f.recommendation) payload.recommendation = f.recommendation
      if (f.emotionInferred) payload.emotionInferred = f.emotionInferred
      if (f.textualSentiment) payload.textualSentiment = f.textualSentiment
      if (f.userComment) payload.userComment = f.userComment
      if (f.expertComment) payload.expertComment = f.expertComment
      if (f.userCommentId) payload.userCommentId = f.userCommentId
      if (f.expertCommentId) payload.expertCommentId = f.expertCommentId
      if (f.aggregatedFrom && f.aggregatedFrom.length > 0) {
        payload.aggregatedFrom = f.aggregatedFrom
      }

      return payload
    })

    console.log('📡 Enviando hallazgos a guardar:', JSON.stringify(toSave, null, 2))

    // ✅ Guardar cada hallazgo individualmente
    const results = []
    for (const payload of toSave) {
      try {
        const response = await api.post('/findings', payload)
        results.push(response.data)
        console.log('✅ Hallazgo guardado:', response.data)
      } catch (error: any) {
        console.error('❌ Error guardando hallazgo:', error.response?.data)
        // Continuar con el siguiente
      }
    }

    if (results.length > 0) {
      emit('save', results)
      $q.notify({
        type: 'positive',
        message: `✅ ${results.length} de ${toSave.length} hallazgos guardados`
      })
    } else {
      $q.notify({
        type: 'warning',
        message: 'No se pudo guardar ningún hallazgo'
      })
    }

  } catch (error: any) {
    console.error('❌ Error al guardar hallazgos:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al guardar hallazgos'
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.finding-card {
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.finding-card:hover {
  border-color: var(--q-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.finding-card.selected {
  border-color: var(--q-primary);
  background: rgba(30, 58, 138, 0.05);
}
</style>