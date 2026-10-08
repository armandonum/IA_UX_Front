<!-- components/experto/cognitive/CognitiveAssignModal.vue -->
<template>
  <div class="q-pa-lg">
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">
          🧠 Evaluaciones Cognitivas Asignadas
        </div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Selecciona una evaluación para comenzar el recorrido cognitivo
        </div>
      </div>

      <q-btn
        flat
        color="primary"
        icon="refresh"
        label="Actualizar"
        :loading="loading"
        @click="$emit('reload')"
      />
    </div>

    <!-- ============================================================ -->
    <!-- CLIENT ID                                                     -->
    <!-- ============================================================ -->
    <ClientIdInput
      :model-value="figmaSession.clientId"
      @update:model-value="figmaSession.setClientId"
    />

    <!-- ============================================================ -->
    <!-- LOADING                                                       -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">
        Cargando evaluaciones...
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- EMPTY                                                         -->
    <!-- ============================================================ -->
    <q-card
      v-else-if="!evaluations.length"
      flat
      bordered
      class="text-center q-pa-xl"
    >
      <q-icon name="assignment" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">
        No tienes evaluaciones asignadas
      </div>
      <div class="text-caption text-grey-6 q-mt-xs">
        Contacta al coordinador para que te asigne una evaluación cognitiva
      </div>
    </q-card>

    <!-- ============================================================ -->
    <!-- GRID DE EVALUACIONES                                          -->
    <!-- ============================================================ -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="evaluation in evaluations"
        :key="evaluation.cognitiveEvaluationId"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="evaluation-card full-height column">
          <!-- ==================================================== -->
          <!-- THUMBNAIL                                             -->
          <!-- ==================================================== -->
          <div class="thumbnail-container">
            <q-img
              v-if="getProjectThumbnail(evaluation.projectId)"
              :src="getProjectThumbnail(evaluation.projectId)!"
              height="160px"
              fit="cover"
              class="thumbnail-img"
            >
              <template #error>
                <div class="absolute-full flex flex-center bg-grey-3">
                  <q-icon name="image_not_supported" size="32px" color="grey-6" />
                </div>
              </template>
            </q-img>

            <div
              v-else
              class="absolute-full flex flex-center bg-grey-2 text-grey-6"
            >
              <div class="text-center">
                <q-icon name="palette" size="48px" />
                <div class="text-caption q-mt-xs">Sin previsualización</div>
              </div>
            </div>

            <!-- Badge de URL disponible -->
            <q-badge
              v-if="hasPublicUrl(evaluation.projectId)"
              color="positive"
              text-color="white"
              class="url-badge"
            >
              <q-icon name="link" size="12px" class="q-mr-xs" />
              Prototipo listo
            </q-badge>

            <q-badge
              v-else
              color="warning"
              text-color="white"
              class="url-badge"
            >
              <q-icon name="link_off" size="12px" class="q-mr-xs" />
              Sin URL pública
            </q-badge>
          </div>

          <!-- ==================================================== -->
          <!-- INFO                                                  -->
          <!-- ==================================================== -->
          <q-card-section class="q-pb-sm">
            <div class="text-subtitle1 text-weight-bold ellipsis-2 q-mb-xs">
              {{ evaluation.name }}
            </div>

            <div
              v-if="evaluation.description"
              class="text-caption text-grey-7 ellipsis-2"
              style="min-height: 36px;"
            >
              {{ evaluation.description }}
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none q-pb-sm">
            <!-- Info del proyecto -->
            <div class="row items-center q-gutter-xs text-caption text-grey-6">
              <q-icon name="folder" size="14px" />
              <span class="ellipsis" style="max-width: 200px;">
                {{ getProjectName(evaluation.projectId) }}
              </span>
            </div>

            <div class="row items-center q-gutter-md text-caption text-grey-6 q-mt-xs">
              <div class="row items-center">
                <q-icon name="task_alt" size="14px" class="q-mr-xs" />
                {{ evaluation.totalTasks || 0 }} tareas
              </div>
              <div class="row items-center">
                <q-icon name="timer" size="14px" class="q-mr-xs" />
                {{ evaluation.maxDurationMinutes || 20 }} min
              </div>
            </div>
          </q-card-section>

          <!-- ==================================================== -->
          <!-- AVISO URL PÚBLICA                                     -->
          <!-- ==================================================== -->
          <div
            v-if="hasPublicUrl(evaluation.projectId)"
            class="public-url-notice q-px-sm q-py-xs"
            @click.stop="abrirPrototipo(evaluation.projectId)"
          >
            <q-icon name="info" size="14px" class="q-mr-xs" />
            <span class="text-caption">
              Abre el
              <strong class="text-primary">prototipo</strong>
              antes de iniciar
            </span>
            <q-space />
            <q-icon name="open_in_new" size="14px" class="text-primary" />
          </div>

          <div
            v-else
            class="bg-warning-1 q-px-sm q-py-xs"
          >
            <q-icon name="warning" size="14px" class="q-mr-xs text-warning" />
            <span class="text-caption text-warning-9">
              Este proyecto no tiene URL pública configurada
            </span>
          </div>

          <q-space />

          <!-- ==================================================== -->
          <!-- ACCIONES                                              -->
          <!-- ==================================================== -->
          <q-separator />

          <q-card-actions class="q-pa-sm">
            <q-btn
              unelevated
              color="primary"
              icon="play_arrow"
              label="Comenzar evaluación"
              size="sm"
              class="col"
              :disable="!hasClientId"
              @click="$emit('select', evaluation)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- AVISO SI NO HAY CLIENT ID                                     -->
    <!-- ============================================================ -->
    <q-banner
      v-if="!hasClientId && evaluations.length"
      rounded
      class="bg-orange-1 text-orange-10 q-mt-md"
    >
      <template #avatar>
        <q-icon name="info" />
      </template>
      Ingresa tu <strong>Client ID de Figma</strong> para poder cargar los prototipos.
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useFigmaSessionStore } from '@/stores/figmaSession.store'
import { useProjectInfo } from '@/composables/docente/useProjectInfo'
import ClientIdInput from '@/components/estudiante/figma/ClientIdInput.vue'

