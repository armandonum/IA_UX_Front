<!-- views/roles/estudiante/components/UsabilityTaskCompleteModal.vue -->

<template>
  <q-dialog :model-value="show" persistent>
    <q-card dark class="bg-dark" style="width:450px;border-radius:18px;">
      <q-card-section class="text-center">
        <q-spinner
          v-if="subiendoVideos"
          color="primary"
          size="48px"
        />
        <q-icon
          v-else
          name="check_circle"
          color="positive"
          size="54px"
        />

        <div class="text-h6 q-mt-lg">
          {{
            subiendoVideos
            ? 'Guardando grabaciones...'
            : '✅ Tarea completada'
          }}
        </div>

        <div class="text-body2 text-grey-4 q-mt-sm">
          Tiempo: {{ tiempoFormateado }}
        </div>

        <div class="text-caption text-grey-5">
          {{ eventosRegistrados }} eventos
          • {{ lecturasEmocionRegistradas }} lecturas
        </div>

        <div v-if="!subiendoVideos" class="q-mt-md">
          <div v-if="quedanTareas" class="text-green-400 text-sm">
            ✅ Tarea completada. ¿Listo para la siguiente?
          </div>
          <div v-else class="text-blue-400 text-sm">
            🎉 ¡Todas las tareas completadas!
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="center" v-if="!subiendoVideos">
        <q-btn
          color="primary"
          unelevated
          :label="quedanTareas ? 'Siguiente tarea →' : 'Ver resultados'"
          @click="$emit('continuar')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  subiendoVideos: boolean
  tiempoFormateado: string
  eventosRegistrados: number
  lecturasEmocionRegistradas: number
  quedanTareas: boolean
}>()

defineEmits<{
  (e: 'continuar'): void
}>()
</script>