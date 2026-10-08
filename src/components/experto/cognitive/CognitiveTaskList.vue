<!-- components/experto/cognitive/CognitiveTaskList.vue -->
<template>
  <div class="q-pa-lg">
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <q-btn
          flat
          dense
          color="primary"
          icon="arrow_back"
          label="Cambiar evaluación"
          class="q-mb-xs"
          @click="$emit('back')"
        />
        <div class="text-h5 text-weight-bold">
          📋 Tareas de la Evaluación
        </div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          {{ evaluationName || 'Evaluación Cognitiva' }}
        </div>
      </div>

      <div class="text-right">
        <q-chip color="primary" text-color="white" :label="`${tasks.length} tareas`" />
        <q-chip
          v-if="completedCount > 0"
          color="positive"
          text-color="white"
          :label="`${completedCount} completadas`"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- DISPOSITIVOS                                                  -->
    <!-- ============================================================ -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <div>
            <div class="text-subtitle2 text-weight-bold">
              🎥 Dispositivos de grabación
            </div>
            <div class="text-caption text-grey-6">
              Selecciona cámara y micrófono antes de comenzar
            </div>
          </div>

          <q-btn
            unelevated
            color="primary"
            icon="tune"
            label="Seleccionar dispositivos"
            @click="showDeviceSelector = true"
          />
        </div>

        <!-- Info de dispositivos seleccionados -->
        <div v-if="selectedDevices" class="row q-mt-sm q-gutter-md">
          <q-chip
            color="positive"
            text-color="white"
            icon="videocam"
            :label="selectedDevices.videoLabel"
          />
          <q-chip
            color="positive"
            text-color="white"
            icon="mic"
            :label="selectedDevices.audioLabel"
          />
        </div>

        <q-banner
          v-else
          dense
          rounded
          class="bg-orange-1 text-orange-10 q-mt-sm"
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>
          <div class="text-caption">
            Debes seleccionar los dispositivos antes de iniciar una tarea.
          </div>
        </q-banner>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- LOADING                                                       -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando tareas...</div>
    </div>

    <!-- ============================================================ -->
    <!-- EMPTY                                                         -->
    <!-- ============================================================ -->
    <q-card
      v-else-if="!tasks.length"
      flat
      bordered
      class="text-center q-pa-xl"
    >
      <q-icon name="check_circle" size="64px" color="positive" />
      <div class="text-h6 text-grey-7 q-mt-md">
        ¡Todas las tareas completadas!
      </div>
      <div class="text-caption text-grey-6 q-mt-xs">
        Has completado todas las tareas de esta evaluación
      </div>
    </q-card>

    <!-- ============================================================ -->
    <!-- LISTA DE TAREAS                                               -->
    <!-- ============================================================ -->
    <div v-else class="q-gutter-y-md">
      <q-card
        v-for="(task, index) in sortedTasks"
        :key="task.id"
        flat
        bordered
        class="task-card"
        :class="{ 'task-completed': isCompleted(task.id) }"
      >
        <q-card-section>
          <div class="row items-start no-wrap q-gutter-md">
            <!-- Número -->
            <q-avatar
              :color="isCompleted(task.id) ? 'positive' : 'primary'"
              text-color="white"
              size="40px"
            >
              <q-icon
                :name="isCompleted(task.id) ? 'check' : 'assignment'"
                size="20px"
              />
            </q-avatar>

            <!-- Contenido -->
            <div class="col">
              <div class="row items-center q-gutter-xs q-mb-xs">
                <div class="text-subtitle1 text-weight-bold">
                  {{ index + 1 }}. {{ task.title }}
                </div>
                <q-badge
                  v-if="isCompleted(task.id)"
                  color="positive"
                  text-color="white"
                  label="Completada"
                />
              </div>

              <div
                v-if="task.description"
                class="text-body2 text-grey-7 q-mb-xs"
              >
                {{ task.description }}
              </div>

              <div
                v-if="task.userGoal"
                class="row items-center text-caption text-grey-6 q-mt-xs"
              >
                <q-icon name="flag" size="14px" class="q-mr-xs" />
                <span><strong>Meta:</strong> {{ task.userGoal }}</span>
              </div>

              <!-- Info adicional -->
              <div class="row items-center q-gutter-md text-caption text-grey-6 q-mt-sm">
                <div class="row items-center">
                  <q-icon name="list_alt" size="14px" class="q-mr-xs" />
                  {{ getTaskActionsCount(task.id) }} acciones del flujo ideal
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="column items-end q-gutter-xs">
              <q-btn
                v-if="!isCompleted(task.id)"
                unelevated
                color="primary"
                icon="play_arrow"
                label="Iniciar"
                size="sm"
                :disable="!selectedDevices"
                @click="onSelectTask(task)"
              >
                <q-tooltip v-if="!selectedDevices">
                  Selecciona los dispositivos primero
                </q-tooltip>
              </q-btn>

              <q-btn
                v-else
                flat
                color="positive"
                icon="check_circle"
                label="Completada"
                size="sm"
                disable
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL DE DISPOSITIVOS                                         -->
    <!-- ============================================================ -->
    <DeviceSelectorModal
      v-model="showDeviceSelector"
      @confirmed="onDevicesConfirmed"
      @cancelled="showDeviceSelector = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import DeviceSelectorModal from '@/components/estudiante/usability/DeviceSelectorModal.vue'

