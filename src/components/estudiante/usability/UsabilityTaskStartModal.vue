<template>
  <q-dialog :model-value="show" persistent>
    <q-card style="min-width: 480px; max-width: 90vw">
      <!-- Header -->
      <q-card-section class="bg-primary text-white">
        <div class="row items-center">
          <q-icon name="play_circle" size="32px" class="q-mr-sm" />
          <div class="col">
            <div class="text-h6">Iniciar Tarea</div>
            <div class="text-caption" style="opacity: 0.85">
              Revisa los permisos antes de comenzar
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Descripción de la tarea -->
      <q-card-section>
        <div class="text-caption text-grey-6 q-mb-xs">Tarea a realizar</div>
        <div class="text-body2 text-weight-medium">
          {{ taskDescription || 'Sin descripción' }}
        </div>
      </q-card-section>

      <q-separator />

      <!-- Estado de permisos -->
      <q-card-section>
        <div class="text-subtitle2 q-mb-md">Estado de los permisos</div>

        <q-list separator>
          <!-- Cámara -->
          <q-item>
            <q-item-section avatar>
              <q-avatar :color="camaraLista ? 'positive' : 'grey-5'" text-color="white">
                <q-icon name="videocam" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>Cámara</q-item-label>
              <q-item-label caption>
                {{ camaraLista ? 'Permiso concedido' : 'Sin permiso' }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                :name="camaraLista ? 'check_circle' : 'cancel'"
                :color="camaraLista ? 'positive' : 'negative'"
                size="24px"
              />
            </q-item-section>
          </q-item>

          <!-- Pantalla -->
          <q-item>
            <q-item-section avatar>
              <q-avatar :color="pantallaLista ? 'positive' : 'grey-5'" text-color="white">
                <q-icon name="desktop_windows" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>Pantalla</q-item-label>
              <q-item-label caption>
                {{ pantallaLista ? 'Permiso concedido' : 'Sin permiso' }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                :name="pantallaLista ? 'check_circle' : 'cancel'"
                :color="pantallaLista ? 'positive' : 'negative'"
                size="24px"
              />
            </q-item-section>
          </q-item>

          <!-- Micrófono -->
          <q-item>
            <q-item-section avatar>
              <q-avatar
                :color="audioSoportado ? (audioListo ? 'positive' : 'warning') : 'grey-5'"
                text-color="white"
              >
                <q-icon name="mic" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>Micrófono</q-item-label>
              <q-item-label caption>
                <template v-if="!audioSoportado">
                  No soportado por el navegador
                </template>
                <template v-else-if="audioListo">
                  Permiso concedido
                </template>
                <template v-else>
                  Sin permiso
                </template>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                :name="audioSoportado ? (audioListo ? 'check_circle' : 'warning') : 'info'"
                :color="audioSoportado ? (audioListo ? 'positive' : 'warning') : 'grey-6'"
                size="24px"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Advertencia si falta algo crítico -->
        <q-banner
          v-if="!camaraLista || !pantallaLista"
          dense
          rounded
          class="bg-warning text-white q-mt-md"
        >
          <template v-slot:avatar>
            <q-icon name="warning" />
          </template>
          <div class="text-caption">
            Se requiere cámara y pantalla para iniciar la tarea.
          </div>
        </q-banner>

        <!-- Info si el audio no está soportado -->
        <q-banner
          v-else-if="!audioSoportado"
          dense
          rounded
          class="bg-blue-1 text-primary q-mt-md"
        >
          <template v-slot:avatar>
            <q-icon name="info" />
          </template>
          <div class="text-caption">
            Tu navegador no soporta reconocimiento de voz.
            Puedes continuar, pero no se grabará la transcripción.
            <br />
            <strong>Recomendado: Chrome, Edge o Brave.</strong>
          </div>
        </q-banner>
      </q-card-section>

      <q-separator />

      <!-- Acciones -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          label="Cancelar"
          icon="close"
          color="grey-7"
          @click="$emit('cancelar')"
        />
        <q-btn
          unelevated
          color="primary"
          icon="play_arrow"
          label="Iniciar Tarea"
          :loading="loadingStart"
          :disable="!camaraLista || !pantallaLista"
          @click="$emit('iniciar')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAudioRecorder } from '@/composables/useAudioRecorder'

defineProps<{
  show: boolean
  taskDescription: string
  camaraLista: boolean
  pantallaLista: boolean
  loadingStart: boolean
}>()

defineEmits<{
  (e: 'iniciar'): void
  (e: 'cancelar'): void
}>()

// Detectar soporte de audio
const { isSupported: audioSoportado, isRecording } = useAudioRecorder()
const audioListo = computed(() => audioSoportado.value && !isRecording.value)
</script>

<style scoped>
.bg-blue-1 {
  background-color: #e3f2fd;
}
</style>