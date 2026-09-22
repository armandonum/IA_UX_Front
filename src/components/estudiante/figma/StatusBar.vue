<template>
  <q-card
    dark
    class="absolute-top bg-dark"
    style="
      left:50%;
      transform:translateX(-50%);
      margin-top:18px;
      border-radius:14px;
      z-index:50;
    "
  >

    <q-card-section horizontal class="items-center">

      <q-chip
        color="negative"
        text-color="white"
        icon="fiber_manual_record"
      >
        {{ tiempoFormateado }}
      </q-chip>

      <q-separator vertical inset />

      <q-chip
        color="primary"
        text-color="white"
      >
        {{ emocionEmoji }}
        &nbsp;
        {{ emocionLabel }}
      </q-chip>

      <q-separator vertical inset />

      <q-btn
        color="negative"
        unelevated
        icon="stop"
        label="Finalizar"
        @click="$emit('finalizar')"
      />

    </q-card-section>

  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  tiempoFormateado: string
  emocionEmoji: string
  emocionLabel: string
}>()

defineEmits<{
  (e: 'finalizar'): void
}>()
</script>