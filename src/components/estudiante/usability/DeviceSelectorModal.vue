<!-- components/estudiante/usability/DeviceSelectorModal.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 480px; max-width: 560px;">
      <!-- Header -->
      <q-card-section class="bg-primary text-white q-py-sm">
        <div class="row items-center justify-between">
          <div class="text-subtitle1">🎥 Selecciona tus dispositivos</div>
          <q-btn flat round dense icon="close" size="sm" @click="cancelar" />
        </div>
      </q-card-section>

      <!-- Error global -->
      <q-banner v-if="error" class="bg-negative text-white" dense>
        <template v-slot:avatar>
          <q-icon name="error" size="sm" />
        </template>
        <div class="text-caption">{{ error }}</div>
      </q-banner>

      <!-- Loading -->
      <div v-if="loading" class="column items-center q-py-lg">
        <q-spinner color="primary" size="32px" />
        <div class="text-caption text-grey-7 q-mt-sm">Buscando dispositivos…</div>
      </div>

      <q-card-section v-else class="q-py-md">
        <!-- ═══════════════════════════════════════════════════ -->
        <!-- CÁMARA                                              -->
        <!-- ═══════════════════════════════════════════════════ -->
        <div class="row items-center q-mb-xs">
          <q-icon name="videocam" size="18px" color="primary" />
          <div class="text-caption text-weight-medium q-ml-xs">Cámara</div>
          <q-space />
          <q-badge v-if="videoPreviewActive" color="positive" dense>
            <q-icon name="check" size="10px" class="q-mr-xs" />OK
          </q-badge>
          <q-badge v-else-if="videoError" color="negative" dense>
            <q-icon name="error" size="10px" class="q-mr-xs" />Error
          </q-badge>
        </div>

        <q-select
          v-model="selectedVideoId"
          :options="videoDevices"
          option-label="label"
          option-value="deviceId"
          emit-value
          map-options
          outlined
          dense
          class="q-mb-xs"
        />

        <!-- Preview -->
        <div
          class="bg-black rounded-borders relative-position q-mb-md"
          style="aspect-ratio: 16/9; overflow: hidden;"
        >
          <video
            ref="videoPreviewEl"
            autoplay
            playsinline
            muted
            style="width: 100%; height: 100%; object-fit: cover;"
          />
          <div
            v-if="!videoPreviewActive"
            class="absolute-full flex flex-center text-white"
          >
            <div class="text-center">
              <q-icon name="videocam_off" size="32px" />
              <div class="text-caption q-mt-xs" v-if="videoError">
                {{ videoError }}
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════ -->
        <!-- MICRÓFONO                                           -->
        <!-- ═══════════════════════════════════════════════════ -->
        <div class="row items-center q-mb-xs">
          <q-icon name="mic" size="18px" color="primary" />
          <div class="text-caption text-weight-medium q-ml-xs">Micrófono</div>
          <q-space />
          <q-badge v-if="audioPreviewActive" color="positive" dense>
            <q-icon name="check" size="10px" class="q-mr-xs" />OK
          </q-badge>
          <q-badge v-else-if="audioError" color="negative" dense>
            <q-icon name="error" size="10px" class="q-mr-xs" />Error
          </q-badge>
        </div>

        <q-select
          v-model="selectedAudioId"
          :options="audioDevices"
          option-label="label"
          option-value="deviceId"
          emit-value
          map-options
          outlined
          dense
          class="q-mb-xs"
        />

        <!-- Medidor de audio -->
        <div class="row items-center q-gutter-sm q-mb-xs">
          <q-icon
            name="mic"
            size="16px"
            :color="audioLevel > 10 ? 'positive' : 'grey-5'"
          />
          <q-linear-progress
            :value="audioLevel / 100"
            :color="audioLevel > 10 ? 'positive' : 'grey-4'"
            track-color="grey-3"
            size="10px"
            rounded
            class="col"
          />
          <div class="text-caption text-grey-7" style="min-width: 32px;">
            {{ Math.round(audioLevel) }}%
          </div>
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          <span v-if="audioError" class="text-negative">
            {{ audioError }}
          </span>
          <span v-else-if="audioLevel > 10">
            ✅ Se detecta tu voz
          </span>
          <span v-else>
            🔊 Habla para probar
          </span>
        </div>

        <!-- ═══════════════════════════════════════════════════ -->
        <!-- PANTALLA                                            -->
        <!-- ═══════════════════════════════════════════════════ -->
        <div class="row items-center q-mb-xs">
          <q-icon name="desktop_windows" size="18px" color="primary" />
          <div class="text-caption text-weight-medium q-ml-xs">Pantalla</div>
        </div>
        <div class="text-caption text-grey-6">
          Al iniciar la tarea el navegador te pedirá qué ventana compartir.
        </div>
      </q-card-section>

      <!-- Footer -->
      <q-card-actions align="right" class="q-pa-sm bg-grey-1">
        <q-btn
          flat
          dense
          label="Cancelar"
          color="grey-7"
          @click="cancelar"
        />
        <q-btn
          unelevated
          dense
          color="primary"
          icon="check"
          label="Continuar"
          :disable="!puedeContinuar"
          @click="confirmar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useMediaDevices } from '@/composables/useMediaDevices'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'confirmed',
    selection: { videoDeviceId: string; audioDeviceId: string },
  ): void
  (e: 'cancelled'): void
}>()

