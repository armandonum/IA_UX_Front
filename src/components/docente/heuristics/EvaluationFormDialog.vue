<!-- components/docente/heuristics/EvaluationFormDialog.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 620px; max-width: 750px;">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h6">
              {{ isEdit ? 'Editar evaluación' : 'Nueva evaluación heurística' }}
            </div>
            <div class="text-caption">
              {{
                isEdit
                  ? 'Modifica los datos de la evaluación'
                  : 'Configura una nueva evaluación por expertos'
              }}
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" @click="close" />
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit">
        <q-card-section class="q-gutter-md" style="max-height: 65vh; overflow-y: auto;">
          <!-- Nombre -->
          <q-input
            v-model="form.name"
            filled
            label="Nombre de la evaluación *"
            placeholder="Ej: Evaluación Nielsen - Sistema de reservas"
            :rules="[(v) => !!v || 'El nombre es requerido']"
            autofocus
          />

          <div class="row q-col-gutter-md">
            <!-- Framework -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.frameworkId"
                :options="frameworks"
                option-label="name"
                option-value="frameworkId"
                emit-value
                map-options
                filled
                label="Framework *"
                :loading="loadingFrameworks"
                :rules="[(v) => !!v || 'Selecciona un framework']"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon name="menu_book" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.name }}</q-item-label>
                      <q-item-label caption>
                        {{ scope.opt.author || 'Sin autor' }}
                        <span v-if="scope.opt.year"> • {{ scope.opt.year }}</span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey-6">
                      No hay frameworks activos disponibles
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Proyecto -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.projectId"
                :options="projects"
                option-label="projectName"
                option-value="projectId"
                emit-value
                map-options
                filled
                label="Proyecto *"
                :loading="loadingProjects"
                :rules="[(v) => !!v || 'Selecciona un proyecto']"
                :disable="isEdit"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon name="folder" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.projectName }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.fileKey }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey-6">
                      No hay proyectos disponibles
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <div v-if="isEdit" class="text-caption text-grey-6 q-mt-xs">
                <q-icon name="lock" size="12px" />
                El proyecto no se puede cambiar
              </div>
            </div>
          </div>

          <!-- Descripción -->
          <q-input
            v-model="form.description"
            filled
            type="textarea"
            autogrow
            label="Descripción"
            placeholder="Ej: Evaluación heurística del sistema X con expertos UX"
            :rows="2"
          />

          <!-- Sistema a evaluar -->
          <q-input
            v-model="form.systemDescription"
            filled
            type="textarea"
            autogrow
            label="Sistema a evaluar"
            placeholder="Ej: Aplicación de turismo en Sucre"
            :rows="2"
          />

          <!-- Usuarios objetivo -->
          <q-input
            v-model="form.targetUserDescription"
            filled
            type="textarea"
            autogrow
            label="Usuarios objetivo"
            placeholder="Ej: Turistas nacionales y extranjeros"
            :rows="2"
          />

          <div class="row q-col-gutter-md">
            <!-- Duración -->
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.maxDurationMinutes"
                filled
                type="number"
                label="Duración máxima (minutos)"
                :min="1"
                :max="240"
                :rules="[
                  (v) => !v || (v >= 1 && v <= 240) || 'Debe estar entre 1 y 240',
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="timer" />
                </template>
              </q-input>
            </div>

            <!-- Estado -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                filled
                label="Estado inicial"
              >
                <template v-slot:prepend>
                  <q-icon name="flag" />
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="close" />
          <q-btn
            unelevated
            color="primary"
            type="submit"
            :label="isEdit ? 'Actualizar' : 'Crear evaluación'"
            :loading="saving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth.store'
import { useDocenteStore } from '@/stores/docente.stores'
import {
  heuristicApi,
  type HeuristicEvaluation,
  type HeuristicFramework,
} from '@/api/heuristic.api'

const props = defineProps<{
  modelValue: boolean
  evaluation?: HeuristicEvaluation | null
  saving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
}>()

const $q = useQuasar()
const auth = useAuthStore()
const docenteStore = useDocenteStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEdit = computed(() => !!props.evaluation)

// ============================================================
// STATE
// ============================================================
const frameworks = ref<HeuristicFramework[]>([])
const loadingFrameworks = ref(false)
const loadingProjects = ref(false)

const form = reactive({
  name: '',
  frameworkId: '',
  projectId: '',
  description: '',
  systemDescription: '',
  targetUserDescription: '',
  maxDurationMinutes: 20,
  status: 'draft',
})

const statusOptions = [
  { label: 'Borrador', value: 'draft' },
  { label: 'Planificación', value: 'planning' },
  { label: 'En progreso', value: 'in_progress' },
]

// ============================================================
// COMPUTED
// ============================================================
const projects = computed(() => docenteStore.projects)

// ============================================================
// LOAD
// ============================================================
async function loadFrameworks() {
  loadingFrameworks.value = true
  try {
    const { data } = await heuristicApi.getFrameworks()
    // Solo activos
    frameworks.value = data.filter((f) => f.isActive)
  } catch (e) {
    console.error('Error cargando frameworks:', e)
  } finally {
    loadingFrameworks.value = false
  }
}

async function loadProjects() {
  if (docenteStore.projects.length > 0) return

  loadingProjects.value = true
  try {
    await docenteStore.fetchProjects()
  } catch (e) {
    console.error('Error cargando proyectos:', e)
  } finally {
    loadingProjects.value = false
  }
}

// ============================================================
// FORM
// ============================================================
function resetForm() {
  form.name = ''
  form.frameworkId = ''
  form.projectId = ''
  form.description = ''
  form.systemDescription = ''
  form.targetUserDescription = ''
  form.maxDurationMinutes = 20
  form.status = 'draft'
}

function fillForm(ev: HeuristicEvaluation) {
  form.name = ev.name
  form.frameworkId = ev.frameworkId
  form.projectId = ev.projectId
  form.description = ev.description || ''
  form.systemDescription = ev.systemDescription || ''
  form.targetUserDescription = ev.targetUserDescription || ''
  form.maxDurationMinutes = ev.maxDurationMinutes
  form.status = ev.status
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await Promise.all([loadFrameworks(), loadProjects()])
      if (props.evaluation) {
        fillForm(props.evaluation)
      } else {
        resetForm()
      }
    }
  },
)

function close() {
  visible.value = false
  resetForm()
}

// ============================================================
// SUBMIT
// ============================================================
function onSubmit() {
  const supervisorId = auth.user?.user_id
  if (!supervisorId && !isEdit.value) {
    $q.notify({
      type: 'negative',
      message: 'No hay usuario autenticado',
    })
    return
  }

  const payload: any = {
    name: form.name.trim(),
    frameworkId: form.frameworkId,
    projectId: form.projectId,
    description: form.description?.trim() || undefined,
    systemDescription: form.systemDescription?.trim() || undefined,
    targetUserDescription: form.targetUserDescription?.trim() || undefined,
    maxDurationMinutes: form.maxDurationMinutes,
    status: form.status,
  }

  if (!isEdit.value) {
    payload.supervisorId = supervisorId
  }

  emit('save', payload)
}
</script>