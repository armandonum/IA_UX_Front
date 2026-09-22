<!-- components/expert/cognitive/CognitiveAssignModal.vue -->
<template>
  <div
    class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8"
  >

    <!-- Header -->
    <div class="mb-8">

      <div class="flex items-center gap-4">

        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50"
        >
          <q-icon
            name="psychology"
            size="28px"
            color="primary"
          />
        </div>

        <div>
          <h2 class="text-2xl font-bold text-slate-900">
            Evaluaciones asignadas
          </h2>

          <p class="mt-1 text-sm text-slate-500">
            Selecciona una evaluación cognitiva para comenzar.
          </p>
        </div>

      </div>

    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex min-h-[280px] items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3">

        <q-spinner
          color="primary"
          size="42px"
        />

        <span class="text-sm text-slate-500">
          Cargando evaluaciones...
        </span>

      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="evaluations.length === 0"
      class="rounded-2xl border border-slate-200 px-6 py-12 text-center"
    >

      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50"
      >
        <q-icon
          name="assignment"
          size="32px"
          color="grey-7"
        />
      </div>

      <h3 class="mt-5 text-lg font-semibold text-slate-900">
        No hay evaluaciones asignadas
      </h3>

      <p
        class="mx-auto mt-2 max-w-md text-sm text-slate-500"
      >
        Actualmente no tienes evaluaciones cognitivas asignadas.
        Contacta al coordinador si necesitas una evaluación.
      </p>

    </div>

    <!-- Evaluations -->
    <div
      v-else
      class="grid grid-cols-1 gap-4 md:grid-cols-2"
    >

      <q-card
        v-for="evaluation in evaluations"
        :key="evaluation.cognitiveEvaluationId"
        flat
        class="group rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      >

        <q-card-section class="p-5">

          <!-- Top -->
          <div
            class="flex items-start justify-between gap-4"
          >

            <!-- Icon -->
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50"
            >
              <q-icon
                name="assignment"
                size="24px"
                color="primary"
              />
            </div>

            <!-- Status -->
            <q-badge
              v-if="evaluation.status === 'in_progress'"
              color="warning"
              outline
              rounded
            >
              <q-icon
                name="schedule"
                size="14px"
                class="mr-1"
              />

              En progreso
            </q-badge>

            <q-badge
              v-else
              color="info"
              outline
              rounded
            >
              <q-icon
                name="pending_actions"
                size="14px"
                class="mr-1"
              />

              Pendiente
            </q-badge>

          </div>

          <!-- Content -->
          <div class="mt-5">

            <h3
              class="text-lg font-semibold text-slate-900 transition-colors group-hover:text-primary"
            >
              {{ evaluation.name }}
            </h3>

            <p
              class="mt-2 min-h-[40px] text-sm leading-5 text-slate-600"
            >
              {{
                evaluation.description ||
                'Evaluación cognitiva asignada para su realización.'
              }}
            </p>

          </div>

          <!-- Metadata -->
          <div
            class="mt-5 flex items-center border-t border-slate-200 pt-4"
          >

            <div
              class="flex items-center gap-2 text-sm text-slate-500"
            >

              <q-icon
                name="task_alt"
                size="18px"
                color="primary"
              />

              <span>
                {{ evaluation.totalTasks || 0 }}
                {{
                  evaluation.totalTasks === 1
                    ? 'tarea'
                    : 'tareas'
                }}
              </span>

            </div>

          </div>

          <!-- Action -->
          <q-btn
            unelevated
            color="primary"
            icon="play_arrow"
            label="Comenzar evaluación"
            no-caps
            class="mt-5 w-full rounded-lg"
            @click="$emit('select', evaluation)"
          />

        </q-card-section>

      </q-card>

    </div>

  </div>
</template>

<script setup lang="ts">
defineProps<{
  evaluations: any[]
  loading?: boolean
}>()

defineEmits<{
  (e: 'select', evaluation: any): void
}>()
</script>