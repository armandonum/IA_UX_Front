<!-- components/tasks/TaskFlowRecorder.vue -->
<template>
  <div class="q-pa-md">

    <!-- ============================================================ -->
    <!-- CABECERA -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-dark">
          Grabar Flujo Ideal
        </div>

        <div class="text-body2 text-secondary q-mt-xs">
          {{ task?.title || 'Selecciona una tarea' }}
        </div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn
          v-if="!isRecording"
          color="primary"
          text-color="white"
          icon="add"
          label="Nuevo Flujo"
          @click="createNewFlow"
          :loading="creatingFlow"
        />

        <q-btn
          v-if="flows.length > 0 && !isRecording"
          color="info"
          text-color="white"
          icon="list"
          label="Ver Todos"
          flat
          @click="showAllFlows = !showAllFlows"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- LISTA DE FLUJOS -->
    <!-- ============================================================ -->
    <q-card
      v-if="flows.length > 0"
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section>

        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-dark">
            📋 Flujos de la Tarea ({{ flows.length }})
          </div>

          <q-btn
            flat
            dense
            size="sm"
            color="primary"
            :label="showAllFlows ? 'Ocultar' : 'Mostrar todos'"
            @click="showAllFlows = !showAllFlows"
          />
        </div>

        <!-- ======================================================== -->
        <!-- CHIPS -->
        <!-- ======================================================== -->
        <div class="row q-gutter-sm q-mb-sm">
          <q-chip
            v-for="(f, index) in flows"
            :key="f.flowId"
            :color="
              selectedFlowId === f.flowId
                ? 'primary'
                : 'grey-4'
            "
            :text-color="
              selectedFlowId === f.flowId
                ? 'white'
                : 'dark'
            "
            clickable
            @click="selectFlow(f.flowId)"
          >
            {{ index + 1 }}. {{ f.name }}

            <q-badge
              :color="
                f.status === 'completed'
                  ? 'positive'
                  : 'warning'
              "
              text-color="white"
              size="sm"
              class="q-ml-xs"
            >
              {{ f.status === 'completed' ? '✓' : '...' }}
            </q-badge>

            <q-badge
              color="info"
              text-color="white"
              size="sm"
              class="q-ml-xs"
            >
              {{ f.stepsCount ?? 0 }} pasos
            </q-badge>
          </q-chip>
        </div>

        <!-- ======================================================== -->
        <!-- TABLA DE FLUJOS -->
        <!-- ======================================================== -->
        <div v-if="showAllFlows" class="q-mt-md">

          <q-table
            :rows="flows"
            :columns="flowColumns"
            row-key="flowId"
            flat
            bordered
            dense
            class="bg-white text-dark"
            style="max-height: 250px; overflow: auto;"
            :pagination="{ rowsPerPage: 5 }"
          >

            <template v-slot:body-cell-status="props">
              <q-td>
                <q-badge
                  :color="
                    props.row.status === 'completed'
                      ? 'positive'
                      : 'warning'
                  "
                  text-color="white"
                >
                  {{
                    props.row.status === 'completed'
                      ? 'Completado'
                      : 'En progreso'
                  }}
                </q-badge>
              </q-td>
            </template>

            <template v-slot:body-cell-steps="props">
              <q-td class="text-dark">
                {{ props.row.stepsCount ?? 0 }} pasos
              </q-td>
            </template>

            <template v-slot:body-cell-startedAt="props">
              <q-td class="text-dark">
                {{ formatDate(props.row.startedAt) }}
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td>

                <q-btn
                  icon="visibility"
                  flat
                  dense
                  size="sm"
                  color="info"
                  @click="selectFlow(props.row.flowId)"
                />

                <q-btn
                  v-if="!isRecording"
                  icon="delete"
                  flat
                  dense
                  size="sm"
                  color="negative"
                  @click="confirmDeleteFlow(props.row.flowId)"
                />

              </q-td>
            </template>

          </q-table>

        </div>

      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- FLUJO ACTUAL -->
    <!-- ============================================================ -->
    <q-card
      v-if="currentFlow"
      flat
      bordered
      class="q-mb-md"
    >

      <!-- ========================================================== -->
      <!-- ESTADO DEL FLUJO -->
      <!-- ========================================================== -->
      <q-card-section>

        <div class="row items-center q-gutter-md">

          <q-icon
            :name="
              currentFlow.status === 'completed'
                ? 'check_circle'
                : 'pending'
            "
            :color="
              currentFlow.status === 'completed'
                ? 'positive'
                : 'warning'
            "
            size="28px"
          />

          <div class="col">

            <div class="text-subtitle1 text-dark">
              {{ currentFlow.name }}

              <q-badge
                :color="
                  currentFlow.status === 'completed'
                    ? 'positive'
                    : 'warning'
                "
                text-color="white"
                size="sm"
                class="q-ml-sm"
              >
                {{
                  currentFlow.status === 'completed'
                    ? 'Completado'
                    : 'En progreso'
                }}
              </q-badge>
            </div>

            <div class="text-body2 text-secondary">
              {{ currentFlowClicks.length }} pasos
            </div>

          </div>

          <div class="text-caption text-secondary">
            Creado: {{ formatDate(currentFlow.startedAt) }}
          </div>

          <q-btn
            v-if="currentFlowClicks.length > 0"
            flat
            dense
            color="primary"
            icon="expand_more"
            :label="showFlowSummary ? 'Ocultar' : 'Ver pasos'"
            @click="showFlowSummary = !showFlowSummary"
          />

          <q-btn
            v-if="
              !isRecording &&
              currentFlow.status !== 'completed'
            "
            color="positive"
            text-color="white"
            icon="play_arrow"
            label="Continuar"
            size="sm"
            @click="startRecording"
          />

          <q-btn
            v-if="
              !isRecording &&
              currentFlow.status === 'completed'
            "
            color="info"
            text-color="white"
            icon="visibility"
            label="Ver Detalles"
            flat
            size="sm"
            @click="showFlowDetails = true"
          />

          <q-btn
            v-if="!isRecording"
            color="negative"
            text-color="white"
            icon="delete"
            label="Eliminar"
            flat
            size="sm"
            @click="confirmDeleteFlow(currentFlow.flowId)"
          />

        </div>

      </q-card-section>

      <!-- ========================================================== -->
      <!-- RESUMEN DE PASOS -->
      <!-- ========================================================== -->
      <q-card-section
        v-if="
          showFlowSummary &&
          currentFlowClicks.length > 0
        "
      >

        <div class="row items-center justify-between q-mb-sm">

          <div class="text-subtitle2 text-dark">
            📋 Pasos del Flujo ({{ currentFlowClicks.length }})
          </div>

          <div class="row q-gutter-sm">

            <q-btn
              flat
              dense
              size="sm"
              color="primary"
              icon="content_copy"
              label="Copiar"
              @click="copyFlowSummary"
            />

            <q-btn
              flat
              dense
              size="sm"
              color="info"
              icon="download"
              label="Exportar"
              @click="exportFlow"
            />

          </div>

        </div>

        <!-- ======================================================== -->
        <!-- CHIPS DE PASOS -->
        <!-- ======================================================== -->
        <div class="row q-gutter-sm q-mb-md">

          <q-chip
            v-for="(click, index) in currentFlowClicks"
            :key="click.clickId"
            :color="
              click.source === 'figma'
                ? 'info'
                : 'primary'
            "
            text-color="white"
            size="sm"
            clickable
            @click="showStepDetail(click)"
          >

            {{ index + 1 }}.
            {{ truncateText(click.nodeId, 25) }}

            <q-badge
              v-if="click.source === 'figma'"
              color="white"
              text-color="info"
              class="q-ml-xs"
              size="xs"
            >
              ⚡
            </q-badge>

          </q-chip>

        </div>

        <!-- ======================================================== -->
        <!-- TABLA DE PASOS -->
        <!-- ======================================================== -->
        <q-table
          :rows="currentFlowClicks"
          :columns="stepColumns"
          row-key="clickId"
          flat
          bordered
          dense
          class="bg-white text-dark"
          style="max-height: 250px; overflow: auto;"
          :pagination="{ rowsPerPage: 10 }"
        >

          <template v-slot:body-cell-index="props">
            <q-td>
              <span class="text-primary text-weight-bold">
                {{ props.rowIndex + 1 }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-nodeId="props">
            <q-td>

              <div class="row items-center q-gutter-sm">

                <span class="text-dark">
                  {{ props.row.nodeId }}
                </span>

                <q-badge
                  v-if="props.row.source === 'figma'"
                  color="info"
                  text-color="white"
                  size="sm"
                >
                  ⚡ Auto
                </q-badge>

                <q-badge
                  v-else-if="props.row.source === 'manual'"
                  color="primary"
                  text-color="white"
                  size="sm"
                >
                  ✏️ Manual
                </q-badge>

              </div>

            </q-td>
          </template>

          <template v-slot:body-cell-source="props">
            <q-td>

              <q-badge
                :color="
                  props.row.source === 'figma'
                    ? 'info'
                    : 'primary'
                "
                text-color="white"
              >
                {{
                  props.row.source === 'figma'
                    ? 'Automático'
                    : 'Manual'
                }}
              </q-badge>

            </q-td>
          </template>

          <template v-slot:body-cell-clickedAt="props">
            <q-td class="text-dark">
              {{ formatDate(props.row.clickedAt) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td>

              <q-btn
                icon="visibility"
                flat
                dense
                size="sm"
                color="info"
                @click="showStepDetail(props.row)"
              />

              <q-btn
                v-if="
                  !isRecording &&
                  currentFlow.status !== 'completed'
                "
                icon="delete"
                flat
                dense
                size="sm"
                color="negative"
                @click="deleteClick(props.row.clickId)"
              />

            </q-td>
          </template>

        </q-table>

      </q-card-section>

    </q-card>

    <!-- ============================================================ -->
    <!-- FIGMA -->
    <!-- ============================================================ -->
    <FigmaEmbed
      ref="figmaEmbedRef"
      :file-key="fileKey"
      :task-id="task?.projectTaskId"
      :project-id="projectId"
      :flow-id="currentFlow?.flowId"
      :recording="isRecording"
      @flow-created="onFlowCreated"
      @flow-finished="onFlowFinished"
      @click-added="onClickAdded"
      @recording-stopped="onRecordingStopped"
    />

    <!-- ============================================================ -->
    <!-- DIALOG DETALLE PASO -->
    <!-- ============================================================ -->
    <q-dialog v-model="showStepDialog">

      <q-card style="min-width: 400px; max-width: 500px;">

        <q-card-section class="bg-primary text-white">

          <div class="text-h6">
            📌 Detalle del Paso
          </div>

          <div class="text-subtitle2">
            Paso {{ stepDetailIndex + 1 }}
            de {{ currentFlowClicks.length }}
          </div>

        </q-card-section>

        <q-card-section v-if="selectedStep">

          <div class="q-gutter-y-md">

            <div>
              <div class="text-subtitle2 text-secondary">
                Descripción
              </div>

              <div class="text-body1 text-dark">
                {{ selectedStep.nodeId }}
              </div>
            </div>

            <div class="row q-col-gutter-md">

              <div class="col-6">

                <div class="text-subtitle2 text-secondary">
                  Tipo
                </div>

                <q-badge
                  :color="
                    selectedStep.source === 'figma'
                      ? 'info'
                      : 'primary'
                  "
                  text-color="white"
                >
                  {{
                    selectedStep.source === 'figma'
                      ? '⚡ Automático'
                      : '✏️ Manual'
                  }}
                </q-badge>

              </div>

              <div class="col-6">

                <div class="text-subtitle2 text-secondary">
                  Orden
                </div>

                <div class="text-body1 text-dark">
                  {{ selectedStep.orderIndex }}
                </div>

              </div>

            </div>

            <div>

              <div class="text-subtitle2 text-secondary">
                ID del Nodo
              </div>

              <div
                class="text-dark text-caption font-mono bg-grey-2 q-pa-sm rounded-borders"
              >
                {{ selectedStep.presentedNodeId || 'No disponible' }}
              </div>

            </div>

            <div>

              <div class="text-subtitle2 text-secondary">
                Fecha
              </div>

              <div class="text-body1 text-dark">
                {{ formatDate(selectedStep.clickedAt) }}
              </div>

            </div>

          </div>

        </q-card-section>

        <q-card-actions
          align="right"
          class="q-pa-md"
        >

          <div class="row q-gutter-sm">

            <q-btn
              flat
              color="primary"
              icon="chevron_left"
              label="Anterior"
              @click="navigateStep(-1)"
              :disable="stepDetailIndex === 0"
            />

            <q-btn
              flat
              color="primary"
              icon-right="chevron_right"
              label="Siguiente"
              @click="navigateStep(1)"
              :disable="
                stepDetailIndex ===
                currentFlowClicks.length - 1
              "
            />

          </div>

          <q-btn
            flat
            color="secondary"
            label="Cerrar"
            v-close-popup
          />

        </q-card-actions>

      </q-card>

    </q-dialog>

    <!-- ============================================================ -->
    <!-- DIALOG DETALLES DEL FLUJO -->
    <!-- ============================================================ -->
    <q-dialog v-model="showFlowDetails">

      <q-card style="min-width: 500px; max-width: 700px;">

        <q-card-section class="bg-primary text-white">

          <div class="text-h6">
            📋 Detalles del Flujo
          </div>

          <div class="text-subtitle2">
            {{ currentFlow?.name }}
          </div>

        </q-card-section>

        <q-card-section v-if="currentFlow">

          <div class="q-gutter-y-md">

            <div>

              <div class="text-subtitle2 text-secondary">
                Nombre
              </div>

              <div class="text-body1 text-dark">
                {{ currentFlow.name }}
              </div>

            </div>

            <div>

              <div class="text-subtitle2 text-secondary">
                Estado
              </div>

              <q-badge
                :color="
                  currentFlow.status === 'completed'
                    ? 'positive'
                    : 'warning'
                "
                text-color="white"
              >
                {{
                  currentFlow.status === 'completed'
                    ? 'Completado'
                    : 'En progreso'
                }}
              </q-badge>

            </div>

            <div>

              <div class="text-subtitle2 text-secondary">
                Total de pasos
              </div>

              <div class="text-body1 text-dark">
                {{ currentFlowClicks.length }}
              </div>

            </div>

            <div>

              <div class="text-subtitle2 text-secondary">
                Fecha de creación
              </div>

              <div class="text-body1 text-dark">
                {{ formatDate(currentFlow.startedAt) }}
              </div>

            </div>

          </div>

        </q-card-section>

        <q-card-actions align="right">

          <q-btn
            flat
            color="secondary"
            label="Cerrar"
            v-close-popup
          />

        </q-card-actions>

      </q-card>

    </q-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import FigmaEmbed from '../figma/FigmaEmbed.vue'
import { useFlowApi } from '@/composables/useFlowApi'

const props = defineProps<{
  task: any
  projectId: string
  fileKey: string
}>()

const emit = defineEmits<{
  (e: 'flow-created', flow: any): void
  (e: 'flow-updated'): void
}>()

const $q = useQuasar()
const flowApi = useFlowApi()

// ============================================================
// STATE
// ============================================================

const figmaEmbedRef =
  ref<InstanceType<typeof FigmaEmbed> | null>(null)

const loading = ref(false)
const creatingFlow = ref(false)

const flows = ref<any[]>([])
const currentFlow = ref<any>(null)
const currentFlowClicks = ref<any[]>([])

const selectedFlowId = ref<string | null>(null)

const isRecording = ref(false)

const showAllFlows = ref(false)
const showFlowSummary = ref(true)
const showFlowDetails = ref(false)

const showStepDialog = ref(false)
const selectedStep = ref<any>(null)
const stepDetailIndex = ref(0)

// ============================================================
// COLUMNS
// ============================================================

const flowColumns = [
  {
    name: 'name',
    label: 'Nombre',
    field: 'name',
    align: 'left'
  },
  {
    name: 'status',
    label: 'Estado',
    field: 'status',
    align: 'center'
  },
  {
    name: 'steps',
    label: 'Pasos',
    field: 'steps',
    align: 'center'
  },
  {
    name: 'startedAt',
    label: 'Creado',
    field: 'startedAt',
    align: 'center'
  },
  {
    name: 'actions',
    label: 'Acciones',
    field: 'actions',
    align: 'center'
  }
]

const stepColumns = [
  {
    name: 'index',
    label: '#',
    field: 'index',
    align: 'center'
  },
  {
    name: 'nodeId',
    label: 'Descripción',
    field: 'nodeId',
    align: 'left'
  },
  {
    name: 'source',
    label: 'Origen',
    field: 'source',
    align: 'center'
  },
  {
    name: 'clickedAt',
    label: 'Fecha',
    field: 'clickedAt',
    align: 'center'
  },
  {
    name: 'actions',
    label: 'Acciones',
    field: 'actions',
    align: 'center'
  }
]

// ============================================================
// HELPERS
// ============================================================

// ✅ Normalizar status del backend al frontend
const normalizeStatus = (status: string): string => {
  if (!status) return 'in_progress'
  if (status === 'finished' || status === 'completed') return 'completed'
  if (status === 'in_progress' || status === 'inprogress') return 'in_progress'
  return status
}

// ✅ Verificar si un flujo está completado
const isFlowCompleted = (flow: any): boolean => {
  return normalizeStatus(flow?.status) === 'completed'
}

// ✅ Obtener el status para mostrar
const getFlowStatus = (flow: any): string => {
  return normalizeStatus(flow?.status)
}
const truncateText = (
  text: string,
  maxLength: number
) => {
  if (!text) return ''

  return text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text
}

const formatDate = (date: string) => {
  if (!date) return 'No disponible'

  return new Date(date).toLocaleDateString(
    'es-ES',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  )
}

// ============================================================
// CARGAR TODOS LOS FLOWS
// ============================================================


const loadAllFlows = async () => {
  if (!props.task?.projectTaskId) {
    console.warn('⚠️ No hay projectTaskId disponible en la tarea:', props.task)
    return
  }

  console.log('🔍 Cargando flows para projectTaskId:', props.task.projectTaskId)

  try {
    const allFlows = await flowApi.getFlows(props.task.projectTaskId)
    const loadedFlows = allFlows || []

    const flowsWithSteps = await Promise.all(
      loadedFlows.map(async (flow: any) => {
        try {
          const clicks = await flowApi.getFlowClicks(flow.flowId)

          return {
            ...flow,
            status: normalizeStatus(flow.status), // ✅ Normalizado
            stepsCount: clicks?.length || 0
          }
        } catch (error) {
          console.error(`Error cargando pasos del flow ${flow.flowId}:`, error)
          return {
            ...flow,
            status: normalizeStatus(flow.status), // ✅ Normalizado
            stepsCount: 0
          }
        }
      })
    )

    flows.value = flowsWithSteps

    console.log('📦 Flows cargados:', flows.value.length)

    if (flows.value.length > 0 && !selectedFlowId.value) {
      const sortedFlows = [...flows.value].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )

      const latestFlow = sortedFlows[0]
      if (latestFlow?.flowId) {
        await selectFlow(latestFlow.flowId)
      }
    }
  } catch (error) {
    console.error('Error al cargar flujos:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los flujos'
    })
  }
}

// ============================================================
// CREAR NUEVO FLOW
// ============================================================

const createNewFlow = async () => {
  if (!props.task?.projectTaskId) {
    $q.notify({
      type: 'warning',
      message:
        'La tarea no tiene un projectTaskId asociado'
    })

    return
  }

  creatingFlow.value = true

  try {
    const newFlow =
      await flowApi.createFlow({
        taskId:
          props.task.projectTaskId,

        projectId:
          props.projectId,

        name:
          `Flujo ${flows.value.length + 1} - ${new Date().toLocaleTimeString()}`
      })

    const flowWithSteps = {
      ...newFlow,
      stepsCount: 0
    }

    flows.value.push(
      flowWithSteps
    )

    await selectFlow(
      newFlow.flowId
    )

    isRecording.value = true

    if (figmaEmbedRef.value) {
      await figmaEmbedRef.value.startRecording()
    }

    $q.notify({
      type: 'positive',
      message:
        '✅ Nuevo flujo creado. Comienza a grabar los pasos.'
    })
  } catch (error) {
    console.error(
      'Error al crear flujo:',
      error
    )

    $q.notify({
      type: 'negative',
      message:
        'Error al crear flujo'
    })
  } finally {
    creatingFlow.value = false
  }
}

// ============================================================
// SELECCIONAR FLOW
// ============================================================

const selectFlow = async (flowId: string) => {
  try {
    loading.value = true

    const flow = await flowApi.getFlowById(flowId)
    const clicks = await flowApi.getFlowClicks(flowId)

    // ✅ Normalizar status
    const normalizedStatus = normalizeStatus(flow.status)

    currentFlow.value = {
      ...flow,
      status: normalizedStatus
    }

    currentFlowClicks.value = clicks || []
    selectedFlowId.value = flowId
    showFlowSummary.value = true

    // Actualizar cantidad de pasos en la lista
    const index = flows.value.findIndex(f => f.flowId === flowId)
    if (index !== -1) {
      flows.value[index] = {
        ...flows.value[index],
        stepsCount: currentFlowClicks.value.length,
        status: normalizedStatus
      }
    }

    emit('flow-updated')
  } catch (error) {
    console.error('Error al seleccionar flujo:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar el flujo'
    })
  } finally {
    loading.value = false
  }
}

