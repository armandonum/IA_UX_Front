<!-- HeuristicProjectsView.vue -->
<template>
  <div class="q-pa-lg">
    <div class="text-h5 text-weight-bold q-mb-md">
      Mis Evaluaciones Heurísticas Asignadas
    </div>

    <ClientIdInput
      :model-value="figmaSession.clientId"
      @update:model-value="figmaSession.setClientId"
    />

    <q-banner v-if="error" dense rounded class="bg-negative text-white q-mb-md">
      {{ error }}
    </q-banner>

    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <div v-else-if="myEvaluations.length === 0" class="text-center q-mt-xl">
      <q-icon name="assignment" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">No tienes evaluaciones asignadas</div>
      <div class="text-caption text-grey-5">
        Contacta al coordinador para que te asigne una evaluación
      </div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="evaluation in myEvaluations"
        :key="evaluation.evaluationId"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="project-card">
          <!-- ============================================================ -->
          <!-- INFO PRINCIPAL                                                -->
          <!-- ============================================================ -->
          <q-card-section
            class="cursor-pointer"
            @click="seleccionarEvaluacion(evaluation)"
          >
            <div class="row items-start justify-between q-mb-xs">
              <div class="text-h6 col">
                {{ evaluation.name }}
              </div>
              <q-badge
                v-if="projectMap[evaluation.projectId]?.publicUrl"
                color="positive"
                text-color="white"
                class="q-ml-sm"
              >
                <q-icon name="link" size="12px" class="q-mr-xs" />
                Prototipo listo
              </q-badge>
            </div>

            <div class="text-caption text-grey-6">
              {{ evaluation.description || 'Sin descripción' }}
            </div>
          </q-card-section>

          <q-separator />

          <!-- ============================================================ -->
          <!-- BADGES DE ESTADO                                              -->
          <!-- ============================================================ -->
          <q-card-section class="q-pb-sm">
            <div class="row items-center q-gutter-sm">
              <q-badge :color="getStatusColor(evaluation.status)">
                {{ getStatusLabel(evaluation.status) }}
              </q-badge>
              <q-badge color="info">
                {{ evaluation.maxDurationMinutes }} min
              </q-badge>
            </div>

            <!-- Info del proyecto -->
            <div
              v-if="projectMap[evaluation.projectId]"
              class="q-mt-sm text-caption text-grey-6"
            >
              <div class="row items-center q-gutter-xs">
                <q-icon name="code" size="14px" />
                <span class="ellipsis" style="max-width: 200px">
                  {{ projectMap[evaluation.projectId]?.fileKey }}
                </span>
              </div>
            </div>
          </q-card-section>

          <!-- ============================================================ -->
          <!-- AVISO URL PÚBLICA                                             -->
          <!-- ============================================================ -->
          <div
            v-if="projectMap[evaluation.projectId]?.publicUrl"
            class="public-url-notice q-px-sm q-py-xs"
            @click.stop="abrirPrototipo(projectMap[evaluation.projectId].publicUrl)"
          >
            <q-icon name="info" size="14px" class="q-mr-xs" />
            <span class="text-caption">
              Asegúrate de tener el
              <strong class="text-primary">prototipo abierto</strong>
              antes de iniciar
            </span>
            <q-space />
            <q-icon name="open_in_new" size="14px" class="text-primary" />
          </div>

          <q-separator />

          <!-- ============================================================ -->
          <!-- ACCIONES                                                      -->
          <!-- ============================================================ -->
          <q-card-actions align="right">
            <q-btn
              flat
              color="primary"
              label="Evaluar"
              icon="play_arrow"
              @click.stop="seleccionarEvaluacion(evaluation)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useHeuristicExpert } from '@/composables/expert/useHeuristicExpert'
import { useFigmaSessionStore } from '@/stores/figmaSession.store'
import api from '@/api/axios'
import type { HeuristicEvaluation } from '@/api/heuristic.api'
import ClientIdInput from '@/components/estudiante/figma/ClientIdInput.vue'

const router = useRouter()
const $q = useQuasar()
const figmaSession = useFigmaSessionStore()
const { loading, error, myEvaluations, loadMyEvaluations } = useHeuristicExpert()

