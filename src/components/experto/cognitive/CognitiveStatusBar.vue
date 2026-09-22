<template>
  <div class="bg-dark border-top border-grey-7 q-pa-sm q-px-md row items-center q-gutter-x-md no-wrap">
    <!-- Tiempo -->
    <div class="row items-center q-gutter-xs">
      <q-icon name="timer" color="info" size="20px" />
      <span class="text-subtitle1 text-white text-weight-bold font-mono">{{ tiempo }}</span>
    </div>

    <!-- Progreso -->
    <div class="col-3">
      <q-linear-progress
        :value="progress / 100"
        color="primary"
        track-color="grey-7"
        size="8px"
      />
      <div class="text-caption text-grey-5 q-mt-xs">{{ progress }}% completado</div>
    </div>

    <!-- Tarea -->
    <div class="col-4 text-body2 text-grey-5 truncate">
      <span class="text-weight-medium text-white">{{ taskName || 'Sin tarea' }}</span>
    </div>

    <!-- Emoción -->
    <div class="row items-center q-gutter-xs bg-grey-8 q-px-sm q-py-xs rounded-borders">
      <span class="text-h6">{{ emocionEmoji || '—' }}</span>
      <span class="text-body2 text-white text-weight-medium">{{ emocionLabel || 'analizando…' }}</span>
    </div>

    <!-- Botón Finalizar -->
    <q-btn
      color="negative"
      icon="stop"
      label="Finalizar"
      size="sm"
      outline
      no-caps
      @click="$emit('finalizar')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tiempo: string
  emocionEmoji: string
  emocionLabel: string
  progress: number
  taskName: string
}>()

defineEmits<{
  (e: 'finalizar'): void
}>()
</script>