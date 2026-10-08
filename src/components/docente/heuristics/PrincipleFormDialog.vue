<!-- components/docente/heuristics/PrincipleFormDialog.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 550px; max-width: 700px;">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h6">
              {{ isEdit ? 'Editar principio' : 'Nuevo principio' }}
            </div>
            <div class="text-caption">
              {{
                isEdit
                  ? 'Modifica la información del principio'
                  : 'Agrega una nueva heurística al framework'
              }}
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" @click="close" />
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit">
        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.code"
                filled
                label="Código *"
                placeholder="Ej: H1, R1"
                maxlength="10"
                :rules="[
                  (v) => !!v || 'El código es requerido',
                  (v) => v.length <= 10 || 'Máximo 10 caracteres',
                ]"
              />
            </div>
            <div class="col-12 col-md-8">
              <q-input
                v-model="form.name"
                filled
                label="Nombre del principio *"
                placeholder="Ej: Visibilidad del estado del sistema"
                :rules="[(v) => !!v || 'El nombre es requerido']"
              />
            </div>
          </div>

          <q-input
            v-model="form.description"
            filled
            type="textarea"
            autogrow
            label="Descripción *"
            placeholder="Ej: El sistema debe mantener informados a los usuarios sobre lo que está sucediendo."
            :rules="[(v) => !!v || 'La descripción es requerida']"
            :rows="3"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.orderIndex"
                filled
                type="number"
                label="Orden *"
                placeholder="Ej: 1"
                :rules="[
                  (v) => v !== null && v !== undefined || 'El orden es requerido',
                  (v) => v >= 0 || 'Debe ser mayor o igual a 0',
                ]"
              >
                <template v-slot:hint>
                  Define la posición del principio (menor = primero)
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6 flex items-center">
              <q-toggle
                v-model="form.isActive"
                label="Principio activo"
                color="primary"
                left-label
              />
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
import type { HeuristicPrinciple } from '@/api/heuristic.api'

const props = defineProps<{
  modelValue: boolean
  frameworkId: string
  principle?: HeuristicPrinciple | null
  defaultOrderIndex?: number
  saving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'save',
    data: {
      frameworkId: string
      code: string
      name: string
      description: string
      orderIndex: number
      isActive: boolean
    },
  ): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEdit = computed(() => !!props.principle)

const form = reactive({
  code: '',
  name: '',
  description: '',
  orderIndex: 1,
  isActive: true,
})

function resetForm() {
  form.code = ''
  form.name = ''
  form.description = ''
  form.orderIndex = props.defaultOrderIndex ?? 1
  form.isActive = true
}

function fillForm(p: HeuristicPrinciple) {
  form.code = p.code
  form.name = p.name
  form.description = p.description
  form.orderIndex = p.orderIndex
  form.isActive = p.isActive
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.principle) {
        fillForm(props.principle)
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
    frameworkId: props.frameworkId,
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description.trim(),
    orderIndex: form.orderIndex,
    isActive: form.isActive,
  }
  emit('save', payload)
}
</script>