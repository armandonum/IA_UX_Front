<template>
  <div>
    <div class="text-h6 text-weight-bold text-grey-9 q-mb-md">Flujos</div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-select
          v-model="selectedProject"
          filled
          :options="store.projects"
          option-label="projectName"
          option-value="projectId"
          label="Proyecto"
          emit-value
          map-options
          @update:model-value="onProjectChange"
        />
      </div>

      <div class="col-12 col-md-4">
        <q-select
          v-model="selectedRequirement"
          filled
          :options="store.requirements"
          option-label="title"
          option-value="requirementId"
          label="Requerimiento"
          emit-value
          map-options
          :disable="!selectedProject"
          @update:model-value="onRequirementChange"
        />
      </div>

      <div class="col-12 col-md-4">
        <q-select
          v-model="selectedTask"
          filled
          :options="store.tasks"
          option-label="title"
          option-value="taskId"
          label="Tarea"
          emit-value
          map-options
          :disable="!selectedRequirement"
          @update:model-value="onTaskChange"
        />
      </div>

      <div class="col-12 col-md-auto flex items-end">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nuevo flujo"
          :disable="!selectedTask"
          @click="dialogOpen = true"
        />
      </div>
    </div>

<!-- Lista de flujos de la tarea seleccionada -->
  <div v-if="selectedTask" class="q-gutter-md">
    <q-card 
      v-for="flow in flowsForSelectedTask" 
      :key="flow.flowId" 
      flat bordered 
      class="q-pa-md"
    >
      <div class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-medium">{{ flow.name }}</div>
          <q-badge :color="flow.status === 'finished' ? 'positive' : 'orange'">
            {{ flow.status === 'finished' ? 'Completado' : 'En progreso' }}
          </q-badge>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            v-if="flow.status === 'finished'"
            flat dense color="primary" icon="list_alt"
            label="Ver registros"
            @click="abrirRegistros(flow)"
          />
          <q-btn
            v-else
            flat dense color="secondary" icon="play_arrow"
            label="Continuar registrando"
            @click="abrirPrototipo(flow)"
          />
          <q-btn
            flat dense round color="negative" icon="delete"
            @click="confirmDeleteFlow(flow)"
          />
        </div>
      </div>
    </q-card>

    <!-- ✅ CAMBIO: usar flowsForSelectedTask.length -->
    <div v-if="!flowsForSelectedTask.length" class="text-grey-6">
      Esta tarea todavía no tiene flujos creados.
    </div>
  </div>
  <div v-else class="text-grey-6">
    Selecciona un proyecto, un requerimiento y una tarea para ver sus flujos.
  </div>

    <!-- Dialog: crear flujo (solo nombre) -->
    <q-dialog v-model="dialogOpen">
      <q-card style="width: 420px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Nuevo flujo</div>
          <div class="text-caption text-grey-6">
            Al crear el flujo se abrirá el prototipo y se registrará cada click
            que hagas, en orden, hasta que presiones "Terminar flujo".
          </div>
        </q-card-section>

        <q-form @submit.prevent="onCreateFlow">
          <q-card-section>
            <q-input v-model="flowForm.name" filled label="Nombre del flujo" :rules="[required]" autofocus />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" @click="dialogOpen = false" />
            <q-btn unelevated color="primary" type="submit" label="Crear e iniciar" :loading="creatingFlow" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Dialog: prototipo + registro de clicks -->
    <q-dialog v-model="prototipoDialogOpen" full-width persistent>
      <q-card>
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">{{ flowActivo?.name }}</div>
            <div class="text-caption text-grey-6">
              {{ tracker.clickCount.value }} click(s) registrado(s)
            </div>
          </div>
          <q-btn
            unelevated color="positive" icon="check"
            label="Terminar flujo"
            :loading="finishingFlow"
            @click="onTerminarFlujo"
          />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <iframe
            :src="figmaEmbedUrl"
            width="100%"
            height="620"
            allowfullscreen
            style="border: none; border-radius: 8px;"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog: ver registros de clicks de un flujo terminado -->
    <q-dialog v-model="registrosDialogOpen" full-width>
      <q-card>
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Registros de "{{ flowParaVer?.name }}"</div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-table
            flat bordered
            :rows="store.flowClicks"
            :columns="clickColumns"
            row-key="clickId"
            :loading="loadingRegistros"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDocenteStore } from '@/stores/docente.stores'
import { useFigmaClickTracker } from '@/composables/useFigmaClickTracker'
import type { Flow } from '@/types/docente.types'

const $q = useQuasar()
const store = useDocenteStore()

const CLIENT_ID = import.meta.env.VITE_FIGMA_CLIENT_ID ?? 'ATBfU46hXxHKWnVxld4rL9'

const selectedProject = ref<string | null>(null)
const selectedRequirement = ref<string | null>(null)
const selectedTask = ref<string | null>(null)