// ============================================================
// INICIAR GRABACIÓN
// ============================================================

const startRecording = async () => {
  if (!currentFlow.value) {
    await createNewFlow()
    return
  }

  isRecording.value = true

  if (figmaEmbedRef.value) {
    await figmaEmbedRef.value.startRecording()
  }
}

// ============================================================
// FLOW CREATED
// ============================================================

const onFlowCreated = (newFlow: any) => {
  const normalizedFlow = {
    ...newFlow,
    status: normalizeStatus(newFlow.status || 'in_progress')
  }
  
  const exists = flows.value.some(f => f.flowId === normalizedFlow.flowId)

  if (!exists) {
    flows.value.push({
      ...normalizedFlow,
      stepsCount: 0
    })
  }

  currentFlow.value = normalizedFlow
  selectedFlowId.value = normalizedFlow.flowId

  emit('flow-created', normalizedFlow)

  $q.notify({
    type: 'positive',
    message: 'Flujo creado exitosamente.'
  })
}

// ============================================================
// FLOW FINISHED
// ============================================================


const onFlowFinished = async (finishedFlow: any) => {
  console.log('📡 Flujo terminado:', finishedFlow)
  
  // ✅ Normalizar status
  const normalizedFlow = {
    ...finishedFlow,
    status: normalizeStatus(finishedFlow.status)
  }
  
  // ✅ Actualizar en la lista de flows
  const index = flows.value.findIndex(f => f.flowId === normalizedFlow.flowId)
  
  if (index !== -1) {
    flows.value[index] = {
      ...flows.value[index],
      ...normalizedFlow,
      stepsCount: currentFlowClicks.value.length
    }
  }
  
  // ✅ Actualizar el flujo actual
  currentFlow.value = {
    ...normalizedFlow,
    status: 'completed'
  }
  
  isRecording.value = false
  
  // ✅ Recargar los flows para asegurar que el status se refleje
  await loadAllFlows()
  
  emit('flow-updated')
  
  $q.notify({
    type: 'positive',
    message: `✅ Flujo completado con ${currentFlowClicks.value.length} pasos`
  })
}

