<template>
  <!-- Botón flotante para minimizar/maximizar -->
  <q-btn
    v-if="isMinimized"
    round
    color="primary"
    icon="assessment"
    class="fixed z-50"
    :style="{ right: '16px', top: '50%', transform: 'translateY(-50%)' }"
    @click="isMinimized = false"
  >
    <q-badge floating color="positive" v-if="observations.length > 0">
      {{ observations.length }}
    </q-badge>
  </q-btn>

  <!-- Formulario completo -->
  <div
    v-else
    class="fixed z-40 bg-white rounded-borders shadow-10 border overflow-hidden"
    :style="{
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '420px',
      maxHeight: '88vh',
    }"
  >
    <!-- Header -->
    <div class="bg-primary text-white q-pa-md">
      <div class="row items-center justify-between">
        <div>
          <div class="text-caption text-weight-bold">🔍 Evaluación Heurística</div>
          <div class="text-caption" style="opacity: 0.85">
            {{ currentTaskTitle || 'Sin tarea seleccionada' }}
          </div>
        </div>
        <q-btn dense flat round icon="remove" color="white" @click="isMinimized = true" />
      </div>
    </div>

    <!-- Tabs internos -->
    <q-tabs
      v-model="innerTab"
      dense
      class="text-grey-7 bg-grey-2"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="observations" icon="report_problem" label="Problemas" />
      <q-tab name="positives" icon="thumb_up" label="Positivos" />
    </q-tabs>

    <q-separator />

    <!-- Cuerpo -->
    <div class="q-pa-md overflow-y-auto" style="max-height: calc(88vh - 200px)">
      <!-- ============================================================ -->
      <!-- TAB: OBSERVACIONES (PROBLEMAS)                                -->
      <!-- ============================================================ -->
      <div v-show="innerTab === 'observations'">
        <!-- Selector de principio (DINÁMICO) -->
        <q-select
          v-model="newObservation.principleId"
          :options="principleOptions"
          option-label="label"
          option-value="value"
          label="Principio heurístico *"
          dense
          outlined
          emit-value
          map-options
          class="q-mb-sm"
          :loading="loadingPrinciples"
          :rules="[val => !!val || 'Selecciona un principio']"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>
                  <strong>{{ scope.opt.code }}</strong> - {{ scope.opt.name }}
                </q-item-label>
                <q-item-label caption class="ellipsis-2-lines">
                  {{ scope.opt.description }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Descripción del principio seleccionado -->
        <q-banner
          v-if="selectedPrinciple"
          dense
          rounded
          class="bg-blue-1 text-primary q-mb-sm"
        >
          <div class="text-caption">
            <strong>{{ selectedPrinciple.code }}:</strong>
            {{ selectedPrinciple.description }}
          </div>
        </q-banner>

        <!-- Descripción del problema -->
        <q-input
          v-model="newObservation.description"
          type="textarea"
          rows="2"
          dense
          outlined
          label="Descripción del problema *"
          placeholder="Describe el problema encontrado..."
          class="q-mb-sm"
          autogrow
        />

        <!-- Severidad y Frecuencia -->
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-6">
            <q-select
              v-model="newObservation.severity"
              :options="severityOptions"
              option-label="label"
              option-value="value"
              label="Severidad *"
              dense
              outlined
              emit-value
              map-options
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="newObservation.frequency"
              :options="frequencyOptions"
              label="Frecuencia *"
              dense
              outlined
              emit-value
              map-options
            />
          </div>
        </div>

        <!-- Recomendación (opcional) -->
        <q-input
          v-model="newObservation.recommendation"
          type="textarea"
          rows="2"
          dense
          outlined
          label="Recomendación (opcional)"
          placeholder="¿Cómo se podría solucionar?"
          class="q-mb-sm"
          autogrow
        />

        <!-- Botón agregar -->
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Agregar Observación"
          class="full-width"
          :disable="!canAddObservation"
          :loading="saving"
          @click="handleAddObservation"
        />

        <q-separator class="q-my-md" />

        <!-- Lista de observaciones -->
        <div class="row items-center q-mb-sm">
          <div class="text-caption text-grey-7">
            <strong>{{ observations.length }}</strong> observación(es) registrada(s)
          </div>
          <q-space />
          <q-btn
            v-if="observations.length > 0"
            dense
            flat
            size="sm"
            icon="delete_sweep"
            color="negative"
            label="Limpiar"
            @click="$emit('clear-all-observations')"
          />
        </div>

        <div v-if="observations.length === 0" class="text-center text-grey-6 q-py-md">
          <q-icon name="inbox" size="32px" />
          <div class="text-caption">No hay observaciones registradas</div>
        </div>

        <HeuristicObservationCard
          v-for="(obs, idx) in observations"
          :key="obs.id"
          :description="obs.description"
          :severity="obs.severity"
          :frequency="obs.frequency"
          :principle-code="getPrincipleCode(obs.principleId)"
          :created-at="obs.createdAt"
          @delete="$emit('delete-observation', idx)"
        />
      </div>

      <!-- ============================================================ -->
      <!-- TAB: ASPECTOS POSITIVOS                                       -->
      <!-- ============================================================ -->
      <div v-show="innerTab === 'positives'">
        <q-input
          v-model="newPositiveAspect.description"
          type="textarea"
          rows="3"
          dense
          outlined
          label="Descripción del aspecto positivo *"
          placeholder="¿Qué funciona bien en este sistema?"
          class="q-mb-sm"
          autogrow
        />

        <q-btn
          unelevated
          color="positive"
          icon="thumb_up"
          label="Agregar Aspecto Positivo"
          class="full-width"
          :disable="!canAddPositiveAspect"
          :loading="saving"
          @click="handleAddPositiveAspect"
        />

        <q-separator class="q-my-md" />

        <div class="text-caption text-grey-7 q-mb-sm">
          <strong>{{ positiveAspects.length }}</strong> aspecto(s) positivo(s) registrado(s)
        </div>

        <div v-if="positiveAspects.length === 0" class="text-center text-grey-6 q-py-md">
          <q-icon name="thumb_up_off_alt" size="32px" />
          <div class="text-caption">No hay aspectos positivos registrados</div>
        </div>

        <q-card
          v-for="(aspect, idx) in positiveAspects"
          :key="aspect.id"
          flat
          bordered
          class="q-mb-sm border-left-green"
        >
          <q-card-section class="q-pa-sm">
            <div class="row items-start q-gutter-sm">
              <q-icon name="check_circle" color="positive" size="20px" />
              <div class="col text-caption">{{ aspect.description }}</div>
              <q-btn
                dense
                flat
                round
                size="sm"
                icon="delete"
                color="negative"
                @click="$emit('delete-positive-aspect', idx)"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-grey-2 q-pa-sm row items-center justify-between">
      <div class="text-caption text-grey-6">
        Tarea: {{ currentTaskTitle || '—' }}
      </div>
      <q-btn
        unelevated
        color="positive"
        size="sm"
        icon="check"
        label="Marcar tarea completada"
        :disable="!currentTaskId"
        @click="$emit('mark-task-complete')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import HeuristicObservationCard from './HeuristicObservationCard.vue'
import type { HeuristicPrinciple } from '@/api/heuristic.api'

// ============================================================
// PROPS (DINÁMICOS desde la BD)
// ============================================================
const props = defineProps<{
  observations: any[]
  positiveAspects: any[]
  currentTaskId: string | null
  currentTaskTitle: string | null
  principles: HeuristicPrinciple[]        // 🔥 DINÁMICO
  loadingPrinciples: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'add-observation', data: any): void
  (e: 'delete-observation', index: number): void
  (e: 'clear-all-observations'): void
  (e: 'add-positive-aspect', data: any): void
  (e: 'delete-positive-aspect', index: number): void
  (e: 'mark-task-complete'): void
}>()