const {
  videoDevices,
  audioDevices,
  loading,
  error,
  listDevices,
} = useMediaDevices()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const selectedVideoId = ref<string | null>(null)
const selectedAudioId = ref<string | null>(null)

const videoPreviewEl = ref<HTMLVideoElement | null>(null)
const videoPreviewActive = ref(false)
const videoError = ref<string | null>(null)
let videoStream: MediaStream | null = null

const audioPreviewActive = ref(false)
const audioError = ref<string | null>(null)
const audioLevel = ref(0)
let audioStream: MediaStream | null = null
let audioContext: AudioContext | null = null
let audioAnalyser: AnalyserNode | null = null
let audioAnimationId: number | null = null

const puedeContinuar = computed(() => {
  return (
    !!selectedVideoId.value &&
    !!selectedAudioId.value &&
    videoPreviewActive.value &&
    audioPreviewActive.value &&
    !videoError.value &&
    !audioError.value
  )
})

// ============================================================
// INICIALIZAR
// ============================================================
watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await listDevices()
      if (videoDevices.value.length > 0) {
        selectedVideoId.value = videoDevices.value[0].deviceId
      }
      if (audioDevices.value.length > 0) {
        selectedAudioId.value = audioDevices.value[0].deviceId
      }
    } else {
      cleanup()
    }
  },
)

// ============================================================
// PREVIEW CÁMARA
// ============================================================
watch(selectedVideoId, async (newId) => {
  if (!newId) return
  await nextTick()
  await startVideoPreview(newId)
})

async function startVideoPreview(deviceId: string) {
  stopVideoPreview()
  videoError.value = null
  videoPreviewActive.value = false

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
    })

    if (videoPreviewEl.value) {
      videoPreviewEl.value.srcObject = videoStream
      videoPreviewActive.value = true
    }
  } catch (e: any) {
    videoError.value = mapError(e)
    console.error('Error preview cámara:', e)
  }
}

function stopVideoPreview() {
  videoStream?.getTracks().forEach((t) => t.stop())
  videoStream = null
  videoPreviewActive.value = false
}

// ============================================================
// PREVIEW AUDIO
// ============================================================
watch(selectedAudioId, async (newId) => {
  if (!newId) return
  await startAudioPreview(newId)
})

async function startAudioPreview(deviceId: string) {
  stopAudioPreview()
  audioError.value = null
  audioPreviewActive.value = false
  audioLevel.value = 0

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
    })

    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const source = audioContext.createMediaStreamSource(audioStream)
    audioAnalyser = audioContext.createAnalyser()
    audioAnalyser.fftSize = 256
    source.connect(audioAnalyser)

    const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount)

    const updateLevel = () => {
      if (!audioAnalyser) return
      audioAnalyser.getByteFrequencyData(dataArray)
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
      audioLevel.value = Math.min(100, (sum / dataArray.length) * 2)
      audioAnimationId = requestAnimationFrame(updateLevel)
    }
    updateLevel()

    audioPreviewActive.value = true
  } catch (e: any) {
    audioError.value = mapError(e)
    console.error('Error preview audio:', e)
  }
}

function stopAudioPreview() {
  if (audioAnimationId) {
    cancelAnimationFrame(audioAnimationId)
    audioAnimationId = null
  }
  audioStream?.getTracks().forEach((t) => t.stop())
  audioStream = null
  audioContext?.close().catch(() => {})
  audioContext = null
  audioAnalyser = null
  audioPreviewActive.value = false
  audioLevel.value = 0
}

// ============================================================
// ERRORES TRADUCIDOS
// ============================================================
function mapError(e: any): string {
  const name = e?.name || ''
  const message = e?.message || ''

  if (name === 'NotAllowedError' || message.includes('Permission'))
    return 'Permiso denegado'
  if (name === 'NotFoundError') return 'Dispositivo no encontrado'
  if (name === 'NotReadableError') return 'En uso por otra app'
  if (name === 'OverconstrainedError') return 'Configuración no soportada'
  if (name === 'SecurityError') return 'Requiere HTTPS'
  if (name === 'AbortError') return 'Acceso abortado'

  return 'Error: ' + (name || message)
}

// ============================================================
// CONFIRMAR / CANCELAR
// ============================================================
function confirmar() {
  if (!puedeContinuar.value) return

  emit('confirmed', {
    videoDeviceId: selectedVideoId.value!,
    audioDeviceId: selectedAudioId.value!,
  })
  cleanup()
  visible.value = false
}

function cancelar() {
  cleanup()
  emit('cancelled')
  visible.value = false
}

function cleanup() {
  stopVideoPreview()
  stopAudioPreview()
}

onBeforeUnmount(cleanup)
</script>