// ============================================================
// RECORDING STOPPED
// ============================================================

const onRecordingStopped = () => {
  isRecording.value = false
}

// ============================================================
// CLICK ADDED
// ============================================================

const onClickAdded = (
  click: any
) => {
  currentFlowClicks.value.push(
    click
  )

  if (currentFlow.value) {
    const index =
      flows.value.findIndex(
        f =>
          f.flowId ===
          currentFlow.value.flowId
      )

    if (index !== -1) {
      flows.value[index] = {
        ...flows.value[index],
        stepsCount:
          currentFlowClicks.value.length
      }
    }
  }
}

// ============================================================
// ELIMINAR CLICK
// ============================================================

const deleteClick = async (
  clickId: string
) => {
  const confirm =
    await $q.dialog({
      title: 'Eliminar Paso',
      message:
        '¿Estás seguro de eliminar este paso?',
      ok: {
        label: 'Eliminar',
        color: 'negative'
      },
      cancel: 'Cancelar'
    })

  if (!confirm) return

  try {
    await flowApi.deleteFlowClick(
      clickId
    )

    currentFlowClicks.value =
      currentFlowClicks.value.filter(
        c =>
          c.clickId !==
          clickId
      )

    const sorted = [
      ...currentFlowClicks.value
    ].sort(
      (a, b) =>
        a.orderIndex -
        b.orderIndex
    )

    for (
      let i = 0;
      i < sorted.length;
      i++
    ) {
      if (
        sorted[i].orderIndex !==
        i + 1
      ) {
        await flowApi.updateFlowClick(
          sorted[i].clickId,
          {
            orderIndex:
              i + 1
          }
        )

        sorted[i].orderIndex =
          i + 1
      }
    }

    if (currentFlow.value) {
      const index =
        flows.value.findIndex(
          f =>
            f.flowId ===
            currentFlow.value.flowId
        )

      if (index !== -1) {
        flows.value[index] = {
          ...flows.value[index],
          stepsCount:
            currentFlowClicks.value.length
        }
      }
    }

    $q.notify({
      type: 'positive',
      message:
        'Paso eliminado'
    })
  } catch (error) {
    console.error(
      'Error al eliminar paso:',
      error
    )

    $q.notify({
      type: 'negative',
      message:
        'Error al eliminar paso'
    })
  }
}

