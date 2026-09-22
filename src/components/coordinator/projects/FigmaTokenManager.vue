<template>
  <div>
    <!-- Banner si no hay token -->
    <q-banner
      v-if="!connection"
      rounded
      class="bg-orange-1 text-orange-10 q-mb-md"
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>

      <div class="row items-center full-width">
        <div class="col">
          <div class="text-weight-bold">Token de Figma no configurado</div>
          <div class="text-caption">
            Configura tu Personal Access Token de Figma para poder importar proyectos
          </div>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            color="orange"
            label="Configurar Token"
            @click="openTokenDialog"
          />
        </div>
      </div>
    </q-banner>

    <!-- Info si hay token -->
    <q-card
      v-else
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section class="row items-center no-wrap">
        <q-avatar color="primary" text-color="white" icon="link" />

        <div class="q-ml-md col">
          <div class="text-subtitle2">
            Conexión Figma
          </div>
          <div class="text-caption text-grey-6">
            Token configurado: {{ connection.name || 'Conexión Figma' }}
            <span class="text-grey-5 q-ml-sm">
              ({{ maskToken(connection.personalAccessToken) }})
            </span>
          </div>
        </div>

        <q-chip color="positive" text-color="white" icon="check_circle">
          Conectado
        </q-chip>

        <q-btn
          flat
          round
          dense
          icon="edit"
          @click="openTokenDialog"
        >
          <q-tooltip>Editar Token</q-tooltip>
        </q-btn>

        <q-btn
          flat
          round
          dense
          icon="delete"
          color="negative"
          @click="confirmDelete"
        >
          <q-tooltip>Eliminar Token</q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card>

    <!-- Dialog: Configurar/Editar Token -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 450px; max-width: 500px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            {{ connection ? 'Editar Token Figma' : 'Configurar Token Figma' }}
          </div>
          <div class="text-subtitle2">
            Ingresa tu Personal Access Token de Figma
          </div>
        </q-card-section>

        <q-form @submit.prevent="saveToken">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="form.name"
              filled
              label="Nombre de la conexión"
              hint="Ej: Mi conexión Figma"
              :rules="[(v) => !!v || 'Campo obligatorio']"
            />

            <q-input
              v-model="form.token"
              filled
              type="textarea"
              autogrow
              label="Personal Access Token"
              hint="figd_xxxxxxxxxxxxxxxxxxxxxxxxx"
              :rules="[(v) => !!v || 'Campo obligatorio']"
            />

            <div class="text-caption text-grey-6">
              <q-icon name="info" size="14px" />
              Puedes generar tu token en
              <a
                href="https://www.figma.com/developers/apps"
                target="_blank"
                class="text-primary"
              >
                Figma Developers
              </a>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" @click="dialogOpen = false" />
            <q-btn
              unelevated
              color="primary"
              type="submit"
              :label="connection ? 'Actualizar' : 'Guardar'"
              :loading="saving"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useProjectsStore } from '@/stores/coordinator/projects.store'
import type { FigmaConnection } from '@/types/coordinator/projects.types'

const $q = useQuasar()
const projectsStore = useProjectsStore()

const connection = ref<FigmaConnection | null>(null)
const dialogOpen = ref(false)
const saving = ref(false)

const form = ref({
  name: '',
  token: ''
})

// Cargar conexión existente
const loadConnection = async () => {
  try {
    connection.value = await projectsStore.getFigmaConnection()
    if (connection.value) {
      form.value.name = connection.value.name || 'Conexión Figma'
      form.value.token = connection.value.personalAccessToken || ''
    }
  } catch (error) {
    console.error('Error loading connection:', error)
  }
}

// Abrir diálogo para configurar token
const openTokenDialog = () => {
  if (connection.value) {
    form.value.name = connection.value.name || 'Conexión Figma'
    form.value.token = connection.value.personalAccessToken || ''
  } else {
    form.value.name = 'Mi Conexión Figma'
    form.value.token = ''
  }
  dialogOpen.value = true
}

// Guardar token
const saveToken = async () => {
  saving.value = true
  try {
    if (connection.value) {
      // Actualizar conexión existente
      const updated = await projectsStore.updateFigmaConnection(
        connection.value.connectionId,
        form.value.name,
        form.value.token
      )
      connection.value = updated
      $q.notify({
        type: 'positive',
        message: 'Token de Figma actualizado correctamente'
      })
    } else {
      // Crear nueva conexión
      const newConnection = await projectsStore.saveFigmaConnection(
        form.value.name,
        form.value.token
      )
      connection.value = newConnection
      $q.notify({
        type: 'positive',
        message: 'Token de Figma configurado correctamente'
      })
    }
    dialogOpen.value = false
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error al guardar el token'
    })
  } finally {
    saving.value = false
  }
}

// Eliminar token
const confirmDelete = () => {
  if (!connection.value) return

  $q.dialog({
    title: 'Eliminar Token',
    message: '¿Estás seguro de eliminar el token de Figma? Perderás acceso a los proyectos importados.',
    ok: { label: 'Eliminar', color: 'negative' },
    cancel: 'Cancelar',
    persistent: true
  }).onOk(async () => {
    try {
      await projectsStore.deleteFigmaConnection(connection.value!.connectionId)
      connection.value = null
      $q.notify({
        type: 'positive',
        message: 'Token eliminado correctamente'
      })
    } catch (error: any) {
      $q.notify({
        type: 'negative',
        message: error.message || 'Error al eliminar el token'
      })
    }
  })
}

// Enmascarar token para mostrar
const maskToken = (token: string) => {
  if (!token) return ''
  if (token.length <= 8) return token
  return token.substring(0, 4) + '...' + token.substring(token.length - 4)
}

onMounted(() => {
  loadConnection()
})

// Exponer para recargar desde el padre
defineExpose({
  loadConnection
})
</script>