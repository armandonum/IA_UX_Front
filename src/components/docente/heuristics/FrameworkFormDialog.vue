<!-- components/docente/heuristics/FrameworkFormDialog.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 500px; max-width: 600px;">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h6">
              {{ isEdit ? 'Editar framework' : 'Nuevo framework' }}
            </div>
            <div class="text-caption">
              {{
                isEdit
                  ? 'Modifica la información del framework'
                  : 'Crea un nuevo conjunto de heurísticas'
              }}
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" @click="close" />
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit">
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.name"
            filled
            label="Nombre del framework *"
            placeholder="Ej: Nielsen, Shneiderman"
            :rules="[(v) => !!v || 'El nombre es requerido']"
            autofocus
          />

          <q-input
            v-model="form.description"
            filled
            type="textarea"
            autogrow
            label="Descripción"
            placeholder="Ej: Las 10 heurísticas de usabilidad"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.author"
                filled
                label="Autor"
                placeholder="Ej: Jakob Nielsen"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.year"
                filled
                type="number"
                label="Año"
                placeholder="Ej: 1994"
                :rules="[
                  (v) =>
                    !v ||
                    (v >= 1900 && v <= new Date().getFullYear() + 1) ||
                    'Año inválido',
                ]"
              />
            </div>
          </div>

          <q-toggle
            v-model="form.isActive"
            label="Framework activo"
            color="primary"
            left-label
          >
            <q-tooltip>
              Los frameworks inactivos no aparecen al crear evaluaciones
            </q-tooltip>
          </q-toggle>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="close" />
          <q-btn
            unelevated
            color="primary"
            type="submit"
            :label="isEdit ? 'Actualizar' : 'Crear'"
            :loading="saving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { HeuristicFramework } from '@/api/heuristic.api'

const props = defineProps<{
  modelValue: boolean
  framework?: HeuristicFramework | null
  saving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'save',
    data: {
      name: string
      description?: string
      author?: string
      year?: number
      isActive: boolean
    },
  ): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEdit = computed(() => !!props.framework)

const form = reactive({
  name: '',
  description: '',
  author: '',
  year: null as number | null,
  isActive: true,
})

function resetForm() {
  form.name = ''
  form.description = ''
  form.author = ''
  form.year = null
  form.isActive = true
}

function fillForm(fw: HeuristicFramework) {
  form.name = fw.name
  form.description = fw.description || ''
  form.author = fw.author || ''
  form.year = fw.year ?? null
  form.isActive = fw.isActive
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.framework) {
        fillForm(props.framework)
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

function onSubmit() {
  const payload = {
    name: form.name.trim(),
    description: form.description?.trim() || undefined,
    author: form.author?.trim() || undefined,
    year: form.year ?? undefined,
    isActive: form.isActive,
  }
  emit('save', payload)
}
</script>