// ============================================================
// ESTADO
// ============================================================
const isMinimized = ref(true)
const innerTab = ref('observations')

const newObservation = ref({
  principleId: null as string | null,
  description: '',
  severity: 3 as 1 | 2 | 3 | 4 | 5,
  frequency: 'Ocasionalmente',
  recommendation: '',
})

const newPositiveAspect = ref({
  description: '',
})

// ============================================================
// COMPUTED
// ============================================================
const principleOptions = computed(() =>
  props.principles
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(p => ({
      label: `${p.code} - ${p.name}`,
      value: p.principleId,
      code: p.code,
      name: p.name,
      description: p.description,
    })),
)

const selectedPrinciple = computed(() =>
  props.principles.find(p => p.principleId === newObservation.value.principleId),
)

const canAddObservation = computed(
  () =>
    !!newObservation.value.principleId &&
    newObservation.value.description.trim().length > 0,
)

const canAddPositiveAspect = computed(
  () => newPositiveAspect.value.description.trim().length > 0,
)

// ============================================================
// OPCIONES
// ============================================================
const severityOptions = [
  { label: '1 - Leve', value: 1 },
  { label: '2 - Menor', value: 2 },
  { label: '3 - Moderado', value: 3 },
  { label: '4 - Grave', value: 4 },
  { label: '5 - Crítico', value: 5 },
]

const frequencyOptions = [
  'Siempre',
  'Frecuentemente',
  'Ocasionalmente',
  'Raramente',
  'Nunca',
]

// ============================================================
// MÉTODOS
// ============================================================
function handleAddObservation() {
  if (!canAddObservation.value) return

  emit('add-observation', {
    principleId: newObservation.value.principleId,
    description: newObservation.value.description.trim(),
    severity: newObservation.value.severity,
    frequency: newObservation.value.frequency,
    recommendation: newObservation.value.recommendation.trim() || null,
  })

  // Reset
  newObservation.value = {
    principleId: null,
    description: '',
    severity: 3,
    frequency: 'Ocasionalmente',
    recommendation: '',
  }
}

function handleAddPositiveAspect() {
  if (!canAddPositiveAspect.value) return

  emit('add-positive-aspect', {
    description: newPositiveAspect.value.description.trim(),
  })

  newPositiveAspect.value.description = ''
}

function getPrincipleCode(principleId: string) {
  return props.principles.find(p => p.principleId === principleId)?.code || '—'
}

// ============================================================
// WATCHERS
// ============================================================
watch(
  () => props.currentTaskId,
  newVal => {
    if (newVal) {
      isMinimized.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.border-left-green {
  border-left: 4px solid #4caf50 !important;
}
.bg-blue-1 {
  background-color: #e3f2fd;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>