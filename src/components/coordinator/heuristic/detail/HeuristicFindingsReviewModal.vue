<!-- components/coordinador/heuristic/detail/HeuristicFindingsReviewModal.vue -->
<template>
  <q-dialog v-model="localOpen" full-width persistent>
    <q-card style="max-width: 1200px; width: 100%; max-height: 90vh">
      <!-- HEADER -->
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
            <q-btn color="white" icon="close" flat v-close-popup />
          </div>
        </div>
      </q-card-section>

      <!-- FILTROS -->
      <q-card-section class="bg-grey-2 q-py-sm">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-auto">
            <q-chip color="primary" text-color="white" size="sm">
              {{ selectedCount }} / {{ findings.length }} seleccionados
            </q-chip>
          </div>
          <q-space />
          <div class="col-auto">
            <q-select
              v-model="filterType"
              :options="typeOptions"
              label="Tipo"
              dense
              outlined
              clearable
              emit-value
              map-options
              style="min-width: 160px"
            />
          </div>
          <div class="col-auto">
            <q-select
              v-model="filterSeverity"
              :options="severityOptions"
              label="Severidad"
              dense
              outlined
              clearable
              emit-value
              map-options
              style="min-width: 160px"
            />
          </div>
        </div>
      </q-card-section>

      <!-- LISTA -->
      <q-card-section class="q-pa-md" style="max-height: 55vh; overflow-y: auto">
        <div v-if="filteredFindings.length === 0" class="text-center q-py-xl">
          <q-icon name="inbox" size="48px" color="grey-5" />
          <div class="text-h6 q-mt-sm text-grey-6">No hay hallazgos</div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div
            v-for="finding in filteredFindings"
            :key="finding._tempId"
            class="col-12 col-md-6"
          >
            <q-card
              flat
              bordered
              class="finding-card"
              :class="{ 'finding-card--selected': selectedFindings.has(finding._tempId) }"
              @click="toggleSelect(finding._tempId)"
            >
              <q-card-section class="q-pa-sm">
                <!-- Header -->
                <div class="row items-center q-gutter-xs">
                  <q-checkbox
                    :model-value="selectedFindings.has(finding._tempId)"
                    @update:model-value="toggleSelect(finding._tempId)"
                    color="primary"
                    size="sm"
                  />
                  <q-badge :color="getTypeColor(finding.type)">
                    {{ getTypeLabel(finding.type) }}
                  </q-badge>
                  <q-badge :color="getSeverityColor(finding.severity)">
                    {{ getSeverityLabel(finding.severity) }}
                  </q-badge>
                  <q-chip size="sm" dense>
                    🔄 {{ finding.occurrences }}x
                  </q-chip>
                  <q-space />
                  <q-btn
                    flat
                    dense
                    round
                    icon="edit"
                    size="sm"
                    @click.stop="editFinding(finding)"
                  />
                  <q-btn
                    flat
                    dense
                    round
                    icon="delete"
                    size="sm"
                    color="negative"
                    @click.stop="removeFinding(finding._tempId)"
                  />
                </div>

                <!-- Descripción -->
                <div class="q-mt-sm">
                  <div class="text-caption text-grey-7">Descripción</div>
                  <div class="text-body2">{{ finding.description }}</div>
                </div>

                <!-- Contexto -->
                <div class="row q-gutter-md q-mt-sm">
                  <div v-if="finding.nodeId" class="col-auto">
                    <div class="text-caption text-grey-7">Nodo</div>
                    <div class="text-caption font-mono">{{ finding.nodeId }}</div>
                  </div>
                  <div v-if="finding.emotionInferred" class="col-auto">
                    <div class="text-caption text-grey-7">Emoción</div>
                    <div class="text-caption">
                      {{ getEmotionLabel(finding.emotionInferred) }}
                    </div>
                  </div>
                  <div v-if="finding.textualSentiment" class="col-auto">
                    <div class="text-caption text-grey-7">Sentimiento</div>
                    <div class="text-caption">{{ finding.textualSentiment }}</div>
                  </div>
                  <div class="col-auto">
                    <div class="text-caption text-grey-7">Momento</div>
                    <div class="text-caption font-mono">
                      {{ formatTimeMs(finding._ms) }}
                    </div>
                  </div>
                </div>

                <!-- Recomendación -->
                <q-banner
                  v-if="finding.recommendation"
                  dense
                  rounded
                  class="bg-blue-1 text-primary q-mt-sm"
                >
                  <template v-slot:avatar>
                    <q-icon name="lightbulb" size="16px" />
                  </template>
                  <div class="text-caption">
                    {{ finding.recommendation }}
                  </div>
                </q-banner>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <!-- FOOTER -->
      <q-card-actions align="right" class="q-pa-md bg-grey-2">
        <div class="row items-center q-gutter-sm">
          <span class="text-caption text-grey-6">
            {{ selectedCount }} de {{ findings.length }} seleccionados
          </span>
          <q-btn flat label="Cancelar" v-close-popup />
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
    <HeuristicFindingEditModal
      v-model="showEditModal"
      :finding="editingFinding"
      @save="updateFinding"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import api from '@/api/axios'
