<template>
  <q-dialog :model-value="show" persistent>
    <q-card style="min-width: 450px; max-width: 90vw; border-radius: 18px">
      <q-card-section class="text-center q-pa-lg">
        <q-icon name="check_circle" color="positive" size="64px" />
        <div class="text-h5 text-weight-bold q-mt-lg">¡Evaluación completada!</div>
        <div class="text-body2 text-grey-7 q-mt-md">
          Tiempo total: <strong>{{ tiempo }}</strong>
        </div>

        <q-separator class="q-my-md" />

        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-card flat bordered>
              <q-card-section class="text-center q-py-sm">
                <div class="text-caption text-grey-6">Eventos</div>
                <div class="text-h6 text-primary">{{ eventos }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat bordered>
              <q-card-section class="text-center q-py-sm">
                <div class="text-caption text-grey-6">Lecturas de emociones</div>
                <div class="text-h6 text-info">{{ lecturas }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="q-mt-md">
          <q-card flat bordered class="bg-blue-1">
            <q-card-section class="text-center q-py-sm">
              <div class="text-caption text-grey-7">Observaciones registradas</div>
              <div class="text-h5 text-primary text-weight-bold">{{ observaciones }}</div>
            </q-card-section>
          </q-card>
        </div>

        <q-btn
          unelevated
          color="primary"
          icon="arrow_forward"
          label="Volver al inicio"
          class="q-mt-lg full-width"
          @click="$emit('close')"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  tiempo: string
  eventos: number
  lecturas: number
  observaciones: number
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.bg-blue-1 {
  background-color: #e3f2fd;
}
</style>