// ============================================================
// MAPA DE PROYECTOS (projectId → datos del proyecto)
// ============================================================
interface ProjectInfo {
  projectId: string
  fileKey: string
  projectName: string
  publicUrl?: string
  thumbnailUrl?: string
}

const projectMap = ref<Record<string, ProjectInfo>>({})

/**
 * Carga los proyectos referenciados por las evaluaciones
 * y los guarda en un mapa para acceso rápido
 */
async function loadProjectsInfo() {
  if (!myEvaluations.value.length) return

  // Obtener projectIds únicos
  const projectIds = [
    ...new Set(myEvaluations.value.map((e) => e.projectId).filter(Boolean)),
  ]

  if (projectIds.length === 0) return

  console.log('📦 [HeuristicProjectsView] Cargando proyectos:', projectIds)

  try {
    // Cargar todos en paralelo
    const results = await Promise.all(
      projectIds.map((pid) =>
        api
          .get(`/figma-projects/${pid}`)
          .then((r) => ({ id: pid, data: r.data }))
          .catch((err) => {
            console.warn(`Error cargando proyecto ${pid}:`, err)
            return { id: pid, data: null }
          }),
      ),
    )

    // Construir el mapa
    const map: Record<string, ProjectInfo> = {}
    for (const { id, data } of results) {
      if (data) {
        map[id] = {
          projectId: data.projectId ?? id,
          fileKey: data.fileKey,
          projectName: data.projectName,
          publicUrl: data.publicUrl ?? data.public_url ?? undefined,
          thumbnailUrl: data.thumbnailUrl,
        }
      }
    }
    projectMap.value = map

    console.log('✅ [HeuristicProjectsView] Proyectos cargados:', map)
  } catch (e) {
    console.error('Error cargando proyectos:', e)
  }
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  await loadMyEvaluations()
  await loadProjectsInfo()
})

// Recargar proyectos si cambian las evaluaciones
watch(
  () => myEvaluations.value.length,
  async (newLen, oldLen) => {
    if (newLen !== oldLen) {
      await loadProjectsInfo()
    }
  },
)

// ============================================================
// NAVEGACIÓN
// ============================================================
function seleccionarEvaluacion(evaluation: HeuristicEvaluation) {
  const project = projectMap.value[evaluation.projectId]

  figmaSession.selectProject({
    projectId: evaluation.projectId,
    fileKey: project?.fileKey || '',
    projectName: evaluation.name,
    publicUrl: project?.publicUrl,   // 🆕 Guardar URL en el store
  })

  router.push({
    name: 'experto-heuristic-evaluation',
    params: { evaluationId: evaluation.evaluationId },
  })
}

// ============================================================
// ABRIR PROTOTIPO
// ============================================================
function abrirPrototipo(url: string | null | undefined) {
  if (!url) {
    $q.notify({
      type: 'warning',
      message: 'Este proyecto no tiene URL pública configurada.',
    })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ============================================================
// HELPERS
// ============================================================
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'grey',
    planning: 'info',
    in_progress: 'warning',
    completed: 'positive',
    archived: 'grey-7',
  }
  return colors[status] || 'grey'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    planning: 'Planificación',
    in_progress: 'En progreso',
    completed: 'Completada',
    archived: 'Archivada',
  }
  return labels[status] || status
}
</script>

<style scoped>
/* ============================================================
   CARD
   ============================================================ */
.project-card {
  transition: all 0.2s ease;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(30, 58, 138, 0.15);
  border-color: #1e3a8a;
}

/* ============================================================
   AVISO URL PÚBLICA
   ============================================================ */
.public-url-notice {
  display: flex;
  align-items: center;
  background: #f0f7ff;
  border-top: 1px solid #dbeafe;
  border-bottom: 1px solid #dbeafe;
  color: #1e40af;
  cursor: pointer;
  transition: background 0.15s ease;
}

.public-url-notice:hover {
  background: #dbeafe;
}

/* ============================================================
   ELLIPSIS
   ============================================================ */
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>