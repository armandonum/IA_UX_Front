<!-- components/estudiante/figma/ClientIdInput.vue -->
<template>
  <q-input
    :model-value="modelValue"
    label="Client ID de Figma"
    filled
    dense
    class="q-mb-md"
    style="max-width: 420px"
    hint="Necesario para cargar el prototipo embebido de Figma"
    @update:model-value="onInput"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onInput(value: string | number | null) {
  emit('update:modelValue', String(value ?? ''))
}
</script>