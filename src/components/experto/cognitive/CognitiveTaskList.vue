<!-- components/expert/cognitive/CognitiveTaskList.vue -->
<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-4">

        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50"
        >
          <q-icon
            name="assignment"
            size="26px"
            color="primary"
          />
        </div>

        <div>
          <h2 class="text-2xl font-bold text-slate-900">
            Tareas de evaluación
          </h2>

          <p class="mt-1 text-sm text-slate-500">
            {{ evaluationName || 'Evaluación Cognitiva' }}
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
          Cargando tareas...
        </span>
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="tasks.length === 0"
      class="rounded-2xl border border-slate-200 px-6 py-12 text-center"
    >
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50"
      >
        <q-icon
          name="check_circle"
          size="34px"
          color="positive"
        />
      </div>

      <h3 class="mt-5 text-lg font-semibold text-slate-900">
        ¡Todas las tareas completadas!
      </h3>

      <p class="mt-2 text-sm text-slate-500">
        Has completado todas las tareas disponibles para esta evaluación.
      </p>
    </div>

    <!-- Tasks -->
    <div
      v-else
      class="grid gap-4"
    >

      <q-card
        v-for="task in tasks"
        :key="task.id"
        flat
        class="group rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-blue-200 hover:shadow-md"
        :class="{
          'border-green-200': isCompleted(task.id)
        }"
      >
        <q-card-section class="p-5">

          <div class="flex items-start justify-between gap-4">

            <!-- Task information -->
            <div class="flex min-w-0 items-start gap-4">

              <!-- Status icon -->
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                :class="
                  isCompleted(task.id)
                    ? 'bg-green-50'
                    : 'bg-amber-50'
                "
              >
                <q-icon
                  :name="
                    isCompleted(task.id)
                      ? 'check_circle'
                      : 'pending'
                  "
                  :color="
                    isCompleted(task.id)
                      ? 'positive'
                      : 'warning'
                  "
                  size="23px"
                />
              </div>

              <!-- Content -->
              <div class="min-w-0">

                <div class="flex flex-wrap items-center gap-2">

                  <h3
                    class="font-semibold text-slate-900"
                  >
                    {{ task.title }}
                  </h3>

                  <q-badge
                    v-if="isCompleted(task.id)"
                    color="positive"
                    outline
                  >
                    Completada
                  </q-badge>

                </div>

                <p
                  v-if="task.description"
                  class="mt-1 text-sm leading-5 text-slate-600"
                >
                  {{ task.description }}
                </p>

                <p
                  v-if="task.userGoal"
                  class="mt-2 flex items-start gap-1 text-xs text-slate-500"
                >
                  <q-icon
                    name="flag"
                    size="15px"
                  />

                  <span>
                    {{ task.userGoal }}
                  </span>
                </p>

              </div>

            </div>

            <!-- Actions -->
            <div class="flex shrink-0 items-center gap-2">

              <q-badge
                v-if="!isCompleted(task.id)"
                color="primary"
                outline
              >
                {{ task.actionsCount || 0 }}
                {{ task.actionsCount === 1 ? 'acción' : 'acciones' }}
              </q-badge>

              <q-btn
                :color="
                  isCompleted(task.id)
                    ? 'grey'
                    : 'primary'
                "
                :label="
                  isCompleted(task.id)
                    ? 'Completada'
                    : 'Iniciar'
                "
                :disable="isCompleted(task.id)"
                unelevated
                no-caps
                size="sm"
                icon="play_arrow"
                @click.stop="selectTask(task)"
              />

            </div>

          </div>

        </q-card-section>
      </q-card>

    </div>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  tasks: any[]
  completedTaskIds: Set<string>
  loading?: boolean
  evaluationName?: string
}>()

const emit = defineEmits<{
  (e: 'select', task: any): void
}>()

const isCompleted = (taskId: string) => {
  return props.completedTaskIds.has(taskId)
}

const selectTask = (task: any) => {
  if (isCompleted(task.id)) return

  emit('select', task)
}
</script>