  <!-- components/estudiante/figma/ProjectCard.vue -->
  <template>
    <q-card class="cursor-pointer full-height" clickable @click="$emit('select', project)">

      <q-img :src="project.thumbnailUrl" :ratio="16 / 10">
        <template #error>
          <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
            Sin miniatura
          </div>
        </template>
      </q-img>

      <q-card-section>
        <div class="text-subtitle1 text-weight-medium ellipsis">
          {{ project.projectName }}
        </div>
        <div class="text-caption text-grey-6">
          Modificado: {{ fechaFormateada }}
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          color="primary"
          icon="play_arrow"
          label="Evaluar"
          @click.stop="$emit('select', project)"
        />
      </q-card-actions>

    </q-card>
  </template>

  <script setup lang="ts">
  import { computed } from 'vue'
  import type { FigmaProject } from '@/types/figmaProject'

  const props = defineProps<{
    project: FigmaProject
  }>()

  defineEmits<{
    (e: 'select', project: FigmaProject): void
  }>()
  console.log("la miniatura de :", props.project.thumbnailUrl)
  const fechaFormateada = computed(() => {
    try {
      return new Intl.DateTimeFormat('es-BO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(props.project.lastModified))
    } catch {
      return props.project.lastModified
    }
  })
  </script>