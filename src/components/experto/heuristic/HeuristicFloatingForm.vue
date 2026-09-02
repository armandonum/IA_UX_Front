<!-- components/experto/heuristic/HeuristicFloatingForm.vue -->

<template>
  <!-- Botón flotante para minimizar/maximizar -->
  <q-btn
    v-if="isMinimized"
    round
    color="primary"
    icon="assessment"
    class="fixed z-50"
    :style="{
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)'
    }"
    @click="isMinimized = false"
  >
    <q-badge floating color="positive" v-if="observations.length > 0">
      {{ observations.length }}
    </q-badge>
  </q-btn>

  <!-- Formulario completo -->
  <div
    v-else
    class="fixed z-40 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
    :style="{
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '400px',
      maxHeight: '85vh'
    }"
  >
    <!-- Header -->
    <div class="bg-primary text-white p-3">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold">🔍 Evaluación Heurística</div>
          <div class="text-[10px] opacity-80">
            {{ currentTaskTitle || 'Sin tarea seleccionada' }}
          </div>
        </div>
        <div class="flex items-center gap-1">
          <q-btn dense flat icon="remove" class="text-white" @click="isMinimized = true" />
        </div>
      </div>
    </div>

    <!-- Cuerpo -->
    <div class="p-3 overflow-y-auto" style="max-height: calc(85vh - 110px)">
      <!-- Selector de principio -->
      <q-select
        v-model="selectedPrincipleId"
        :options="principleOptions"
        option-label="label"
        option-value="value"
        label="Principio heurístico"
        dense
        filled
        class="q-mb-sm"
        emit-value
        map-options
      />

      <!-- Descripción del principio -->
      <div v-if="selectedPrinciple" class="text-[10px] text-grey-6 q-mb-sm p-2 bg-grey-1 rounded">
        <strong class="text-grey-8">{{ selectedPrinciple.code }}</strong>
        {{ selectedPrinciple.description }}
      </div>

      <!-- Campos del formulario -->
      <q-input
        v-model="newObservation.description"
        type="textarea"
        rows="2"
        dense
        filled
        label="Descripción del problema"
        placeholder="Describe el problema encontrado..."
        class="q-mb-sm"
        autogrow
      />

      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-6">
          <q-select
            v-model="newObservation.severity"
            :options="severityOptions"
            option-label="label"
            option-value="value"
            label="Severidad"
            dense
            filled
            emit-value
            map-options
          />
        </div>
        <div class="col-6">
          <q-select
            v-model="newObservation.frequency"
            :options="frequencyOptions"
            label="Frecuencia"
            dense
            filled
            emit-value
            map-options
          />
        </div>
      </div>

      <q-btn
        unelevated
        color="primary"
        label="Agregar observación"
        class="full-width q-mb-sm"
        :disable="!canAddObservation"
        @click="addObservation"
      />

      <q-separator class="q-my-sm" />

      <!-- Lista de observaciones -->
      <div v-if="observations.length > 0">
        <div class="text-xs text-grey-6 q-mb-sm flex items-center">
          <span class="text-weight-bold">{{ observations.length }}</span>
          observaciones registradas
          <q-btn dense flat size="sm" icon="clear" color="negative" class="q-ml-auto" @click="$emit('clear-all')" />
        </div>
        <HeuristicObservationCard
          v-for="(obs, idx) in observations"
          :key="idx"
          :description="obs.description"
          :severity="obs.severity"
          :frequency="obs.frequency"
          :principle-code="getPrincipleCode(obs.principleId)"
          :created-at="obs.createdAt"
          @delete="$emit('delete-observation', idx)"
        />
      </div>
      <div v-else class="text-center text-grey-6 text-sm q-py-md">
        No hay observaciones registradas
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-gray-200 p-2 bg-gray-50 flex items-center justify-between">
      <div class="text-[10px] text-grey-6">
        Tarea: {{ currentTaskTitle || '—' }}
      </div>
      <div class="flex gap-1">
        <q-btn
          flat
          dense
          size="sm"
          label="Limpiar"
          class="text-grey-6"
          @click="resetForm"
        />
        <q-btn
          unelevated
          color="positive"
          size="sm"
          label="Marcar tarea"
          :disable="!currentTaskId"
          @click="$emit('mark-task-complete')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { HEURISTIC_PRINCIPLES, SEVERITY_OPTIONS, FREQUENCY_OPTIONS } from '@/data/heuristicPrinciples'
import HeuristicObservationCard from './HeuristicObservationCard.vue'
import type { HeuristicObservation } from '@/data/heuristicPrinciples'

const props = defineProps<{
  observations: HeuristicObservation[]
  currentTaskId: string | null
  currentTaskTitle: string | null
}>()

const emit = defineEmits<{
  (e: 'add-observation', observation: HeuristicObservation): void
  (e: 'delete-observation', index: number): void
  (e: 'clear-all'): void
  (e: 'mark-task-complete'): void
}>()

const isMinimized = ref(true)
const selectedPrincipleId = ref<string | null>(null)
const newObservation = ref({
  description: '',
  severity: 3 as 1 | 2 | 3 | 4 | 5,
  frequency: 'Ocasionalmente'
})

const principleOptions = computed(() => {
  return HEURISTIC_PRINCIPLES.map(p => ({
    label: `${p.code} - ${p.name}`,
    value: p.id
  }))
})

const selectedPrinciple = computed(() => {
  return HEURISTIC_PRINCIPLES.find(p => p.id === selectedPrincipleId.value)
})

const severityOptions = SEVERITY_OPTIONS
const frequencyOptions = FREQUENCY_OPTIONS

const canAddObservation = computed(() => {
  return selectedPrincipleId.value && newObservation.value.description.trim().length > 0
})

function addObservation() {
  if (!canAddObservation.value) return

  const observation: HeuristicObservation = {
    id: crypto.randomUUID(),
    principleId: selectedPrincipleId.value!,
    taskId: props.currentTaskId || '',
    description: newObservation.value.description.trim(),
    severity: newObservation.value.severity,
    frequency: newObservation.value.frequency,
    timestampMs: Date.now(),
    createdAt: new Date().toISOString()
  }

  emit('add-observation', observation)
  resetForm()
}

function resetForm() {
  newObservation.value = {
    description: '',
    severity: 3,
    frequency: 'Ocasionalmente'
  }
}

function getPrincipleCode(principleId: string) {
  const p = HEURISTIC_PRINCIPLES.find(p => p.id === principleId)
  return p?.code || '—'
}

// Auto-abrir el formulario cuando hay una tarea seleccionada
watch(() => props.currentTaskId, (newVal) => {
  if (newVal) {
    isMinimized.value = false
  }
}, { immediate: true })
</script>