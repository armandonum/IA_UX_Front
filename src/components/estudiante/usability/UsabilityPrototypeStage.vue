<!-- views/roles/estudiante/components/UsabilityPrototypeStage.vue -->

<template>
  <iframe
    ref="figmaFrame"
    class="w-full h-full border-0"
    :src="figmaEmbedUrl"
    allowfullscreen
  />
  <video ref="faceVideoEl" class="hidden" autoplay playsinline muted />
  <canvas ref="captureCanvas" class="hidden" width="320" height="240" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  figmaEmbedUrl: string
}>()

const figmaFrame = ref<HTMLIFrameElement | null>(null)
const faceVideoEl = ref<HTMLVideoElement | null>(null)
const captureCanvas = ref<HTMLCanvasElement | null>(null)

defineExpose({
  figmaFrame,
  faceVideoEl,
  captureCanvas,
})
</script>

<style scoped>
.hidden { display: none; }
</style>