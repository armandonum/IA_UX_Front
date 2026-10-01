<!-- EstudianteProyectosView.vue -->
<template>
  <div class="q-pa-lg">
    <div class="text-h5 text-weight-bold q-mb-md">
      Selecciona un proyecto para evaluar
    </div>

    <ClientIdInput
      :model-value="figmaSession.clientId"
      @update:model-value="figmaSession.setClientId"
    />

    <q-banner
      v-if="clientIdError"
      dense
      roundeda
      class="bg-negative text-white q-mb-md"
      style="max-width: 420px"
    >
      {{ clientIdError }}
    </q-banner>

    <q-banner
      v-if="error"
      dense
      rounded
      class="bg-negative text-white q-mb-md"
    >
      {{ error }}
    </q-banner>

    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="project in projects"
        :key="project.projectId"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <ProjectCard
          :project="project"
          @select="irAEvaluacion"
          @open-prototype="abrirPrototipo"
        />
      </div>
    </div>

    <div
      v-if="!loading && !error && projects.length === 0"
      class="text-center text-grey-6 q-mt-xl"
    >
      No hay proyectos disponibles.
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useFigmaProjects } from '@/composables/useFigmaProjects'
import { useFigmaSessionStore } from '@/stores/figmaSession.store'
import ClientIdInput from '@/components/estudiante/figma/ClientIdInput.vue'
import ProjectCard from '@/components/estudiante/figma/ProjectCard.vue'
import type { FigmaProject } from '@/types/figmaProject'

const router = useRouter()
const $q = useQuasar()
const figmaSession = useFigmaSessionStore()
const { projects, loading, error, fetchProjects } = useFigmaProjects()

const clientIdError = ref<string | null>(null)

onMounted(fetchProjects)

/**
 * Entra a la evaluación del proyecto
 */
function irAEvaluacion(project: FigmaProject) {
  if (!figmaSession.clientId.trim()) {
    clientIdError.value = 'Ingresa el Client ID de Figma antes de continuar.'
    return
  }
  clientIdError.value = null

  figmaSession.selectProject({
    projectId: project.projectId,
    fileKey: project.fileKey,
    projectName: project.projectName,
    publicUrl: project.publicUrl,     // 🆕 Guardar URL en el store
  })

  router.push({
    name: 'estudiante-evaluacion',
    params: { fileKey: project.fileKey },
  })
}

/**
 * Abre el prototipo público en una nueva pestaña
 */
function abrirPrototipo(project: FigmaProject) {
  if (!project.publicUrl) {
    $q.notify({
      type: 'warning',
      message: 'Este proyecto no tiene URL pública configurada.',
    })
    return
  }

  window.open(project.publicUrl, '_blank', 'noopener,noreferrer')
}
</script>