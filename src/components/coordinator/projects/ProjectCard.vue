<template>
  <q-card
    class="project-card cursor-pointer"
    @click="$emit('view', project)"
  >
    <!-- ================= IMAGEN ================= -->
    <div class="project-image-container">
      <q-img
        v-if="project.thumbnailUrl"
        :src="project.thumbnailUrl"
        height="160px"
        fit="cover"
        class="project-image"
      >
        <template #error>
          <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
            <q-icon name="image_not_supported" size="32px" />
          </div>
        </template>
        <template #loading>
          <div class="absolute-full flex flex-center bg-grey-2">
            <q-spinner color="primary" size="32px" />
          </div>
        </template>
      </q-img>
      <div v-else class="absolute-full flex flex-center bg-grey-2 text-grey-6">
        <div class="text-center">
          <q-icon name="palette" size="48px" />
          <div class="text-caption q-mt-xs">Sin previsualización</div>
        </div>
      </div>

      <!-- Badge de estado -->
      <q-badge
        :color="getStatusColor(project.status)"
        text-color="white"
        class="project-status-badge"
      >
        <q-icon :name="getStatusIcon(project.status)" size="12px" class="q-mr-xs" />
        {{ getStatusLabel(project.status) }}
      </q-badge>

      <!-- Overlay con indicador "click para ver" -->
      <div class="project-overlay">
        <q-icon name="open_in_new" size="24px" />
        <span class="q-ml-xs">Ver detalle</span>
      </div>
    </div>

    <!-- ================= INFO ================= -->
    <q-card-section class="q-pb-sm">
      <div class="text-subtitle1 text-weight-bold ellipsis-2 q-mb-xs">
        {{ project.projectName }}
      </div>

      <div class="row items-center q-gutter-xs text-caption text-grey-6">
        <div class="row items-center">
          <q-icon name="code" size="14px" class="q-mr-xs" />
          <span class="ellipsis" style="max-width: 160px">
            {{ project.fileKey }}
          </span>
        </div>
      </div>

      <div class="row items-center q-gutter-md text-caption text-grey-6 q-mt-xs">
        <div class="row items-center">
          <q-icon name="update" size="14px" class="q-mr-xs" />
          {{ formatDate(project.lastModified) }}
        </div>
        <div v-if="project.version" class="row items-center">
          <q-icon name="tag" size="14px" class="q-mr-xs" />
          v{{ project.version }}
        </div>
      </div>
    </q-card-section>

    <!-- ================= ACCIONES ================= -->
    <q-separator />

    <q-card-actions class="q-pa-sm">
      <!-- Botón principal: Ver detalle -->
      <q-btn
        unelevated
        color="primary"
        icon="visibility"
        label="Ver detalle"
        size="sm"
        class="col"
        @click.stop="$emit('view', project)"
      />

      <!-- Botón secundario: Editar -->
      <q-btn
        flat
        dense
        icon="edit"
        color="primary"
        size="sm"
        @click.stop="$emit('edit', project)"
      >
        <q-tooltip>Editar proyecto</q-tooltip>
      </q-btn>

      <!-- Botón secundario: Eliminar -->
      <q-btn
        flat
        dense
        icon="delete"
        color="negative"
        size="sm"
        @click.stop="$emit('delete', project)"
      >
        <q-tooltip>Eliminar proyecto</q-tooltip>
      </q-btn>
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

// ============================================================
// HELPERS
// ============================================================
function formatDate(date: string): string {
  if (!date) return 'No disponible'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getStatusColor(status?: string): string {
  const colors: Record<string, string> = {
    active: 'positive',
    inactive: 'grey',
    draft: 'warning',
    archived: 'grey-7',
  }
  return colors[status || 'active'] || 'positive'
}

function getStatusLabel(status?: string): string {
  const labels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    draft: 'Borrador',
    archived: 'Archivado',
  }
  return labels[status || 'active'] || 'Activo'
}

function getStatusIcon(status?: string): string {
  const icons: Record<string, string> = {
    active: 'check_circle',
    inactive: 'pause_circle',
    draft: 'edit',
    archived: 'archive',
  }
  return icons[status || 'active'] || 'check_circle'
}
</script>

<style scoped>
.project-card {
  transition: all 0.2s ease;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  position: relative;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(30, 58, 138, 0.15);
  border-color: #1e3a8a;
}

/* ============================================================
   IMAGEN
   ============================================================ */
.project-image-container {
  position: relative;
  overflow: hidden;
  background: #f8fafc;
}

.project-image {
  transition: transform 0.3s ease;
}

.project-card:hover .project-image {
  transform: scale(1.05);
}

/* ============================================================
   BADGE DE ESTADO
   ============================================================ */
.project-status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

/* ============================================================
   OVERLAY "VER DETALLE"
   ============================================================ */
.project-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 58, 138, 0.75);
  color: white;
  font-weight: 600;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.25s ease;
  z-index: 1;
}

.project-card:hover .project-overlay {
  opacity: 1;
}

/* ============================================================
   INFO
   ============================================================ */
.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============================================================
   ACCIONES
   ============================================================ */
.project-card :deep(.q-card__actions) {
  margin-top: auto;
}
</style>