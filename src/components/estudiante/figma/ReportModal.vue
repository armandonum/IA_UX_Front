<!-- components/estudiante/figma/ReportModal.vue -->

<template>
  <!-- Botón flotante -->
  <q-btn
    v-if="!isOpen"
    round
    color="warning"
    icon="flag"
    class="fixed z-50 shadow-lg"
    :style="{
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)'
    }"
    @click="isOpen = true"
  >
    <q-tooltip>Reportar problema</q-tooltip>
  </q-btn>

  <!-- Modal -->
  <q-dialog v-model="isOpen" persistent position="right" full-width>
    <q-card style="max-width: 450px; width: 100%;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">
          <q-icon name="flag" color="warning" class="q-mr-sm" />
          Reportar problema
        </div>
        <q-space />
        <q-btn dense flat icon="close" @click="isOpen = false" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-sm">
        <!-- Tiempo -->
        <div class="text-caption text-grey-6 q-mb-sm">
          ⏱️ {{ formatTiempoS(currentTimeMs) }}
        </div>

        <!-- Emoción -->
        <div v-if="emotionActualLabel && emotionActualLabel !== '—'" class="text-caption text-grey-6 q-mb-sm">
          😊 {{ emotionActualLabel }}
        </div>

        <q-form @submit.prevent="enviarReporte">
          <!-- Solo texto -->
          <q-input
            v-model="form.text"
            type="textarea"
            rows="4"
            filled
            dense
            label="Describe el problema *"
            placeholder="¿Qué está pasando?"
            :rules="[val => !!val || 'La descripción es obligatoria']"
            autogrow
          />

          <div class="row q-col-gutter-sm q-mt-sm">
            <div class="col-6">
              <q-btn
                unelevated
                color="primary"
                label="Reportar"
                type="submit"
                class="full-width"
                :loading="loading"
              />
            </div>
            <div class="col-6">
              <q-btn
                flat
                label="Cancelar"
                class="full-width"
                @click="isOpen = false"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps<{
  sessionId: string | null
  currentTimeMs: number
  emotionActualLabel: string
}>()

const emit = defineEmits<{
  (e: 'seek', ms: number): void
  (e: 'report', data: {
    sessionId: string
    elapsedMsTotal: number
    text: string
    emotionLabel: string | null
  }): void
}>()

const $q = useQuasar()
const isOpen = ref(false)
const loading = ref(false)

const form = ref({
  text: ''
})

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

async function enviarReporte() {
  if (!form.value.text.trim()) {
    $q.notify({ type: 'warning', message: 'Describe el problema' })
    return
  }

  if (!props.sessionId) {
    $q.notify({ type: 'negative', message: 'No hay sesión activa' })
    return
  }

  loading.value = true

  emit('report', {
    sessionId: props.sessionId,
    elapsedMsTotal: Math.round(props.currentTimeMs),
    text: form.value.text.trim(),
    emotionLabel: props.emotionActualLabel || null
  })

  form.value.text = ''
  isOpen.value = false
  loading.value = false

  $q.notify({
    type: 'positive',
    message: '✅ Reporte enviado',
    timeout: 2000
  })
}
</script>   