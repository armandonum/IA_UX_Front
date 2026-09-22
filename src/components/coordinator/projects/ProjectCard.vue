<template>
  <q-card
    class="project-card cursor-pointer"
    @click="$emit('view', project)"
  >
    <q-img
      v-if="project.thumbnailUrl"
      :src="project.thumbnailUrl"
      height="140px"
      fit="cover"
      class="rounded-borders"
    >
      <template #error>
        <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
          <q-icon name="image_not_supported" size="32px" />
        </div>
      </template>
      <div class="absolute-bottom-right q-pa-sm">
        <q-chip
          :color="project.status === 'active' ? 'positive' : 'grey'"
          text-color="white"
          size="sm"
        >
          {{ project.status || 'Activo' }}
        </q-chip>
      </div>
    </q-img>

    <q-card-section>
      <div class="text-subtitle1 text-weight-bold ellipsis-2">
        {{ project.projectName }}
      </div>
      <div class="text-caption text-grey-6 q-mt-xs">
        <q-icon name="code" size="14px" />
        {{ project.fileKey }}
      </div>
      <div class="text-caption text-grey-6">
        <q-icon name="update" size="14px" />
        {{ formatDate(project.lastModified) }}
      </div>
      <div v-if="project.version" class="text-caption text-grey-6">
        <q-icon name="tag" size="14px" />
        v{{ project.version }}
      </div>
    </q-card-section>

    <q-card-actions align="right" class="q-pt-none">
      <q-btn
        flat
        dense
        icon="visibility"
        color="info"
        @click.stop="$emit('view', project)"
      />
      <q-btn
        flat
        dense
        icon="edit"
        color="primary"
        @click.stop="$emit('edit', project)"
      />
      <q-btn
        flat
        dense
        icon="delete"
        color="negative"
        @click.stop="$emit('delete', project)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import type { FigmaProject } from '@/types/coordinator/projects.types'

defineProps<{
  project: FigmaProject
}>()

defineEmits<{
  (e: 'edit', project: FigmaProject): void
  (e: 'delete', project: FigmaProject): void
  (e: 'view', project: FigmaProject): void
}>()

const formatDate = (date: string) => {
  if (!date) return 'No disponible'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<style scoped>
.project-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>