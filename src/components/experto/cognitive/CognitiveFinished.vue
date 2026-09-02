<!-- components/expert/cognitive/CognitiveFinished.vue -->
<template>
  <div class="flex w-full justify-center p-4 md:p-8">
    <q-card
      flat
      bordered
      class="w-full max-w-2xl border-slate-700"
    >
      <q-card-section class="q-pa-lg">

        <!-- Encabezado -->
        <div class="text-center">
          <q-icon
            name="emoji_events"
            size="64px"
            color="warning"
          />

          <h3 class="q-mt-md text-2xl font-bold text-slate-100">
            Evaluación Cognitiva Completada
          </h3>

          <p class="q-mt-1 text-sm text-slate-400">
            Has finalizado todas las tareas de la evaluación
          </p>
        </div>

        <q-separator
          class="q-my-lg"
          color="grey-8"
        />

        <!-- Estadísticas -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">

          <!-- Tareas -->
          <div
            class="rounded-lg border border-slate-700 p-4 text-center"
          >
            <q-icon
              name="task_alt"
              color="primary"
              size="24px"
            />

            <div class="q-mt-2 text-2xl font-bold text-primary">
              {{ totalTareas }}
            </div>

            <div class="q-mt-1 text-xs text-slate-500">
              Tareas completadas
            </div>
          </div>

          <!-- Tiempo -->
          <div
            class="rounded-lg border border-slate-700 p-4 text-center"
          >
            <q-icon
              name="timer"
              color="info"
              size="24px"
            />

            <div class="q-mt-2 text-2xl font-bold text-info">
              {{ tiempoTotal }}
            </div>

            <div class="q-mt-1 text-xs text-slate-500">
              Tiempo total
            </div>
          </div>

          <!-- Eventos -->
          <div
            class="rounded-lg border border-slate-700 p-4 text-center"
          >
            <q-icon
              name="touch_app"
              color="warning"
              size="24px"
            />

            <div class="q-mt-2 text-2xl font-bold text-warning">
              {{ eventosTotales }}
            </div>

            <div class="q-mt-1 text-xs text-slate-500">
              Eventos registrados
            </div>
          </div>

        </div>

        <!-- Mensaje final -->
        <div
          class="q-mt-lg rounded-lg border border-positive/30 p-4 text-center"
        >
          <div class="flex items-center justify-center gap-2">
            <q-icon
              name="check_circle"
              color="positive"
              size="22px"
            />

            <p class="text-sm text-slate-300">
              Gracias por completar la evaluación.
              Tus respuestas han sido registradas.
            </p>
          </div>
        </div>

      </q-card-section>

      <!-- Acción -->
      <q-card-actions
        class="q-pa-lg"
        align="center"
      >
        <q-btn
          unelevated
          color="primary"
          icon="dashboard"
          label="Volver al Dashboard"
          class="full-width"
          size="lg"
          @click="router.push('/dashboard')"
        />
      </q-card-actions>

    </q-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

defineProps<{
  totalTareas: number
  tiempoTotal: string
  eventosTotales: number
}>()
</script>