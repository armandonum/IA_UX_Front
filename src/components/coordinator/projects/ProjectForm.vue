<!-- ProjectForm.vue -->
<template>
  <q-dialog v-model="localOpen" persistent>
    <q-card style="min-width: 550px; max-width: 700px;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">{{ project ? 'Editar Proyecto' : 'Nuevo Proyecto' }}</div>
        <div class="text-subtitle2">Importa tu proyecto desde Figma</div>
        <div v-if="semesterName" class="text-caption q-mt-xs text-white/70">
          Se asignará al semestre: {{ semesterName }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit">
        <q-card-section class="q-gutter-md">
          <!-- File Key -->
          <q-input
            v-model="form.fileKey"
            filled
            label="File Key de Figma"
            hint="El identificador único de tu archivo en Figma"
            :rules="[(v) => !!v || 'Campo obligatorio']"
          >
            <template v-slot:append>
              <q-btn
                flat
                dense
                color="primary"
                icon="help"
                @click="showFileKeyHelp"
              />
            </template>
          </q-input>

          <!-- Nombre del proyecto -->
          <q-input
            v-model="form.projectName"
            filled
            label="Nombre del proyecto"
            hint="Puedes modificarlo antes de guardar"
            :rules="[(v) => !!v || 'Campo obligatorio']"
          />
          <!-- 🆕 URL pública del prototipo -->
<q-input
  v-model="form.publicUrl"
  filled
  label="URL pública del prototipo (opcional)"
  hint="Ej: https://www.figma.com/proto/abc123/Prototipo?node-id=1-2"
  :rules="[
    (v) => !v || /^https?:\/\/.+/.test(v) || 'Debe ser una URL válida'
  ]"
>
  <template v-slot:prepend>
    <q-icon name="link" />
  </template>
  <template v-slot:append v-if="form.publicUrl">
    <q-btn
      flat
      dense
      round
      size="sm"
      icon="open_in_new"
      color="primary"
      :href="form.publicUrl"
      target="_blank"
    >
      <q-tooltip>Abrir en nueva pestaña</q-tooltip>
    </q-btn>
  </template>
</q-input>

          <q-separator />

          <!-- Información obtenida de Figma -->
          <div class="text-subtitle2 text-grey-7">Información obtenida desde Figma</div>

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
  v-if="preview.publicUrl"
  v-model="preview.publicUrl"
  filled
  readonly
  label="URL pública detectada"
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
            style="height: 150px; border-radius: 8px;"
          />

          <div class="row q-gutter-sm">
            <q-btn
              flat
              color="primary"
              icon="cloud_download"
              label="Consultar Figma"
              @click="loadFigmaFile"
              :loading="loadingFile"
            />
            <q-chip v-if="fileLoaded" color="positive" icon="check">
              Datos cargados
            </q-chip>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="close" />
          <q-btn
            unelevated
            color="primary"
            type="submit"
            :label="project ? 'Actualizar' : 'Crear Proyecto'"
            :loading="saving"
            :disable="!fileLoaded && !project"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { useProjectsStore } from '@/stores/coordinator/projects.store'
import { useSemesterStore } from '@/stores/semester.store'
import { useAuthStore } from '@/stores/auth.store'
import { fetchFigmaFile } from '@/api/coordinator/figma.api'
import type { FigmaProject } from '@/types/coordinator/projects.types'

