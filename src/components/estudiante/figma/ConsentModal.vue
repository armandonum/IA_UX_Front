<template>
  <q-dialog :model-value="show" persistent>
    <q-card>
      <q-card-section>

        <div class="text-overline text-primary">
          Antes de empezar
        </div>

        <div class="text-h5 text-weight-bold q-mt-sm">
          Esta prueba grabará tu pantalla y tu cámara
        </div>

        <div class="text-body2 text-thirth q-mt-md">

          Durante el recorrido se grabará tu pantalla,
          tu rostro mediante la cámara y se analizarán
          las expresiones faciales para inferir emociones.

          Toda la información será utilizada únicamente
          con fines de investigación de usabilidad.

        </div>

      </q-card-section>

      <q-separator dark />

      <q-card-section>

        <q-checkbox
          :model-value="consentChecked"
          color="primary"
          @update:model-value="$emit('update:consentChecked', $event)"
        >
          <div class="text-body2">
            Entiendo y autorizo la grabación de mi pantalla y cámara.
          </div>
        </q-checkbox>

        <q-banner
          v-if="permissionsError"
          dense
          rounded
          class="bg-negative text-white q-mt-md"
        >
          {{ permissionsError }}
        </q-banner>

      </q-card-section>

      <q-card-actions align="right">

        <q-btn
          color="primary"
          unelevated
          icon="arrow_forward"
          label="Continuar"
          :loading="loadingPermissions"
          :disable="!consentChecked"
          @click="$emit('continuar')"
        />

      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  consentChecked: boolean
  loadingPermissions: boolean
  permissionsError: string | null
}>()

defineEmits<{
  (e: 'update:consentChecked', value: boolean): void
  (e: 'continuar'): void
}>()
</script>