<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <q-card style="width:700px;max-width:95vw">

      <q-card-section>
        <div class="text-h6">
          {{ editingRow ? 'Editar proyecto' : 'Nuevo proyecto' }}
        </div>
        <div class="text-caption text-grey-6" v-if="semesterId">
          Se asignará al semestre: {{ semesterName }}
        </div>
        <div class="text-caption text-grey-6">
          Introduce únicamente el File Key. El sistema consultará automáticamente la API de Figma usando el token configurado y completará el resto de la información.
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit">
        <q-card-section class="q-gutter-md">

          <q-input
            v-model="form.fileKey"
            filled
            label="File Key"
            :rules="[required]"
          />

          <q-input
            v-model="form.projectName"
            filled
            label="Nombre del proyecto"
            hint="Puede modificarse antes de guardar"
          />

          <q-separator />

          <div class="text-subtitle2">
            Información obtenida desde Figma
          </div>

          <q-input
            v-model="preview.version"
            filled
            readonly
            label="Versión"
          />

          <q-input
            v-model="preview.lastModified"
            filled
            readonly
            label="Última modificación"
          />

          <q-input
            v-model="preview.thumbnailUrl"
            filled
            readonly
            label="Thumbnail"
          />

          <q-img
            v-if="preview.thumbnailUrl"
            :src="preview.thumbnailUrl"
            fit="cover"
            style="height:220px"
            class="rounded-borders"
          />

        </q-card-section>

        <q-card-actions align="between">
          <q-btn
            flat
            color="primary"
            icon="cloud_download"
            label="Consultar Figma"
            @click="loadFigmaFile"
            :loading="loadingFile"
          />

          <div>
            <q-btn
              flat
              label="Cancelar"
              @click="close"
            />
            <q-btn
              unelevated
              color="primary"
              type="submit"
              :loading="creating"
              :label="editingRow ? 'Guardar cambios' : 'Crear proyecto'"
            />
          </div>
        </q-card-actions>
      </q-form>

    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDocenteStore } from '@/stores/docente.stores'
import { useSemesterStore } from '@/stores/semester.store'
import { fetchFigmaFile } from '@/api/docente.api'
import type { FigmaProject } from '@/types/docente.types'

const props = defineProps<{
  modelValue: boolean
  editingRow: FigmaProject | null
  figmaToken: string | null
  semesterId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const $q = useQuasar()
const store = useDocenteStore()
const semesterStore = useSemesterStore()

const required = (val: string) => !!val || 'Campo obligatorio'

const creating = ref(false)
const loadingFile = ref(false)

const form = reactive({ fileKey: '', projectName: '' })
const preview = reactive({ 
  version: '', 
  lastModified: '', 
  thumbnailUrl: '',
  rawJson: null,
})

const semesterName = computed(() => {
  const sem = semesterStore.semesters.find(s => s.semesterId === props.semesterId)
  return sem ? `${sem.name} (${sem.code})` : ''
})

function resetForm() {
  form.fileKey = ''
  form.projectName = ''

  preview.version = ''
  preview.lastModified = ''
  preview.thumbnailUrl = ''
  preview.rawJson = null
}

function prefillFromRow(row: FigmaProject) {
  form.fileKey = row.fileKey
  form.projectName = row.projectName

  preview.version = row.version ?? ''
  preview.lastModified = row.lastModified ?? ''
  preview.thumbnailUrl = row.thumbnailUrl ?? ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.editingRow) {
      prefillFromRow(props.editingRow)
    } else {
      resetForm()
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

async function loadFigmaFile() {
  if (!form.fileKey) {
    $q.notify({
      type: 'warning',
      message: 'Ingresa un File Key primero',
    })
    return
  }

  if (!props.figmaToken) {
    $q.notify({
      type: 'negative',
      message: 'Configura primero tu Token de Figma',
    })
    return
  }

  loadingFile.value = true

  try {
    const file = await fetchFigmaFile(
      props.figmaToken,
      form.fileKey,
    )

    preview.version = file.metadata.version
    preview.lastModified = file.metadata.lastModified
    preview.thumbnailUrl = file.metadata.thumbnailUrl
    preview.rawJson = file.raw

    if (!form.projectName) {
      form.projectName = file.metadata.name
    }

    $q.notify({
      type: 'positive',
      message: 'Información obtenida desde Figma',
    })
  } catch (e: any) {
    $q.notify({
      type: 'negative',
      message: e.message ?? 'No se pudo consultar Figma',
    })
  } finally {
    loadingFile.value = false
  }
}

// 🔥 onSubmit CON LOGS
async function onSubmit() {
  console.log('🚀 ========== INICIO CREACIÓN PROYECTO ==========')
  console.log('📌 semesterId recibido en dialog:', props.semesterId)
  console.log('📌 semesterName:', semesterName.value)
  
  if (!props.semesterId) {
    console.warn('⚠️ No hay semesterId seleccionado')
    $q.notify({
      type: 'warning',
      message: 'Primero selecciona un semestre',
    })
    return
  }

  creating.value = true

  try {
    if (props.editingRow) {
      $q.notify({
        type: 'warning',
        message: 'La edición de proyectos todavía no está soportada por el backend',
      })
      return
    }

    console.log('📦 Datos del proyecto a crear:')
    console.log('  - fileKey:', form.fileKey)
    console.log('  - projectName:', form.projectName)
    console.log('  - version:', preview.version)
    console.log('  - lastModified:', preview.lastModified)
    console.log('  - thumbnailUrl:', preview.thumbnailUrl)
    console.log('  - semesterId:', props.semesterId)

    // 🔥 PASO 1: Crear proyecto con semesterId
    const newProject = await store.createProject({
      fileKey: form.fileKey,
      projectName: form.projectName,
      lastModified: preview.lastModified,
      version: preview.version,
      thumbnailUrl: preview.thumbnailUrl,
      rawJson: preview.rawJson,
      semesterId: props.semesterId,
    })

    console.log('✅ Proyecto creado exitosamente:')
    console.log('  - projectName:', newProject.projectName)

    // 🔥 PASO 2: Asignar proyecto al semestre (registro en semester_projects)
    console.log('📌 Asignando proyecto al semestre...')
    console.log('  - semesterId:', props.semesterId)
    console.log('  - projectId:', newProject.projectId)
    
    await store.assignProjectToSemester(props.semesterId, newProject.projectId)
    
    console.log('✅ Asignación completada: proyecto registrado en semester_projects')

    $q.notify({
      type: 'positive',
      message: 'Proyecto creado y asignado al semestre',
    })

    emit('saved')
    close()
    resetForm()
  } catch (e: any) {
    console.error('❌ Error en onSubmit:', e)
    console.error('❌ Detalles del error:', e.message)
    console.error('❌ Stack:', e.stack)
    
    $q.notify({
      type: 'negative',
      message: e.message ?? 'No se pudo guardar el proyecto',
    })
  } finally {
    creating.value = false
    console.log('🏁 ========== FIN CREACIÓN PROYECTO ==========')
  }
}
</script>