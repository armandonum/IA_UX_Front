<template>
  <div>
    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
      <span class="q-ml-sm text-grey-6">Cargando proyectos...</span>
    </div>

    <div v-else-if="projects.length === 0" class="text-center q-py-xl">
      <q-icon name="folder_open" size="64px" color="grey-6" />
      <div class="text-h6 text-grey-6 q-mt-md">No hay proyectos</div>
      <div class="text-grey-5">Crea tu primer proyecto de Figma</div>
      <q-btn
        color="primary"
        icon="add"
        label="Nuevo Proyecto"
        class="q-mt-md"
        @click="$emit('create')"
      />
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="project in projects"
        :key="project.projectId"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <ProjectCard
          :project="project"
          @edit="$emit('edit', project)"
          @delete="$emit('delete', project)"
          @view="$emit('view', project)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProjectCard from './ProjectCard.vue'
import type { FigmaProject } from '@/types/coordinator/projects.types'

defineProps<{
  projects: FigmaProject[]
  loading: boolean
}>()

defineEmits<{
  (e: 'edit', project: FigmaProject): void
  (e: 'delete', project: FigmaProject): void
  (e: 'view', project: FigmaProject): void
  (e: 'create'): void
}>()
</script>