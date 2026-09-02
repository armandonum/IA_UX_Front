<!-- components/experto/heuristic/HeuristicConsentModal.vue -->

<template>
  <q-dialog :model-value="show" persistent>
    <q-card>
      <q-card-section>
        <div class="text-overline text-primary">Evaluación Heurística</div>
        <div class="text-h5 text-weight-bold q-mt-sm">
          Esta evaluación grabará tu pantalla y cámara
        </div>
        <div class="text-body2 text-grey-7 q-mt-md">
          Durante la evaluación se grabará tu pantalla, tu rostro mediante la cámara
          y se analizarán las expresiones faciales para inferir emociones.
          <br /><br />
          La información será utilizada para mejorar la usabilidad del prototipo.
        </div>
      </q-card-section>

      <q-separator dark />

      <q-card-section>
        <q-checkbox
          :model-value="checked"
          color="primary"
          @update:model-value="$emit('update:checked', $event)"
        >
          <div class="text-body2">
            Entiendo y autorizo la grabación de mi pantalla y cámara.
          </div>
        </q-checkbox>
        <q-banner v-if="error" dense rounded class="bg-negative text-white q-mt-md">
          {{ error }}
        </q-banner>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="primary"
          unelevated
          icon="arrow_forward"
          label="Continuar"
          :loading="loading"
          :disable="!checked"
          @click="$emit('continuar')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  checked: boolean
  loading: boolean
  error: string | null
}>()

defineEmits<{
  (e: 'update:checked', value: boolean): void
  (e: 'continuar'): void
}>()
</script>   