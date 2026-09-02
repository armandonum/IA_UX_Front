<template>
  <div>
    <!-- Aviso si no existe conexión -->
    <q-banner
      v-if="!connection"
      rounded
      class="bg-orange-1 text-orange-10 q-mb-md"
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>

      Primero debes configurar tu Token Personal de Figma.

      <template #action>
       <q-btn
  flat
  color="orange"
  label="Configurar conexión"
@click="openCreate"
/>
      </template>
    </q-banner>

    <!-- Información conexión -->
    <q-card
      v-else
      flat
      bordered
      class="q-mb-lg"
    >
      <q-card-section class="row items-center no-wrap">

        <q-avatar
          color="primary"
          text-color="white"
          icon="link"
        />

        <div class="q-ml-md col">
          <div class="text-subtitle2">
            Conexión Figma
          </div>
          <div class="text-caption text-grey-6">
            Token configurado para este usuario
          </div>
        </div>

        <q-chip
          color="positive"
          text-color="white"
          icon="check_circle"
        >
          Conectado
        </q-chip>

        <q-btn
          flat
          round
          dense
          icon="edit"
          @click="openEdit"
        >
          <q-tooltip>
            Editar Token
          </q-tooltip>
        </q-btn>

      </q-card-section>
    </q-card>

    <!-- Dialogo de conexión -->
    <q-dialog v-model="dialogOpen">
      <q-card style="width:650px;max-width:95vw">

        <q-card-section>
          <div class="text-h6">
            {{ connection ? 'Editar conexión Figma' : 'Nueva conexión Figma' }}
          </div>
          <div class="text-caption text-grey-6">
            Ingresa tu Personal Access Token generado desde Figma.
          </div>
        </q-card-section>

        <q-form @submit.prevent="submit">
          <q-card-section class="q-gutter-md">
           <q-input
  v-model="form.name"
  filled
  label="Nombre de la conexión"
  :rules="[required]"
/>

<q-input
  v-model="form.token"
  filled
  type="textarea"
  autogrow
  label="Personal Access Token"
  hint="figd_xxxxxxxxxxxxxxxxx"
  :rules="[required]"
/>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Cancelar"
              v-close-popup
            />
            <q-btn
              unelevated
              color="primary"
              type="submit"
              :loading="saving"
              label="Guardar"
            />
          </q-card-actions>
        </q-form>

      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useDocenteStore } from '@/stores/docente.stores'

const $q = useQuasar()
const store = useDocenteStore()

const dialogOpen = ref(false)
const saving = ref(false)
const form = reactive({
  name: '',
  token: '',
})

const required = (val: string) => !!val || 'Campo obligatorio'

const connection = computed(() => store.figmaConnections[0] ?? null)

function openEdit() {
  if (!connection.value) return

  form.name = connection.value.name
  form.token = connection.value.personalAccessToken

  dialogOpen.value = true
}

function openCreate() {
  form.name = ''
  form.token = ''
  dialogOpen.value = true
}
async function submit() {
  saving.value = true

  try {
    await store.saveConnection({
      name: form.name,
      token: form.token,
    })
    $q.notify({
      type: 'positive',
      position: 'top',
      message: 'Conexión guardada correctamente',
    })

    dialogOpen.value = false

    form.name = ''
    form.token = ''
  } catch (e: any) {
    $q.notify({
      type: 'negative',
      message: e.message ?? 'No se pudo guardar la conexión',
    })
  } finally {
    saving.value = false
  }
}
</script>