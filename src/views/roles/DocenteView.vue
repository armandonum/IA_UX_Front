<template>
  <q-page>
    <div class="q-pa-lg" style="max-width: 1100px; margin: 0 auto;">

      <!-- ================= HEADER ================= -->
      <div class="q-mb-lg">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h5 text-weight-bold text-grey-9">Panel del docente</div>
            <div class="text-body2 text-grey-6">
              Gestiona estudiantes, proyectos de Figma, coordinadores, tareas y flujos de evaluación.
            </div>
          </div>

          <!-- Semestre actual (el selector está en la barra superior, global) -->
          <div v-if="selectedSemester" class="text-caption text-grey-7">
            <q-icon name="calendar_month" size="16px" class="q-mr-xs" />
            {{ selectedSemester.name }} ({{ selectedSemester.code }})
            <q-badge
              :color="selectedSemester.isActive ? 'positive' : 'grey-6'"
              class="q-ml-sm q-px-sm q-py-xs"
            >
              {{ selectedSemester.isActive ? 'Activo' : 'Inactivo' }}
            </q-badge>
          </div>
        </div>
      </div>

      <q-card flat bordered>
        <q-tabs
          v-model="tab"
          dense
          align="left"
          active-color="primary bg-white"
          indicator-color="primary"
          class="bg-primary text-white"
        >
          <q-tab name="estudiantes" icon="group" label="Estudiantes" />
          <q-tab name="proyectos" icon="dashboard" label="Proyectos" />
          <q-tab name="coordinadores" icon="fact_check" label="Coordinadores" />
          <q-tab name="tareas" icon="assignment" label="Tareas" />
          <q-tab name="flujos" icon="alt_route" label="Flujos" />
          <q-tab name="questionarios" icon="fact_check" label="Cuestionarios" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="estudiantes">
            <StudentsPanel :semester-id="selectedSemesterId" />
          </q-tab-panel>

          <q-tab-panel name="proyectos">
            <ProjectsPanel :semester-id="selectedSemesterId" />
          </q-tab-panel>

          <q-tab-panel name="coordinadores">
            <ReviewersPanel :semester-id="selectedSemesterId" />
          </q-tab-panel>

          <q-tab-panel name="tareas">
            <TasksPanel :semester-id="selectedSemesterId" />
          </q-tab-panel>

          <q-tab-panel name="flujos">
            <FlowsPanel :semester-id="selectedSemesterId" />
          </q-tab-panel>

          <q-tab-panel name="questionarios">
            <Questionaries :semester-id="selectedSemesterId" />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSemesterStore } from '@/stores/semester.store'
import { useDocenteStore } from '@/stores/docente.stores'

import StudentsPanel from '@/components/docente/StudentsPanel.vue'
import ProjectsPanel from '@/components/docente/ProyectsPanel.vue'
import ReviewersPanel from '@/components/docente/ReviewersPanel.vue'
import TasksPanel from '@/components/docente/TasksPanel.vue'
import FlowsPanel from '@/components/docente/FlowsPanel.vue'
import Questionaries from '@/components/docente/Questionaries.vue'

const semesterStore = useSemesterStore()
const docenteStore = useDocenteStore()

const tab = ref('estudiantes')

// ✅ Semestre actual: fuente única de verdad en semesterStore
const selectedSemesterId = computed(
  () => semesterStore.currentSemester?.semesterId ?? null,
)

const selectedSemester = computed(() => semesterStore.currentSemester)

onMounted(async () => {
  if (semesterStore.semesters.length === 0) {
    await semesterStore.fetchSemesters()
  }
  if (!semesterStore.currentSemester && semesterStore.semesters.length > 0) {
    const active =
      semesterStore.semesters.find((s) => s.isActive) || semesterStore.semesters[0]
    if (active) semesterStore.setCurrentSemester(active.semesterId)
  }
  await docenteStore.fetchProjects()
})
</script>