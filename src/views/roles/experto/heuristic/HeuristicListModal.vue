<!-- components/experto/heuristic/HeuristicListModal.vue -->

<template>
  <q-dialog :model-value="show" persistent>
    <q-card style="min-width: 500px; max-width: 90vw;">
      <q-card-section>
        <div class="text-h6">Evaluaciones heurísticas</div>
        <div class="text-caption text-grey-6">
          Selecciona una evaluación previa o inicia una nueva
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="max-h-64 overflow-y-auto">
        <div v-if="evaluations.length === 0" class="text-center text-grey-6 q-py-md">
          No hay evaluaciones previas
        </div>
        <div
          v-for="ev in evaluations"
          :key="ev.evaluationId"
          class="q-px-sm q-py-xs rounded cursor-pointer hover:bg-grey-1"
          @click="$emit('select', ev.evaluationId)"
        >
          <div class="row items-center">
            <div class="col">
              <div class="text-sm">{{ ev.startedAt ? new Date(ev.startedAt).toLocaleDateString() : '—' }}</div>
              <div class="text-xs text-grey-6">{{ ev.status }}</div>
            </div>
            <q-badge :color="ev.status === 'completed' ? 'positive' : 'warning'">
              {{ ev.status === 'completed' ? 'Completada' : 'En curso' }}
            </q-badge>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="$emit('close')" />
        <q-btn unelevated color="primary" icon="add" label="Nueva evaluación" @click="$emit('new')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  evaluations: any[]
}>()

defineEmits<{
  (e: 'select', id: string): void
  (e: 'new'): void
  (e: 'close'): void
}>()
</script>