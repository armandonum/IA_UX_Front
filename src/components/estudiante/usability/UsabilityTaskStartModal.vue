<!-- components/estudiante/usability/UsabilityTaskStartModal.vue -->
<template>
  <q-dialog :model-value="show" persistent>
    <q-card style="min-width: 520px; max-width: 90vw">
      <!-- Header -->
      <q-card-section class="bg-primary text-white">
        <div class="row items-center">
          <q-icon name="play_circle" size="32px" class="q-mr-sm" />
          <div class="col">
            <div class="text-h6">Iniciar Tarea</div>
            <div class="text-caption" style="opacity: 0.85">
              Revisa los dispositivos y permisos antes de comenzar
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

      <!-- ============================================================ -->
      <!-- SELECCIÓN DE DISPOSITIVOS                                    -->
      <!-- ============================================================ -->
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-subtitle2">
            🎥 Dispositivos seleccionados
          </div>
          <q-btn
            flat
            dense
            size="sm"
            color="primary"
            icon="tune"
            label="Cambiar"
            @click="showDeviceSelector = true"
            :disable="loadingStart"
          />
        </div>

        <q-list separator dense>
          <!-- Cámara -->
          <q-item>
            <q-item-section avatar>
              <q-avatar
                :color="deviceSelection ? 'primary' : 'grey-5'"
                text-color="white"
                size="32px"
              >
                <q-icon name="videocam" size="18px" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-6">
                Cámara
              </q-item-label>
              <q-item-label class="text-body2">
                {{
                  deviceSelection?.videoLabel ||
                  'Sin seleccionar — toca "Cambiar"'
                }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                :name="deviceSelection ? 'check_circle' : 'error'"
                :color="deviceSelection ? 'positive' : 'warning'"
                size="20px"
              />
            </q-item-section>
          </q-item>

          <!-- Micrófono -->
          <q-item>
            <q-item-section avatar>
              <q-avatar
                :color="deviceSelection ? 'primary' : 'grey-5'"
                text-color="white"
                size="32px"
              >
                <q-icon name="mic" size="18px" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-6">
                Micrófono
              </q-item-label>
              <q-item-label class="text-body2">
                {{
                  deviceSelection?.audioLabel ||
                  'Sin seleccionar — toca "Cambiar"'
                }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                :name="deviceSelection ? 'check_circle' : 'error'"
                :color="deviceSelection ? 'positive' : 'warning'"
                size="20px"
              />
            </q-item-section>
          </q-item>

          <!-- Pantalla -->
          <q-item>
            <q-item-section avatar>
              <q-avatar
                :color="pantallaLista ? 'positive' : isMobile ? 'grey-5' : 'warning'"
                text-color="white"
                size="32px"
              >
                <q-icon name="desktop_windows" size="18px" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-6">
                Pantalla
              </q-item-label>
              <q-item-label class="text-body2">
                <template v-if="isMobile">
                  No disponible en móvil
                </template>
                <template v-else-if="pantallaLista">
                  Permiso concedido
                </template>
                <template v-else>
                  Se pedirá al iniciar
                </template>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                :name="isMobile ? 'phone_android' : pantallaLista ? 'check_circle' : 'schedule'"
                :color="isMobile ? 'grey-6' : pantallaLista ? 'positive' : 'warning'"
                size="20px"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Banner si no hay dispositivos seleccionados -->
        <q-banner
          v-if="!deviceSelection"
          dense
          rounded
          class="bg-warning text-white q-mt-md"
        >
          <template v-slot:avatar>
            <q-icon name="warning" />
          </template>
          <div class="text-caption">
            Debes seleccionar cámara y micrófono antes de iniciar.
          </div>
        </q-banner>
      </q-card-section>

      <!-- ============================================================ -->
      <!-- PERMISOS                                                     -->
      <!-- ============================================================ -->
      <q-separator />

      <q-card-section>
        <div class="text-subtitle2 q-mb-md">Estado de los permisos</div>

        <q-list separator>
          <!-- Cámara -->
          <q-item>
            <q-item-section avatar>
              <q-avatar
                :color="camaraLista ? 'positive' : 'grey-5'"
                text-color="white"
              >
                <q-icon name="videocam" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>Cámara</q-item-label>
              <q-item-label caption>
                {{ camaraLista ? 'Permiso concedido' : 'Se pedirá al iniciar' }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                :name="camaraLista ? 'check_circle' : 'schedule'"
                :color="camaraLista ? 'positive' : 'grey-6'"
                size="24px"
              />
            </q-item-section>
          </q-item>

          <!-- Pantalla -->
          <q-item>
            <q-item-section avatar>
              <q-avatar
                :color="pantallaLista ? 'positive' : isMobile ? 'grey-5' : 'grey-5'"
                text-color="white"
              >
                <q-icon name="desktop_windows" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>Pantalla</q-item-label>
              <q-item-label caption>
                <template v-if="isMobile">
                  No disponible en móvil
                </template>
                <template v-else-if="pantallaLista">
                  Permiso concedido
                </template>
                <template v-else>
                  Se pedirá al iniciar
                </template>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                :name="
                  isMobile
                    ? 'phone_android'
                    : pantallaLista
                    ? 'check_circle'
                    : 'schedule'
                "
                :color="
                  isMobile
                    ? 'grey-6'
                    : pantallaLista
                    ? 'positive'
                    : 'grey-6'
                "
                size="24px"
              />
            </q-item-section>
          </q-item>

          <!-- Micrófono -->
          <q-item>
            <q-item-section avatar>
              <q-avatar
                :color="audioSoportado ? 'positive' : 'grey-5'"
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
                <template v-else-if="deviceSelection">
                  Listo ({{ deviceSelection.audioLabel }})
                </template>
                <template v-else>
                  Sin seleccionar
                </template>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                :name="audioSoportado ? 'check_circle' : 'info'"
                :color="audioSoportado ? 'positive' : 'grey-6'"
                size="24px"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Advertencia si falta algo crítico -->
        <q-banner
          v-if="!deviceSelection"
          dense
          rounded
          class="bg-warning text-white q-mt-md"
        >
          <template v-slot:avatar>
            <q-icon name="warning" />
          </template>
          <div class="text-caption">
            Selecciona cámara y micrófono para continuar.
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
            Tu navegador no soporta reconocimiento de voz. Puedes continuar,
            pero no se grabará la transcripción.
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
          :disable="!deviceSelection"
          @click="$emit('iniciar')"
        />
      </q-card-actions>
    </q-card>

    <!-- Modal selector de dispositivos -->
    <DeviceSelectorModal
      v-model="showDeviceSelector"
      @confirmed="onDevicesConfirmed"
      @cancelled="showDeviceSelector = false"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAudioRecorder } from '@/composables/useAudioRecorder'
import DeviceSelectorModal from './DeviceSelectorModal.vue'

interface DeviceSelection {
  videoDeviceId: string
  audioDeviceId: string
  videoLabel: string
  audioLabel: string
}

const props = defineProps<{
  show: boolean
  taskDescription: string
  camaraLista: boolean
  pantallaLista: boolean
  loadingStart: boolean
  deviceSelection?: DeviceSelection | null
}>()

const emit = defineEmits<{
  (e: 'iniciar'): void
  (e: 'cancelar'): void
  (
    e: 'devices-selected',
    selection: { videoDeviceId: string; audioDeviceId: string },
  ): void
}>()

const { isSupported: audioSoportado } = useAudioRecorder()

const showDeviceSelector = ref(false)
const isMobile = computed(() => /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))

// 🔥 Auto-abrir el selector si no hay dispositivos seleccionados
function onDialogOpen() {
  if (!props.deviceSelection) {
    showDeviceSelector.value = true
  }
}

// Escuchar cuando el modal padre se abre
import { watch } from 'vue'
watch(
  () => props.show,
  (val) => {
    if (val && !props.deviceSelection) {
      // Abrir el selector automáticamente
      setTimeout(() => {
        showDeviceSelector.value = true
      }, 300)
    }
  },
)

function onDevicesConfirmed(selection: {
  videoDeviceId: string
  audioDeviceId: string
}) {
  showDeviceSelector.value = false
  emit('devices-selected', selection)
}
</script>

<style scoped>
.bg-blue-1 {
  background-color: #e3f2fd;
}
</style>