import HeuristicFindingEditModal from './HeuristicFindingEditModal.vue'
import {
  TYPE_COLORS,
  SEVERITY_COLORS,
  getEmotionLabel as getEmotionLabelDict,
} from '@/data/heuristicFindingsDictionary'
import type { GeneratedFinding } from '@/composables/coordinator/heuristic/useHeuristicFindingsGenerator'

// ============================================================
// PROPS / EMITS
// ============================================================
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
  set: val => emit('update:modelValue', val),
})

// ============================================================
// ESTADO
// ============================================================
const selectedFindings = ref<Set<string>>(new Set())
const saving = ref(false)
const showEditModal = ref(false)
const editingFinding = ref<GeneratedFinding | null>(null)

// Filtros
const filterType = ref<string | null>(null)
const filterSeverity = ref<string | null>(null)

// ============================================================
// COMPUTED
// ============================================================
const selectedCount = computed(() => selectedFindings.value.size)

const filteredFindings = computed(() => {
  let result = props.findings
  if (filterType.value) {
    result = result.filter(f => f.type === filterType.value)
  }
  if (filterSeverity.value) {
    result = result.filter(f => f.severity === filterSeverity.value)
  }
  return result
})

const typeOptions = [
  { label: 'Problema', value: 'problem' },
  { label: 'Dificultad', value: 'difficulty' },
  { label: 'Accesibilidad', value: 'accessibility' },
  { label: 'Fricción', value: 'friction' },
  { label: 'Positivo', value: 'positive' },
  { label: 'Oportunidad', value: 'opportunity' },
]

const severityOptions = [
  { label: 'Crítico', value: 'critical' },
  { label: 'Alto', value: 'high' },
  { label: 'Medio', value: 'medium' },
  { label: 'Bajo', value: 'low' },
]

// ============================================================
// WATCHERS
// ============================================================
watch(
  () => props.modelValue,
  open => {
    if (open) {
      // Seleccionar todos por defecto
      selectedFindings.value = new Set(props.findings.map(f => f._tempId))
    }
  },
)

// ============================================================
// MÉTODOS
// ============================================================
function toggleSelect(id: string) {
  if (selectedFindings.value.has(id)) {
    selectedFindings.value.delete(id)
  } else {
    selectedFindings.value.add(id)
  }
  // Forzar reactividad
  selectedFindings.value = new Set(selectedFindings.value)
}

function acceptAll() {
  selectedFindings.value = new Set(props.findings.map(f => f._tempId))
}

function editFinding(finding: GeneratedFinding) {
  editingFinding.value = { ...finding }
  showEditModal.value = true
}

function updateFinding(updated: GeneratedFinding) {
  const idx = props.findings.findIndex(f => f._tempId === updated._tempId)
  if (idx !== -1) {
    props.findings[idx] = updated
  }
  showEditModal.value = false
}

function removeFinding(id: string) {
  const idx = props.findings.findIndex(f => f._tempId === id)
  if (idx !== -1) {
    props.findings.splice(idx, 1)
    selectedFindings.value.delete(id)
    selectedFindings.value = new Set(selectedFindings.value)
    $q.notify({ type: 'info', message: 'Hallazgo eliminado' })
  }
}

// ============================================================
// GUARDAR
// ============================================================
async function saveSelected() {
  const selected = props.findings.filter(f =>
    selectedFindings.value.has(f._tempId),
  )

  if (selected.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona al menos un hallazgo',
    })
    return
  }

  saving.value = true
  const results: any[] = []
  let errors = 0

  for (const finding of selected) {
    try {
      // Limpiar campos internos
      const { _tempId, _ms, _source, _context, ...payload } = finding

      const response = await api.post('/findings', payload)
      results.push(response.data)
    } catch (error: any) {
      console.error('Error guardando hallazgo:', error)
      errors++
    }
  }

  saving.value = false

  if (results.length > 0) {
    emit('save', results)
    $q.notify({
      type: errors > 0 ? 'warning' : 'positive',
      message: `✅ ${results.length} de ${selected.length} hallazgos guardados${
        errors > 0 ? ` (${errors} errores)` : ''
      }`,
    })
  } else {
    $q.notify({
      type: 'negative',
      message: 'No se pudo guardar ningún hallazgo',
    })
  }
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

function getSeverityColor(severity: string): string {
  return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || 'grey'
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
  }
  return labels[severity] || severity
}

function getEmotionLabel(emotion: string): string {
  return getEmotionLabelDict(emotion)
}

function formatTimeMs(ms: number): string {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}
</script>

<style scoped>
.finding-card {
  cursor: pointer;
  transition: all 0.15s;
  border: 2px solid transparent;
}

.finding-card:hover {
  border-color: var(--q-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.finding-card--selected {
  border-color: var(--q-primary);
  background: rgba(30, 58, 138, 0.04);
}

.bg-blue-1 {
  background-color: #e3f2fd;
}
</style>