const dialogOpen = ref(false)
const creatingFlow = ref(false)
const flowForm = reactive({ name: '' })

const prototipoDialogOpen = ref(false)
const finishingFlow = ref(false)
const flowActivo = ref<Flow | null>(null)

const registrosDialogOpen = ref(false)
const loadingRegistros = ref(false)
const flowParaVer = ref<Flow | null>(null)

const required = (val: any) => (val !== '' && val !== null && val !== undefined) || 'Campo obligatorio'

const clickColumns = [
  { name: 'orderIndex', label: '#', field: 'orderIndex', align: 'left' as const },
  { name: 'nodeId', label: 'Node ID', field: 'nodeId', align: 'left' as const },
  { name: 'clickedAt', label: 'Hora', field: (row: any) => new Date(row.clickedAt).toLocaleTimeString(), align: 'left' as const },
]

const proyectoActual = computed(() =>
  store.projects.find((p: any) => p.projectId === selectedProject.value) ?? null,
)

const figmaEmbedUrl = computed(() => {
  if (!proyectoActual.value?.fileKey) return ''
  const params = new URLSearchParams({
    'embed-host': 'share',
    'client-id': CLIENT_ID,
  })
  return `https://embed.figma.com/proto/${proyectoActual.value?.fileKey}?${params.toString()}`
})


const flowsForSelectedTask = computed(() => {
  if (!selectedTask.value) return []
  return store.getFlowsByTask(selectedTask.value)
})

watch(flowsForSelectedTask, (newFlows) => {
  console.log('🔄 Flujos para tarea:', newFlows)
}, { deep: true })


// --- tracker de clicks ---
const tracker = useFigmaClickTracker(async (record) => {
  if (!flowActivo.value) return

  try {
    await store.registerFlowClick(flowActivo.value.flowId, record)
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e?.message ?? 'No se pudo guardar el click' })
  }
})

async function onProjectChange() {
  selectedRequirement.value = null
  selectedTask.value = null
  store.requirements.length = 0
  store.tasks.length = 0
  if (!selectedProject.value) return
  try {
    await store.fetchRequirements(selectedProject.value)
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo cargar los requerimientos' })
  }
}

async function onRequirementChange() {
  selectedTask.value = null
  store.tasks.length = 0
  if (!selectedRequirement.value) return
  try {
    await store.fetchTasksByRequirement(selectedRequirement.value)
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo cargar las tareas' })
  }
}

async function onTaskChange() {
  if (!selectedTask.value) {
    return
  }
  
  
  try {
    await store.fetchFlows(selectedTask.value)
  } catch (e: any) {
    console.error('❌ Error:', e)
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo cargar los flujos' })
  }
}


async function onCreateFlow() {
  if (!selectedTask.value || !selectedProject.value) return
  creatingFlow.value = true
  try {
    const nuevoFlujo = await store.createFlow({
      taskId: selectedTask.value,
      projectId: selectedProject.value,
      name: flowForm.name,
    })
    $q.notify({ type: 'positive', message: 'Flujo creado, empieza a interactuar con el prototipo' })
    dialogOpen.value = false
    flowForm.name = ''
    abrirPrototipo(nuevoFlujo)
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo crear el flujo' })
  } finally {
    creatingFlow.value = false
  }
}

function abrirPrototipo(flow: Flow) {
  flowActivo.value = flow
  tracker.reset()
  prototipoDialogOpen.value = true
}

async function onTerminarFlujo() {
  if (!flowActivo.value) return
  finishingFlow.value = true
  try {
    await store.finishFlow(flowActivo.value.flowId)
    $q.notify({ type: 'positive', message: `Flujo terminado con ${tracker.clickCount.value} clicks registrados` })
    prototipoDialogOpen.value = false
    flowActivo.value = null
    await store.fetchFlows(selectedTask.value!)
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo terminar el flujo' })
  } finally {
    finishingFlow.value = false
  }
}

async function abrirRegistros(flow: Flow) {
  flowParaVer.value = flow
  registrosDialogOpen.value = true
  loadingRegistros.value = true
  try {
    await store.fetchFlowClicks(flow.flowId)
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo cargar los registros' })
  } finally {
    loadingRegistros.value = false
  }
}

function confirmDeleteFlow(flow: Flow) {
  $q.dialog({
    title: 'Eliminar flujo',
    message: `Se eliminará "${flow.name}" junto con todos sus clicks registrados. ¿Continuar?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await store.deleteFlow(flow.flowId)
      $q.notify({ type: 'positive', message: 'Flujo eliminado' })
    } catch (e: any) {
      $q.notify({ type: 'negative', message: e.message ?? 'No se pudo eliminar el flujo' })
    }
  })
}

onMounted(async () => {
  try {
    await store.fetchProjects()
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo cargar los proyectos' })
  }
})
</script>