<template>
  <div class="row q-col-gutter-md items-end">
    <div class="col-12 col-md-6">
      <q-select
        :model-value="projectId"
        filled
        :options="projectOptions"
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
import { computed } from 'vue'
import { useDocenteStore } from '@/stores/docente.stores'

const props = defineProps<{
  projectId?: string
  type: 'pretest' | 'posttest'
  semesterId?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:projectId', value: string): void
  (e: 'update:type', value: 'pretest' | 'posttest'): void
}>()

const docenteStore = useDocenteStore()

// Proyectos visibles: solo los del semestre actual (si se especifica)
const projectOptions = computed(() => {
  if (!props.semesterId) return docenteStore.projects
  return docenteStore.projects.filter((p: any) => p.semesterId === props.semesterId)
})
</script>