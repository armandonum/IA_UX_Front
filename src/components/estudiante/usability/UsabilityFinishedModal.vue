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
            : '🎉 ¡Evaluación completada!'
          }}
        </div>

        <div class="text-body2 text-grey-4 q-mt-sm">
          Tiempo: {{ tiempoFormateado }}
        </div>

        <div class="text-caption text-grey-5">
          {{ eventosRegistrados }} eventos
          • {{ lecturasEmocionRegistradas }} lecturas
        </div>

        <!-- 🔥 Botón para regresar -->
        <div v-if="!subiendoVideos" class="q-mt-md">
          <q-btn
            color="primary"
            unelevated
            icon="arrow_back"
            label="Volver a proyectos"
            @click="onCerrar"
            class="full-width"
            size="md"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps<{
  show: boolean
  subiendoVideos: boolean
  tiempoFormateado: string
  eventosRegistrados: number
  lecturasEmocionRegistradas: number
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
}>()

function onCerrar() {
  emit('cerrar')
  router.push({ name: 'estudiante' })
}
</script>