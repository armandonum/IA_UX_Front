<!-- components/experto/heuristic/HeuristicFinishModal.vue -->

<template>
  <q-dialog :model-value="show" persistent>
    <q-card dark class="bg-dark" style="width:450px;border-radius:18px;">
      <q-card-section class="text-center">
        <q-icon name="check_circle" color="positive" size="54px" />
        <div class="text-h6 q-mt-lg">✅ Evaluación completada</div>
        <div class="text-body2 text-grey-4 q-mt-sm">Tiempo: {{ tiempo }}</div>
        <div class="text-caption text-grey-5">
          {{ eventos }} eventos • {{ lecturas }} lecturas de emociones
        </div>
        <div class="text-caption text-primary q-mt-sm">
          📝 {{ observaciones }} observaciones registradas
        </div>
        <q-btn
          unelevated
          color="primary"
          label="Ver resultados"
          class="q-mt-md"
          @click="$emit('close')"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  tiempo: string
  eventos: number
  lecturas: number
  observaciones: number
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>