// ============================================================
// TIPOS
// ============================================================
interface DeviceSelection {
  videoDeviceId: string
  audioDeviceId: string
  videoLabel: string
  audioLabel: string
}

// ============================================================
// PROPS & EMITS
// ============================================================
const props = defineProps<{
  tasks: any[]
  completedTaskIds?: Set<string> | string[]
  loading?: boolean
  evaluationName?: string
  deviceSelection?: DeviceSelection | null
}>()

const emit = defineEmits<{
  (e: 'select', task: any): void
  (e: 'back'): void
  (e: 'devices-selected', selection: { videoDeviceId: string; audioDeviceId: string }): void
}>()

const $q = useQuasar()

// ============================================================
// STATE
// ============================================================
const showDeviceSelector = ref(false)
const selectedDevices = ref<DeviceSelection | null>(props.deviceSelection ?? null)

// ============================================================
// COMPUTED
// ============================================================
const sortedTasks = computed(() =>
  [...props.tasks].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
)

const completedCount = computed(() => {
  if (!props.completedTaskIds) return 0
  const ids = Array.isArray(props.completedTaskIds)
    ? props.completedTaskIds
    : Array.from(props.completedTaskIds)
  return ids.length
})

// ============================================================
// HELPERS
// ============================================================
function isCompleted(taskId: string): boolean {
  if (!props.completedTaskIds) return false
  if (Array.isArray(props.completedTaskIds)) {
    return props.completedTaskIds.includes(taskId)
  }
  return props.completedTaskIds.has(taskId)
}

function getTaskActionsCount(taskId: string): number {
  // TODO: Si tienes la data de acciones por tarea, muéstrala aquí
  return 0
}

// ============================================================
// ACTIONS
// ============================================================
function onSelectTask(task: any) {
  if (!selectedDevices.value) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona los dispositivos primero',
      icon: 'warning',
    })
    showDeviceSelector.value = true
    return
  }
  emit('select', task)
}

function onDevicesConfirmed(selection: {
  videoDeviceId: string
  audioDeviceId: string
}) {
  // Buscar labels — el DeviceSelectorModal ya los debería enviar,
  // pero por si acaso, pedimos los labels via emit
  selectedDevices.value = {
    videoDeviceId: selection.videoDeviceId,
    audioDeviceId: selection.audioDeviceId,
    videoLabel: 'Cámara',
    audioLabel: 'Micrófono',
  }
  showDeviceSelector.value = false
  emit('devices-selected', selection)

  $q.notify({
    type: 'positive',
    message: 'Dispositivos seleccionados',
    icon: 'check_circle',
  })
}

// ============================================================
// EXPOSE (para que el padre pueda resetear)
// ============================================================
defineExpose({
  selectedDevices,
})
</script>

<style scoped>
.task-card {
  transition: all 0.2s ease;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
}

.task-completed {
  border-left: 4px solid #22c55e;
  background: #f0fdf4;
}
</style>