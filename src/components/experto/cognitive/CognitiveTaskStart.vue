<!-- components/expert/cognitive/CognitiveTaskStart.vue -->
<template>
  <div
    class="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6"
  >

    <q-card
      flat
      class="rounded-2xl border border-slate-200 bg-white"
    >

      <q-card-section class="p-6 sm:p-8">

        <!-- Header -->
        <div class="text-center">

          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50"
          >
            <q-icon
              name="play_arrow"
              size="32px"
              color="primary"
            />
          </div>

          <h3
            class="mt-4 text-xl font-bold text-slate-900"
          >
            {{ task?.title || 'Preparando tarea...' }}
          </h3>

          <p
            v-if="task?.description"
            class="mt-2 text-sm leading-5 text-slate-600"
          >
            {{ task.description }}
          </p>

        </div>

        <q-separator class="my-6" />

        <!-- Requirements -->
        <div class="space-y-4">

          <!-- Camera -->
          <div
            class="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
          >

            <q-icon
              :name="
                camaraLista
                  ? 'check_circle'
                  : 'pending'
              "
              :color="
                camaraLista
                  ? 'positive'
                  : 'warning'
              "
              size="22px"
            />

            <div class="flex-1">

              <div
                class="text-sm font-medium text-slate-800"
              >
                Cámara
              </div>

              <div class="text-xs text-slate-500">
                {{
                  camaraLista
                    ? 'Conectada'
                    : 'Conectando...'
                }}
              </div>

            </div>

          </div>

          <!-- Screen -->
          <div
            class="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
          >

            <q-icon
              :name="
                pantallaLista
                  ? 'check_circle'
                  : 'pending'
              "
              :color="
                pantallaLista
                  ? 'positive'
                  : 'warning'
              "
              size="22px"
            />

            <div class="flex-1">

              <div
                class="text-sm font-medium text-slate-800"
              >
                Pantalla
              </div>

              <div class="text-xs text-slate-500">
                {{
                  pantallaLista
                    ? 'Conectada'
                    : 'Conectando...'
                }}
              </div>

            </div>

          </div>

          <!-- Audio -->
          <div
            class="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
          >

            <q-icon
              name="mic"
              color="info"
              size="22px"
            />

            <div class="flex-1">

              <div
                class="text-sm font-medium text-slate-800"
              >
                Audio
              </div>

              <div class="text-xs text-slate-500">
                Grabando en segundo plano
              </div>

            </div>

          </div>

        </div>

        <!-- Ideal Flow -->
        <div
          v-if="flowClicks.length > 0"
          class="mt-6 rounded-xl border border-blue-200 bg-blue-50/50 p-4"
        >

          <div
            class="flex items-center gap-2 text-sm font-semibold text-blue-700"
          >

            <q-icon
              name="account_tree"
              size="18px"
            />

            Flujo ideal

          </div>

          <div
            class="mt-1 text-xs text-slate-600"
          >
            {{ flowClicks.length }}
            pasos recomendados para completar esta tarea.
          </div>

          <div
            class="mt-3 flex flex-wrap gap-1"
          >

            <q-badge
              v-for="(click, index) in flowClicks.slice(0, 5)"
              :key="click.clickId"
              color="info"
              outline
              class="px-2 py-1"
            >
              {{ index + 1 }}.
              {{ truncateText(click.nodeId, 20) }}
            </q-badge>

            <q-badge
              v-if="flowClicks.length > 5"
              color="grey"
              outline
              class="px-2 py-1"
            >
              +{{ flowClicks.length - 5 }} más
            </q-badge>

          </div>

        </div>

      </q-card-section>

      <!-- Action -->
      <q-card-actions class="border-t border-slate-200 p-6">

        <q-btn
          color="primary"
          icon="play_arrow"
          label="Iniciar recorrido"
          unelevated
          no-caps
          class="w-full"
          size="lg"
          :loading="loading"
          :disable="
            !camaraLista ||
            !pantallaLista
          "
          @click="$emit('iniciar')"
        />

      </q-card-actions>

    </q-card>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  task: any
  camaraLista: boolean
  pantallaLista: boolean
  loading?: boolean
  flowClicks?: any[]
}>()

defineEmits<{
  (e: 'iniciar'): void
}>()

const truncateText = (
  text: string,
  maxLength: number,
) => {
  if (!text) return ''

  return text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text
}
</script>