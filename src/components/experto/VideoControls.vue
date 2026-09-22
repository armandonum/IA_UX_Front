<!-- components/experto/VideoControls.vue -->

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="row items-center q-gutter-sm q-pa-sm">
      <q-btn
        round
        dense
        color="primary"
        :icon="playing ? 'pause' : 'play_arrow'"
        @click="$emit('play')"
      />
      <q-btn dense flat label="-5s" @click="$emit('seek', -5000)" />
      <q-btn dense flat label="+5s" @click="$emit('seek', 5000)" />
      <span class="text-caption text-grey-7 font-mono">
        {{ formatTiempoS(currentTime) }} / {{ formatTiempoS(duration) }}
      </span>
      <q-btn-dropdown
        dense
        flat
        :label="speed + 'x'"
        class="q-ml-sm"
      >
        <q-list dense>
          <q-item v-for="opt in speedOptions" :key="opt" clickable @click="$emit('speed-change', opt)">
            <q-item-section>{{ opt }}x</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <!-- <q-btn
        unelevated
        color="positive"
        label="+ Comentario"
        class="q-ml-auto"
        @click="$emit('add-comment')"
      /> -->
      <q-btn
        unelevated
        color="primary"
        label="+ Experto"
        class="q-ml-auto"
        @click="$emit('add-expert-comment')"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  playing: boolean
  currentTime: number
  duration: number
  speed: number
  speedOptions: number[]
}>()

defineEmits<{
  (e: 'play'): void
  (e: 'seek', delta: number): void
  (e: 'speed-change', speed: number): void
  (e: 'add-comment'): void
  (e: 'add-expert-comment'): void  // 🔥 Nuevo evento
}>()

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}
</script>