<!-- views/roles/estudiante/components/UsabilityTaskStartModal.vue -->

<template>
  <q-dialog :model-value="show" persistent>
    <q-card>
      <q-card-section>
        <div class="text-overline text-primary">
          Prueba de Usabilidad
        </div>
        <div class="text-h5 text-weight-bold q-mt-sm">
          Tu tarea
        </div>
        <div class="text-body1 q-mt-md">
          {{ taskDescription }}
        </div>
      </q-card-section>

      <q-separator dark />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col">
            <q-chip
              :color="camaraLista ? 'positive' : 'grey-7'"
              text-color="white"
              icon="videocam"
            >
              Cámara
            </q-chip>
          </div>
          <div class="col">
            <q-chip
              :color="pantallaLista ? 'positive' : 'grey-7'"
              text-color="white"
              icon="desktop_windows"
            >
              Pantalla
            </q-chip>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="primary"
          icon="play_arrow"
          unelevated
          label="Iniciar recorrido"
          :loading="loadingStart"
          @click="$emit('iniciar')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  taskDescription: string
  camaraLista: boolean
  pantallaLista: boolean
  loadingStart: boolean
}>()

defineEmits<{
  (e: 'iniciar'): void
}>()
</script>