const props = defineProps<{
  modelValue: boolean
  project?: FigmaProject | null
  semesterId?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const $q = useQuasar()
const projectsStore = useProjectsStore()
const semesterStore = useSemesterStore()
const authStore = useAuthStore()

const localOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const saving = ref(false)
const loadingFile = ref(false)
const fileLoaded = ref(false)

const form = reactive({
  fileKey: '',
  projectName: '',
  publicUrl: '' 
})

const preview = reactive({
  version: '',
  lastModified: '',
  thumbnailUrl: '',
  publicUrl: '',  
  rawJson: null
})

const semesterName = computed(() => {
  if (!props.semesterId) return ''
  const sem = semesterStore.semesters.find(s => s.semesterId === props.semesterId)
  return sem ? `${sem.name} (${sem.code})` : ''
})

// Resetear formulario
function resetForm() {
  form.fileKey = ''
  form.projectName = ''
  form.publicUrl = '' 
  preview.version = ''
  preview.lastModified = ''
  preview.thumbnailUrl = ''
  preview.publicUrl = ''
  preview.rawJson = null
  fileLoaded.value = false
}

// Cargar datos para edición
watch(() => props.project, (newProject) => {
  if (newProject) {
    form.fileKey = newProject.fileKey || ''
    form.projectName = newProject.projectName || ''
    form.publicUrl = newProject.publicUrl || '' 
    preview.version = newProject.version || ''
    preview.lastModified = newProject.lastModified || ''
    preview.thumbnailUrl = newProject.thumbnailUrl || ''
    preview.publicUrl = newProject.publicUrl || ''
    fileLoaded.value = true
  } else {
    resetForm()
  }
}, { immediate: true })

// Cargar al abrir el diálogo
watch(() => props.modelValue, (open) => {
  if (open && !props.project) {
    resetForm()
  }
})

function close() {
  emit('update:modelValue', false)
}

// Mostrar ayuda para File Key
function showFileKeyHelp() {
  $q.dialog({
    title: '¿Cómo obtener el File Key?',
    message: `
      1. Abre tu archivo en Figma
      2. La URL tiene el formato: https://www.figma.com/file/<span style="color:#1e3a8a;font-weight:bold">XXXXXXXXXXXX</span>/...
      3. Copia el código resaltado (ej: AbCdEF1234567890)
    `,
    html: true,
    ok: 'Entendido'
  })
}

// Cargar archivo de Figma
async function loadFigmaFile() {
  if (!form.fileKey) {
    $q.notify({ type: 'warning', message: 'Ingresa un File Key primero' })
    return
  }

  // Obtener el token de Figma
  const connection = await projectsStore.getFigmaConnection()
  if (!connection) {
    $q.notify({ 
      type: 'warning', 
      message: 'Configura primero tu Token de Figma en Mi Perfil' 
    })
    return
  }

  loadingFile.value = true
  try {
    const file = await fetchFigmaFile(connection.personalAccessToken, form.fileKey)
    
    preview.version = file.metadata.version
    preview.lastModified = file.metadata.lastModified
    preview.thumbnailUrl = file.metadata.thumbnailUrl
    preview.rawJson = file.raw

    if (!form.projectName) {
      form.projectName = file.metadata.name
    }
if (!form.publicUrl && form.fileKey) {
      const suggested = `https://www.figma.com/proto/${form.fileKey}/Prototipo`
      form.publicUrl = suggested
      preview.publicUrl = suggested
    }
    fileLoaded.value = true

    $q.notify({
      type: 'positive',
      message: 'Información obtenida desde Figma correctamente'
    })
  } catch (error: any) {
    console.error('Error loading Figma file:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo consultar Figma'
    })
  } finally {
    loadingFile.value = false
  }
}

// Guardar proyecto
async function onSubmit() {
  if (!props.semesterId && !props.project) {
    $q.notify({ type: 'warning', message: 'No tienes un semestre asignado' })
    return
  }

  saving.value = true
  try {
    const authUserId = authStore.user?.user_id

    if (props.project) {
      // Editar proyecto
      await projectsStore.updateProject(props.project.projectId, {
        projectName: form.projectName,
        fileKey: form.fileKey,
        publicUrl: form.publicUrl,  
        version: preview.version,
        lastModified: preview.lastModified,
        thumbnailUrl: preview.thumbnailUrl
      })
    } else {
      // Crear proyecto
      const payload = {
        fileKey: form.fileKey,
        projectName: form.projectName,
        publicUrl: form.publicUrl,
        lastModified: preview.lastModified,
        version: preview.version,
        thumbnailUrl: preview.thumbnailUrl,
        rawJson: preview.rawJson,
        createdBy: authUserId,
        semesterId: props.semesterId
      }

      await projectsStore.createProject(payload)
    }

    emit('saved')
    close()
  } catch (error: any) {
    console.error('Error saving project:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al guardar el proyecto'
    })
  } finally {
    saving.value = false
  }
}
</script>