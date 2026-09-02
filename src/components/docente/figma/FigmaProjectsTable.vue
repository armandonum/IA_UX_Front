<template>
  <q-table
    flat
    bordered
    :rows="rows"
    :columns="columns"
    row-key="project_id"
    :loading="loading"
  >
<template #body-cell-thumbnailUrl="props">
  <q-td :props="props">
    <q-img
      v-if="props.value"
      :src="props.value"
      fit="cover"
      style="width: 140px; height: 80px"
      class="rounded-borders cursor-pointer bg-secondary"
      @click="openImage(props.value)"
    >
      <template #error>
        <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
          Sin imagen
        </div>
      </template>

      <q-tooltip>Ver imagen completa</q-tooltip>
    </q-img>

    <span v-else class="text-grey-5">—</span>
  </q-td>
</template>

    <template #body-cell-last_modified="props">
      <q-td :props="props">
        {{ formatDate(props.row.last_modified) }}
      </q-td>
    </template>

    <template #body-cell-actions="props">
      <q-td
        :props="props"
        class="text-right"
      >
        <q-btn
          flat
          round
          dense
          icon="sync"
          color="primary"
          :loading="resyncing === props.row.project_id"
          @click="onResync(props.row)"
        >
          <q-tooltip>
            Volver a sincronizar desde Figma
          </q-tooltip>
        </q-btn>

        <q-btn
          flat
          round
          dense
          color="primary"
          icon="edit"
          @click="emit('edit', props.row)"
        >
          <q-tooltip>
            Editar
          </q-tooltip>
        </q-btn>

        <q-btn
          flat
          round
          dense
          color="negative"
          icon="delete"
          @click="onRemove(props.row)"
        >
          <q-tooltip>
            Eliminar
          </q-tooltip>
        </q-btn>
      </q-td>
    </template>

  </q-table>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useDocenteStore } from '@/stores/docente.stores'
import { figmaProjectsApi } from '@/api/docente.api'
import type { FigmaProject } from '@/types/docente.types'


const props = defineProps<{
  rows: FigmaProject[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', row: FigmaProject): void
}>()

const $q = useQuasar()
const store = useDocenteStore()
const resyncing = ref<string | null>(null)
  
const columns = [
  { name: 'projectName', label: 'Nombre', field: 'projectName', align: 'left' as const },
  { name: 'fileKey', label: 'File key', field: 'fileKey', align: 'left' as const },
  { name: 'thumbnailUrl', label: 'Miniatura', field: 'thumbnailUrl', type: 'url', align: 'left' as const },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
]

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function onResync(row: FigmaProject) {
  resyncing.value = row.projectId
  try {
    await figmaProjectsApi.resync(row.projectId)
    $q.notify({ type: 'positive', message: 'Nodos resincronizados' })
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'No se pudo resincronizar' })
  } finally {
    resyncing.value = null
  }
}

function openImage(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function onRemove(row: FigmaProject) {
  $q.dialog({
    title: 'Eliminar proyecto',
    message: `¿Seguro que deseas eliminar "${row.projectName}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    try {

      const index = store.projects.findIndex((p) => p.projectId === row.projectId)
      if (index !== -1) {
        store.projects.splice(index, 1)
      }
      $q.notify({ type: 'positive', message: 'Proyecto eliminado' })
    } catch (e: any) {
      $q.notify({ type: 'negative', message: e.message ?? 'No se pudo eliminar el proyecto' })
    }
  })
}
</script>