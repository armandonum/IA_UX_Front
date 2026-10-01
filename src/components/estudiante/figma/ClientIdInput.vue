<!-- components/estudiante/figma/ClientIdInput.vue -->
<template>
  <div style="max-width: 420px" class="q-mb-md">
    <q-input
      :model-value="modelValue"
      label="Client ID de Figma"
      filled
      dense
      hint="Necesario para cargar el prototipo embebido de Figma"
      @update:model-value="onInput"
    >
      <template v-slot:append>
        <q-btn
          flat
          round
          dense
          size="sm"
          icon="help_outline"
          color="primary"
          @click="showClientIdHelp"
        >
          <q-tooltip>¿Cómo obtengo mi Client ID?</q-tooltip>
        </q-btn>
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const $q = useQuasar()

function onInput(value: string | number | null) {
  emit('update:modelValue', String(value ?? ''))
}

function showClientIdHelp() {
  $q.dialog({
    title: '¿Cómo obtener tu Client ID de Figma?',
    message: `
      1. Ve a <a href="https://www.figma.com/developers/apps" target="_blank" style="color: #1976d2;">figma.com/developers/apps</a><br><br>
      2. Crea una nueva aplicación o selecciona una existente<br><br>
      3. Copia el <strong>"Client ID"</strong> de la sección <strong>"OAuth"</strong><br><br>
      4. Pégalo en el campo de arriba<br><br>

      <strong>NOTA:</strong> Solo necesitas el Client ID para el embed, <strong>NO</strong> necesitas configurar OAuth.
    `,
    html: true,
    ok: {
      label: 'Entendido',
      color: 'primary',
      unelevated: true,
    },
  })
}
</script>