<!-- components/common/SemesterSelector.vue -->
<template>
  <div class="row items-center q-gutter-sm">
    <q-select
      v-model="selectedSemesterId"
      filled
      dense
      bg-color="white"
      style="min-width: 220px"
      :options="semesters"
      option-label="displayName"
      option-value="semesterId"
      label="Semestre"
      emit-value
      map-options
      :loading="loading"
    >
      <template v-slot:prepend>
        <q-icon name="calendar_month" color="primary" />
      </template>

      <template v-slot:after>
        <q-btn flat dense round icon="add" color="primary" @click="openCreateDialog">
          <q-tooltip>Crear nuevo semestre</q-tooltip>
        </q-btn>
      </template>

      <template v-slot:no-option>
        <div class="text-center q-pa-md">
          <div class="text-grey-6">No hay semestres</div>
          <q-btn flat dense color="primary" label="Crear primero" @click="openCreateDialog" />
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

    <!-- Dialog: crear semestre -->
    <q-dialog v-model="createDialog">
      <q-card style="width: 500px; max-width: 95vw;">
        <q-card-section>
          <div class="text-h6">Crear nuevo semestre</div>
          <div class="text-caption text-grey-6">
            Los semestres permiten organizar estudiantes, proyectos y evaluaciones.
          </div>
        </q-card-section>

        <q-form @submit.prevent="onCreate">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="form.name"
              filled
              label="Nombre (ej. 1/26)"
              hint="Identificador corto del semestre"
              :rules="[required]"
            />

            <q-input
              v-model="form.code"
              filled
              label="Código (ej. 2026-1)"
              hint="Código único para el semestre"
              :rules="[required]"
            />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="form.startDate"
                  filled
                  type="date"
                  label="Fecha inicio"
                  :rules="[required]"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="form.endDate"
                  filled
                  type="date"
                  label="Fecha fin"
                  :rules="[required]"
                />
              </div>
            </div>

            <q-checkbox v-model="form.isActive" label="Activar este semestre" />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" @click="createDialog = false" />
            <q-btn
              unelevated
              color="primary"
              type="submit"
              label="Crear semestre"
              :loading="creating"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useSemesterStore } from '@/stores/semester.store'

const $q = useQuasar()
const semesterStore = useSemesterStore()

const loading = ref(false)
const creating = ref(false)
const createDialog = ref(false)

const form = reactive({
  name: '',
  code: '',
  startDate: '',
  endDate: '',
  isActive: true,
})

const required = (val: string) => !!val || 'Campo obligatorio'

// Opciones para el select
const semesters = computed(() =>
  semesterStore.semesters.map((s) => ({
    ...s,
    displayName: `${s.name} (${s.code})`,
  })),
)

const selectedSemester = computed(() => semesterStore.currentSemester)

// v-model respaldado por el store (fuente única de verdad)
const selectedSemesterId = computed<string | null>({
  get: () => semesterStore.currentSemester?.semesterId ?? null,
  set: (val) => {
    if (val) semesterStore.setCurrentSemester(val)
  },
})

function onSemesterChange() {
  // El setter del computed ya actualiza el store; los consumidores
  // reaccionan a semesterStore.currentSemester.
}

async function ensureSemesters() {
  if (semesterStore.semesters.length === 0) {
    loading.value = true
    try {
      await semesterStore.fetchSemesters()
    } catch {
      // silencioso: el componente puede mostrarse sin semestres
    } finally {
      loading.value = false
    }
  }

  // Garantizar que siempre haya un semestre seleccionado
  if (!semesterStore.currentSemester && semesterStore.semesters.length > 0) {
    const active =
      semesterStore.semesters.find((s) => s.isActive) || semesterStore.semesters[0]
    if (active) semesterStore.setCurrentSemester(active.semesterId)
  }
}

function openCreateDialog() {
  form.name = ''
  form.code = ''
  form.startDate = ''
  form.endDate = ''
  form.isActive = true
  createDialog.value = true
}

async function onCreate() {
  creating.value = true
  try {
    const newSemester = await semesterStore.createSemester({
      name: form.name,
      code: form.code,
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
    })

    $q.notify({
      type: 'positive',
      message: `Semestre "${form.name}" creado exitosamente`,
    })

    createDialog.value = false
    if (newSemester?.semesterId) {
      semesterStore.setCurrentSemester(newSemester.semesterId)
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo crear el semestre',
    })
  } finally {
    creating.value = false
  }
}

onMounted(ensureSemesters)
</script>
