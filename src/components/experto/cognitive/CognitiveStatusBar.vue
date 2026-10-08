<!-- components/experto/cognitive/CognitiveStatusBar.vue -->
<template>
  <div class="status-bar q-px-md q-py-sm row items-center q-gutter-md no-wrap">
    <!-- Tiempo -->
    <div class="row items-center q-gutter-xs no-wrap">
      <q-icon name="timer" size="18px" color="primary" />
      <span class="text-subtitle2 text-weight-bold">{{ tiempo }}</span>
    </div>

    <!-- Progreso -->
    <div class="col" style="max-width: 280px;">
      <div class="row items-center q-gutter-xs">
        <q-linear-progress
          :value="progress / 100"
          color="primary"
          track-color="grey-3"
          size="8px"
          rounded
          class="col"
        />
        <span class="text-caption text-grey-7" style="min-width: 36px;">
          {{ progress }}%
        </span>
      </div>
    </div>

    <!-- Tarea -->
    <div class="text-body2 text-grey-8 ellipsis" style="max-width: 280px;">
      <q-icon name="assignment" size="16px" class="q-mr-xs" />
      {{ taskName || 'Sin tarea' }}
    </div>

    <q-space />

    <!-- Emoción -->
    <div class="row items-center q-gutter-xs no-wrap q-px-sm q-py-xs bg-grey-2 rounded-borders">
      <span class="text-h6" style="line-height: 1;">
        {{ emocionEmoji || '—' }}
      </span>
      <span class="text-caption text-grey-8">
        {{ emocionLabel || 'analizando…' }}
      </span>
    </div>

    <!-- Botón Finalizar -->
    <q-btn
      unelevated
      dense
      color="negative"
      icon="stop"
      label="Finalizar"
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
  taskName?: string
}>()

defineEmits<{
  (e: 'finalizar'): void
}>()
</script>

<style scoped>
.status-bar {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  min-height: 56px;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>