// ============================================================
// ELIMINAR FLOW
// ============================================================

const confirmDeleteFlow = async (
  flowId: string
) => {
  const flow =
    flows.value.find(
      f =>
        f.flowId ===
        flowId
    )

  if (!flow) return

  const confirm =
    await $q.dialog({
      title: 'Eliminar Flujo',
      message:
        `¿Estás seguro de eliminar el flujo "${flow.name}"?`,
      ok: {
        label: 'Eliminar',
        color: 'negative'
      },
      cancel: 'Cancelar'
    })

  if (!confirm) return

  loading.value = true

  try {
    await flowApi.deleteFlow(
      flowId
    )

    flows.value =
      flows.value.filter(
        f =>
          f.flowId !==
          flowId
      )

    if (
      currentFlow.value?.flowId ===
      flowId
    ) {
      currentFlow.value =
        null

      currentFlowClicks.value =
        []

      selectedFlowId.value =
        null

      if (flows.value.length > 0) {
        const nextFlow =
          flows.value[0]

        await selectFlow(
          nextFlow.flowId
        )
      }
    }

    $q.notify({
      type: 'positive',
      message:
        'Flujo eliminado'
    })

    emit(
      'flow-updated'
    )
  } catch (error) {
    console.error(
      'Error al eliminar flujo:',
      error
    )

    $q.notify({
      type: 'negative',
      message:
        'Error al eliminar flujo'
    })
  } finally {
    loading.value = false
  }
}

