<template>
  <div class="row q-col-gutter-md items-end">
    <div class="col-12 col-md-6">
      <q-select
        :model-value="projectId"
        filled
        :options="docenteStore.projects"
        option-label="projectName"
        option-value="projectId"
        label="Proyecto"
        emit-value
        map-options
        @update:model-value="val => emit('update:projectId', val)"
      />
    </div>

    <div class="col-12 col-md-6">
      <q-btn-toggle
        :model-value="type"
        spread
        no-caps
        toggle-color="primary"
        :options="[
          { label: 'Pre-Test', value: 'pretest' },
          { label: 'Post-Test', value: 'posttest' },
        ]"
        @update:model-value="val => emit('update:type', val)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDocenteStore } from '@/stores/docente.stores'

defineProps<{
  projectId?: string
  type: 'pretest' | 'posttest'
}>()

const emit = defineEmits<{
  (e: 'update:projectId', value: string): void
  (e: 'update:type', value: 'pretest' | 'posttest'): void
}>()

const docenteStore = useDocenteStore()
</script>