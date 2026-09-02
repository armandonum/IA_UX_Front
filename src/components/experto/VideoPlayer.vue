<template>
  <q-card flat bordered>
    <q-card-section class="q-pa-sm">
      <div class="text-caption text-grey-6 q-px-xs q-pb-xs flex items-center">
        <q-icon :name="icon" size="14px" class="q-mr-xs" />
        {{ label }}
      </div>
      <video
        v-if="videoUrl"
        ref="videoEl"
        :src="videoUrl"
        class="full-width rounded"
        style="aspect-ratio: 16/9; background: #000;"
        :muted="muted"
        @loadedmetadata="$emit('loadedmetadata')"
        @timeupdate="$emit('timeupdate')"
        @play="$emit('play')"
        @pause="$emit('pause')"
        @ended="$emit('ended')"
        @error="$emit('error')"
      />
      <div v-else class="flex flex-center bg-grey-2 rounded" style="aspect-ratio: 16/9; color: #9CA3AF;">
        <div class="text-center">
          <q-icon name="videocam_off" size="32px" />
          <div class="text-caption">Video no disponible</div>
        </div>
      </div>
      <div v-if="error" class="text-caption text-negative q-mt-xs">
        {{ error }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  videoUrl: string | null
  label: string
  icon: string
  error: string | null
  muted?: boolean
}>()

defineEmits<{
  (e: 'loadedmetadata'): void
  (e: 'timeupdate'): void
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'ended'): void
  (e: 'error'): void
}>()

const videoEl = ref<HTMLVideoElement | null>(null)

function getVideoElement() {
  return videoEl.value
}

defineExpose({
  getVideoElement,
})
</script>