// ============================================================
// DETALLE DEL PASO
// ============================================================

const showStepDetail = (
  click: any
) => {
  selectedStep.value =
    click

  stepDetailIndex.value =
    currentFlowClicks.value.findIndex(
      c =>
        c.clickId ===
        click.clickId
    )

  showStepDialog.value =
    true
}

// ============================================================
// NAVEGAR ENTRE PASOS
// ============================================================

const navigateStep = (
  direction: number
) => {
  const newIndex =
    stepDetailIndex.value +
    direction

  if (
    newIndex >= 0 &&
    newIndex <
      currentFlowClicks.value.length
  ) {
    stepDetailIndex.value =
      newIndex

    selectedStep.value =
      currentFlowClicks.value[
        newIndex
      ]
  }
}

// ============================================================
// COPIAR RESUMEN
// ============================================================

const copyFlowSummary = () => {
  if (!currentFlow.value)
    return

  let text =
    `📋 FLUJO IDEAL: ${currentFlow.value.name}\n`

  text +=
    `📅 Creado: ${formatDate(currentFlow.value.startedAt)}\n`

  text +=
    `📊 Total pasos: ${currentFlowClicks.value.length}\n\n`

  currentFlowClicks.value.forEach(
    (click, index) => {
      const source =
        click.source === 'figma'
          ? '⚡ Auto'
          : '✏️ Manual'

      text +=
        `${index + 1}. ${click.nodeId} [${source}]\n`
    }
  )

  navigator.clipboard.writeText(
    text
  )

  $q.notify({
    type: 'positive',
    message:
      '📋 Resumen copiado al portapapeles'
  })
}

