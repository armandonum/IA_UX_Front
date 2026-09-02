<template>
  <q-card flat bordered class="q-mt-md">
    <q-expansion-item
      label="Datos completos de la sesión"
      header-class="text-caption text-dark"
    >
      <q-separator />
      <div class="q-pa-sm row q-col-gutter-sm">
        <div
          v-for="[k, v] in Object.entries(session)"
          :key="k"
          class="col-6 row q-py-xs"
        >
          <span class="text-caption text-grey-6" style="min-width:120px;">{{ k }}</span>
          <span class="text-caption text-dark font-mono">{{ formatValor(v) }}</span>
        </div>
      </div>
    </q-expansion-item>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  session: any
}>()

function formatValor(v: unknown) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
</script>