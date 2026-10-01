<!-- components/estudiante/figma/ProjectCard.vue -->
<template>
  <q-card class="project-card cursor-pointer" @click="$emit('select', project)">
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

      <!-- Badge "URL disponible" -->
      <q-badge
        v-if="project.publicUrl"
        color="positive"
        text-color="white"
        class="project-url-badge"
      >
        <q-icon name="link" size="12px" class="q-mr-xs" />
        Prototipo listo
      </q-badge>

      <!-- Overlay hover -->
      <div class="project-overlay">
        <q-icon name="play_circle" size="32px" />
        <span class="q-ml-xs">Iniciar evaluación</span>
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
        <div v-if="project.lastModified" class="row items-center">
          <q-icon name="update" size="14px" class="q-mr-xs" />
          {{ formatDate(project.lastModified) }}
        </div>
        <div v-if="project.version" class="row items-center">
          <q-icon name="tag" size="14px" class="q-mr-xs" />
          v{{ project.version }}
        </div>
      </div>
    </q-card-section>

    <!-- ================= AVISO URL PÚBLICA ================= -->
    <div
      v-if="project.publicUrl"
      class="public-url-notice q-px-sm q-py-xs"
      @click.stop="abrirPrototipo"
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

    <!-- ================= ACCIONES ================= -->
    <q-separator />

    <q-card-actions class="q-pa-sm">
      <q-btn
        unelevated
        color="primary"
        icon="play_arrow"
        label="Iniciar evaluación"
        size="sm"
        class="col"
        @click.stop="$emit('select', project)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import type { FigmaProject } from '@/types/figmaProject'

const props = defineProps<{
  project: FigmaProject
}>()

const emit = defineEmits<{
  (e: 'select', project: FigmaProject): void
  (e: 'open-prototype', project: FigmaProject): void
}>()

const $q = useQuasar()

// ============================================================
// HELPERS
// ============================================================
function formatDate(date: string): string {
  if (!date) return 'No disponible'
  try {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return date
  }
}

function abrirPrototipo() {
  if (!props.project.publicUrl) {
    $q.notify({
      type: 'warning',
      message: 'Este proyecto no tiene URL pública configurada.',
    })
    return
  }
  window.open(props.project.publicUrl, '_blank', 'noopener,noreferrer')
  emit('open-prototype', props.project)
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
   BADGE DE URL DISPONIBLE
   ============================================================ */
.project-url-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

/* ============================================================
   OVERLAY HOVER
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
   ACCIONES
   ============================================================ */
.project-card :deep(.q-card__actions) {
  margin-top: auto;
}
</style>