const props = defineProps<{
  evaluations: any[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', evaluation: any): void
  (e: 'reload'): void
}>()

const $q = useQuasar()
const figmaSession = useFigmaSessionStore()

const {
  loadProjects,
  getProject,
  getPublicUrl,
} = useProjectInfo()

// ============================================================
// COMPUTED
// ============================================================
const hasClientId = computed(() => !!figmaSession.clientId?.trim())

// ============================================================
// HELPERS
// ============================================================
function getProjectThumbnail(projectId: string): string | null {
  return getProject(projectId)?.thumbnailUrl || null
}

function getProjectName(projectId: string): string {
  return getProject(projectId)?.projectName || 'Proyecto'
}

function hasPublicUrl(projectId: string): boolean {
  return !!getPublicUrl(projectId)
}

function abrirPrototipo(projectId: string) {
  const url = getPublicUrl(projectId)
  if (!url) {
    $q.notify({
      type: 'warning',
      message: 'Este proyecto no tiene URL pública configurada',
    })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ============================================================
// LIFECYCLE
// ============================================================
// ============================================================
// CARGAR PROYECTOS CUANDO LLEGUEN LAS EVALUACIONES
// ============================================================
/**
 * Carga los datos de los proyectos (thumbnail, URL pública, etc.)
 * para las evaluaciones recibidas.
 */
async function loadProjectsForEvaluations() {
  const ids = props.evaluations
    .map((e) => e.projectId)
    .filter(Boolean)

  if (ids.length === 0) return

  console.log('📥 Cargando proyectos para evaluaciones:', ids.length)
  await loadProjects(ids)
  console.log('✅ Proyectos cargados:', ids.length)
}

// 🔥 Watch que observa cambios en las evaluaciones
// - immediate: true → se ejecuta al montar Y cada vez que cambia
// - deep: true → observa cambios dentro del array (por si reemplazan elementos)
watch(
  () => props.evaluations,
  async (newVal) => {
    if (newVal && newVal.length > 0) {
      await loadProjectsForEvaluations()
    }
  },
  { immediate: true, deep: true },
)
</script>
