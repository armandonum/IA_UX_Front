<!-- components/findings/FindingsFilters.vue -->
<template>
  <q-card class="bg-slate-800 border-slate-700 q-mb-4">
    <q-card-section>
      <div class="row q-col-gutter-sm items-center">
        <!-- Estado -->
        <div class="col-12 sm:col-6 md:col-3">
          <q-select
            :model-value="filters.status"
            label="Estado"
            filled
            dense
            dark
            :options="statusOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            clearable
            @update:model-value="updateFilter('status', $event)"
          />
        </div>

        <!-- Severidad -->
        <div class="col-12 sm:col-6 md:col-3">
          <q-select
            :model-value="filters.severity"
            label="Severidad"
            filled
            dense
            dark
            :options="severityOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            clearable
            @update:model-value="updateFilter('severity', $event)"
          />
        </div>

        <!-- Tipo -->
        <div class="col-12 sm:col-6 md:col-3">
          <q-select
            :model-value="filters.type"
            label="Tipo"
            filled
            dense
            dark
            :options="typeOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            clearable
            @update:model-value="updateFilter('type', $event)"
          />
        </div>

        <!-- Búsqueda -->
        <div class="col-12 sm:col-6 md:col-3">
          <q-input
            :model-value="filters.search"
            label="Buscar"
            filled
            dense
            dark
            placeholder="Buscar en descripción..."
            @update:model-value="updateFilter('search', $event)"
            @keyup.enter="$emit('apply')"
          >
            <template v-slot:append>
              <q-icon name="search" class="cursor-pointer" @click="$emit('apply')" />
            </template>
          </q-input>
        </div>

        <!-- Botones -->
        <div class="col-12 flex gap-2 q-mt-sm">
          <q-btn
            color="primary"
            label="Aplicar Filtros"
            @click="$emit('apply')"
            size="sm"
          />
          <q-btn
            flat
            label="Limpiar"
            @click="$emit('reset')"
            size="sm"
          />
          <q-space />
          <span class="text-xs text-slate-500 q-mt-sm">
            Mostrando {{ findingsCount }} hallazgos
          </span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  filters: any
  findingsCount?: number
}>()

const emit = defineEmits<{
  (e: 'update:filters', value: any): void
  (e: 'apply'): void
  (e: 'reset'): void
}>()

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'En Progreso', value: 'in_progress' },
  { label: 'Resuelto', value: 'resolved' },
  { label: 'No Resuelto', value: 'not_resolved' },
  { label: 'Conservado', value: 'kept' },
]

const severityOptions = [
  { label: 'Crítico', value: 'critical' },
  { label: 'Alto', value: 'high' },
  { label: 'Medio', value: 'medium' },
  { label: 'Bajo', value: 'low' },
]

const typeOptions = [
  { label: 'Problema', value: 'problem' },
  { label: 'Dificultad', value: 'difficulty' },
  { label: 'Accesibilidad', value: 'accessibility' },
  { label: 'Fricción', value: 'friction' },
  { label: 'Positivo', value: 'positive' },
  { label: 'Oportunidad', value: 'opportunity' },
]

const updateFilter = (key: string, value: any) => {
  const newFilters = { ...props.filters, [key]: value }
  emit('update:filters', newFilters)
}
</script>