// ============================================================
// EXPORTAR
// ============================================================

const exportFlow = () => {
  if (!currentFlow.value)
    return

  const data = {
    flowName:
      currentFlow.value.name,

    createdAt:
      currentFlow.value.startedAt,

    status:
      currentFlow.value.status,

    totalSteps:
      currentFlowClicks.value.length,

    steps:
      currentFlowClicks.value.map(
        (click, index) => ({
          order:
            index + 1,

          description:
            click.nodeId,

          source:
            click.source ===
            'figma'
              ? 'automatic'
              : 'manual',

          nodeId:
            click.presentedNodeId,

          timestamp:
            click.clickedAt
        })
      )
  }

  const blob =
    new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type:
          'application/json'
      }
    )

  const url =
    URL.createObjectURL(
      blob
    )

  const link =
    document.createElement(
      'a'
    )

  link.href = url

  link.download =
    `flujo_${currentFlow.value.name.replace(/\s+/g, '_')}.json`

  document.body.appendChild(
    link
  )

  link.click()

  document.body.removeChild(
    link
  )

  URL.revokeObjectURL(
    url
  )

  $q.notify({
    type: 'positive',
    message:
      '📥 Flujo exportado como JSON'
  })
}

// ============================================================
// WATCH
// ============================================================

watch(
  () =>
    props.task?.projectTaskId,

  (newVal, oldVal) => {
    if (
      newVal &&
      newVal !== oldVal
    ) {
      console.log(
        '🔄 Cambió projectTaskId, recargando flows...'
      )

      selectedFlowId.value =
        null

      currentFlow.value =
        null

      currentFlowClicks.value =
        []

      loadAllFlows()
    }
  },

  {
    immediate: true
  }
)
</script>