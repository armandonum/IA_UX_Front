<!-- components/findings/FindingContextModal.vue -->
<template>
  <q-dialog v-model="localOpen">
    <q-card style="min-width: 550px; max-width: 700px;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">🔍 Contexto del Hallazgo</div>
        <div class="text-subtitle2">Eventos relacionados en la línea de tiempo</div>
      </q-card-section>

      <q-card-section v-if="finding">
        <div class="q-gutter-y-md">
          <!-- Emociones -->
          <div v-if="finding.relatedEmotions?.length">
            <div class="text-subtitle2 text-grey-7">Emociones relacionadas</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="(em, i) in finding.relatedEmotions"
                :key="i"
                color="warning"
                text-color="white"
                size="sm"
              >
                {{ getEmotionLabel(em) }}
                <q-tooltip>
                  En {{ formatTime(getEmotionMs(em)) }}
                </q-tooltip>
              </q-chip>
            </div>
          </div>

          <!-- Sentimientos -->
          <div v-if="finding.relatedSentiments?.length">
            <div class="text-subtitle2 text-grey-7">Sentimientos relacionados</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="(s, i) in finding.relatedSentiments"
                :key="i"
                color="info"
                text-color="white"
                size="sm"
              >
                {{ s.uxLabel || s.sentiment }}
                <q-tooltip>
                  En {{ formatTime(s.elapsedMsTotal) }}
                </q-tooltip>
              </q-chip>
            </div>
          </div>

          <!-- Comentarios de usuario -->
          <div v-if="finding.relatedComments?.length">
            <div class="text-subtitle2 text-grey-7">Comentarios de usuario</div>
            <div
              v-for="(c, i) in finding.relatedComments"
              :key="i"
              class="bg-grey-1 q-pa-sm rounded-borders q-mt-xs"
            >
              <div class="text-caption">"{{ c.text }}"</div>
              <div class="text-caption text-grey-6">
                {{ formatTime(c.elapsedMsTotal) }}
              </div>
            </div>
          </div>

          <!-- Comentarios de experto -->
          <div v-if="finding.relatedExpertComments?.length">
            <div class="text-subtitle2 text-grey-7">Comentarios de experto</div>
            <div
              v-for="(ec, i) in finding.relatedExpertComments"
              :key="i"
              class="bg-primary/5 q-pa-sm rounded-borders q-mt-xs"
            >
              <div class="text-caption">"{{ ec.comment }}"</div>
              <div class="text-caption text-grey-6">
                {{ formatTime(ec.elapsedMsTotal) }}
              </div>
            </div>
          </div>

          <!-- Eventos -->
          <div v-if="finding.relatedEvents?.length">
            <div class="text-subtitle2 text-grey-7">Eventos de navegación</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="(ev, i) in finding.relatedEvents"
                :key="i"
                color="primary"
                text-color="white"
                size="sm"
              >
                {{ ev.event_type }}
                <q-tooltip>
                  En {{ formatTime(ev.elapsed_ms_total) }}
                </q-tooltip>
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cerrar" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GeneratedFinding } from '@/types/expert/findings.types'

const props = defineProps<{
  modelValue: boolean
  finding: GeneratedFinding | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const localOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function getEmotionLabel(em: any) {
  return em.emotion ?? em.label ?? em.dominantEmotion ?? 'N/A'
}

function getEmotionMs(em: any) {
  return em.elapsedMsTotal ?? em.elapsedMs ?? 0
}

function formatTime(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}
</script>