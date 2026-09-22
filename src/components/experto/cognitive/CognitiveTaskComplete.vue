<!-- components/expert/cognitive/CognitiveTaskComplete.vue -->
<template>
  <div class="flex w-full justify-center p-4 md:p-8">
    <q-card
      flat
      bordered
      class="w-full max-w-2xl border-slate-700"
    >
      <!-- Contenido -->
      <q-card-section class="q-pa-lg">
        <!-- Encabezado -->
        <div class="text-center">
          <q-icon
            name="check_circle"
            size="64px"
            color="positive"
          />

          <h3 class="q-mt-md text-2xl font-bold text-slate-100">
            Tarea Completada
          </h3>

          <p class="q-mt-1 text-sm text-slate-400">
            {{ task?.title || 'Tarea finalizada' }}
          </p>
        </div>

        <q-separator
          class="q-my-lg"
          color="grey-8"
        />

        <!-- Estadísticas -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">

          <!-- Tiempo -->
          <div
            class="rounded-lg border border-slate-700 p-4 text-center"
          >
            <q-icon
              name="timer"
              color="primary"
              size="24px"
            />

            <div class="q-mt-2 text-2xl font-bold text-primary">
              {{ tiempoFormateado }}
            </div>

            <div class="q-mt-1 text-xs text-slate-500">
              Tiempo empleado
            </div>
          </div>

          <!-- Eventos -->
          <div
            class="rounded-lg border border-slate-700 p-4 text-center"
          >
            <q-icon
              name="touch_app"
              color="info"
              size="24px"
            />

            <div class="q-mt-2 text-2xl font-bold text-info">
              {{ eventosRegistrados }}
            </div>

            <div class="q-mt-1 text-xs text-slate-500">
              Eventos registrados
            </div>
          </div>

          <!-- Emociones -->
          <div
            class="rounded-lg border border-slate-700 p-4 text-center"
          >
            <q-icon
              name="sentiment_satisfied"
              color="warning"
              size="24px"
            />

            <div class="q-mt-2 text-2xl font-bold text-warning">
              {{ lecturasEmocion }}
            </div>

            <div class="q-mt-1 text-xs text-slate-500">
              Lecturas de emoción
            </div>
          </div>

          <!-- Acciones -->
          <div
            class="rounded-lg border border-slate-700 p-4 text-center"
          >
            <q-icon
              name="task_alt"
              color="positive"
              size="24px"
            />

            <div class="q-mt-2 text-2xl font-bold text-positive">
              {{ getActionsCompleted() }}/{{ totalActions }}
            </div>

            <div class="q-mt-1 text-xs text-slate-500">
              Acciones completadas
            </div>
          </div>

        </div>
      </q-card-section>

      <!-- Acciones -->
      <q-card-actions
        class="q-pa-lg"
        align="center"
      >
        <!-- Siguiente tarea -->
        <q-btn
          v-if="quedanTareas"
          unelevated
          color="primary"
          icon="arrow_forward"
          label="Siguiente Tarea"
          class="full-width"
          size="lg"
          @click="$emit('continuar')"
        />

        <!-- Finalizar evaluación -->
        <q-btn
          v-else
          unelevated
          color="positive"
          icon="check"
          label="Finalizar Evaluación"
          class="full-width"
          size="lg"
          @click="$emit('continuar')"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  task: any
  tiempoFormateado: string
  eventosRegistrados: number
  lecturasEmocion: number
  quedanTareas: boolean
}>()

defineEmits<{
  (e: 'continuar'): void
}>()

/**
 * TODO:
 * Reemplazar por el cálculo real de acciones
 * completadas cuando se tenga esa información
 * disponible desde la sesión.
 */
const totalActions = 0

const getActionsCompleted = () => {
  return 0
}

</script>