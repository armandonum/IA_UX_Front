<template>
  <q-page>
    <div class="q-pa-lg" style="max-width: 1100px; margin: 0 auto;">

      <!-- ================= HEADER CON SELECTOR DE SEMESTRE ================= -->
      <div class="q-mb-lg">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h5 text-weight-bold text-grey-9">Panel del docente</div>
            <div class="text-body2 text-grey-6">
              Gestiona estudiantes, proyectos de Figma, revisores, tareas y flujos de evaluación.
            </div>
          </div>

          <!-- Selector de Semestre -->
          <div class="row q-gutter-sm items-center">
            <q-select
              v-model="selectedSemesterId"
              filled
              dense
              style="min-width: 200px"
              :options="semesters"
              option-label="displayName"
              option-value="semesterId"
              label="Semestre"
              emit-value
              map-options
              :loading="loadingSemesters"
              @update:model-value="onSemesterChange"
            >
              <template v-slot:prepend>
                <q-icon name="calendar_month" color="primary" />
              </template>

              <template v-slot:after>
                <q-btn flat dense round icon="add" color="primary" @click="openCreateSemesterDialog">
                  <q-tooltip>Crear nuevo semestre</q-tooltip>
                </q-btn>
              </template>

              <template v-slot:no-option>
                <div class="text-center q-pa-md">
                  <div class="text-grey-6">No hay semestres</div>
                  <q-btn flat dense color="primary" label="Crear primero" @click="openCreateSemesterDialog" />
                </div>
              </template>
            </q-select>

            <q-badge
              v-if="selectedSemester"
              :color="selectedSemester.isActive ? 'positive' : 'grey-6'"
              class="q-px-sm q-py-xs"
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
          <q-tab name="revisores" icon="fact_check" label="Revisores" />
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

          <q-tab-panel name="revisores">
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

      <!-- ================= DIALOG: CREAR SEMESTRE ================= -->
      <q-dialog v-model="createSemesterDialog">
        <q-card style="width: 500px; max-width: 95vw;">
          <q-card-section>
            <div class="text-h6">Crear nuevo semestre</div>
            <div class="text-caption text-grey-6">
              Los semestres permiten organizar estudiantes, proyectos y evaluaciones.
            </div>
          </q-card-section>

          <q-form @submit.prevent="onCreateSemester">
            <q-card-section class="q-gutter-md">
              <q-input
                v-model="semesterForm.name"
                filled
                label="Nombre (ej. 1/26)"
                hint="Identificador corto del semestre"
                :rules="[required]"
              />

              <q-input
                v-model="semesterForm.code"
                filled
                label="Código (ej. 2026-1)"
                hint="Código único para el semestre"
                :rules="[required]"
              />

              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <q-input
                    v-model="semesterForm.startDate"
                    filled
                    type="date"
                    label="Fecha inicio"
                    :rules="[required]"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model="semesterForm.endDate"
                    filled
                    type="date"
                    label="Fecha fin"
                    :rules="[required]"
                  />
                </div>
              </div>

              <q-checkbox v-model="semesterForm.isActive" label="Activar este semestre" />
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Cancelar" @click="createSemesterDialog = false" />
              <q-btn
                unelevated
                color="primary"
                type="submit"
                label="Crear semestre"
                :loading="creatingSemester"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useSemesterStore } from '@/stores/semester.store'
import { useDocenteStore } from '@/stores/docente.stores'

import StudentsPanel from '@/components/docente/StudentsPanel.vue'
import ProjectsPanel from '@/components/docente/ProyectsPanel.vue'
import ReviewersPanel from '@/components/docente/ReviewersPanel.vue'
import TasksPanel from '@/components/docente/TasksPanel.vue'
import FlowsPanel from '@/components/docente/FlowsPanel.vue'
import Questionaries from '@/components/docente/Questionaries.vue'

const $q = useQuasar()
const semesterStore = useSemesterStore()
const docenteStore = useDocenteStore()

const tab = ref('estudiantes')
const selectedSemesterId = ref<string | null>(null)
const loadingSemesters = ref(false)
const creatingSemester = ref(false)
const createSemesterDialog = ref(false)

const semesterForm = reactive({
  name: '',
  code: '',
  startDate: '',
  endDate: '',
  isActive: true,
})

const required = (val: string) => !!val || 'Campo obligatorio'

// Computed
const semesters = computed(() => 
  semesterStore.semesters.map(s => ({
    ...s,
    displayName: `${s.name} (${s.code})`,
  }))
)

const selectedSemester = computed(() =>
  semesterStore.semesters.find(s => s.semesterId === selectedSemesterId.value)
)

// Métodos
async function loadSemesters() {
  loadingSemesters.value = true
  try {
    await semesterStore.fetchSemesters()
    
    // Seleccionar el semestre activo por defecto
    const active = semesterStore.semesters.find(s => s.isActive)
    if (active) {
      selectedSemesterId.value = active.semesterId
    } else if (semesterStore.semesters.length > 0) {
      selectedSemesterId.value = semesterStore.semesters[0].semesterId
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudieron cargar los semestres'
    })
  } finally {
    loadingSemesters.value = false
  }
}

function onSemesterChange() {
  // El cambio de semestre se propaga a los paneles a través de props
  // Cada panel escucha el cambio y recarga sus datos
}

function openCreateSemesterDialog() {
  semesterForm.name = ''
  semesterForm.code = ''
  semesterForm.startDate = ''
  semesterForm.endDate = ''
  semesterForm.isActive = true
  createSemesterDialog.value = true
}

async function onCreateSemester() {
  creatingSemester.value = true
  try {
    const newSemester = await semesterStore.createSemester({
      name: semesterForm.name,
      code: semesterForm.code,
      startDate: semesterForm.startDate,
      endDate: semesterForm.endDate,
      isActive: semesterForm.isActive,
    })

    $q.notify({
      type: 'positive',
      message: `Semestre "${semesterForm.name}" creado exitosamente`
    })

    createSemesterDialog.value = false
    await loadSemesters()
    
    // Seleccionar el nuevo semestre
    selectedSemesterId.value = newSemester.semesterId
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo crear el semestre'
    })
  } finally {
    creatingSemester.value = false
  }
}

onMounted(async () => {
  await loadSemesters()
  await docenteStore.fetchProjects()
})
</script>