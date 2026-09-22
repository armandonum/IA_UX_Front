<!-- components/rules/RulesForm.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 500px; max-width: 700px;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Agregar Reglas</div>
        <div class="text-subtitle2">Define las reglas para los evaluadores</div>
      </q-card-section>

      <q-card-section>
        <div class="text-sm text-slate-500 q-mb-md">
          Ingresa las reglas que los evaluadores deben seguir durante el recorrido cognitivo
        </div>

        <div
          v-for="(rule, index) in rules"
          :key="index"
          class="flex items-center gap-2 q-mb-2"
        >
          <span class="text-slate-500 text-sm w-8">{{ index + 1 }}.</span>
          <q-input
            v-model="rules[index]"
            filled
            dense
            placeholder="Ej: El tiempo máximo es de 20 minutos"
            class="flex-1"
            @keyup.enter="addRule"
          />
          <q-btn
            icon="close"
            flat
            dense
            size="sm"
            color="negative"
            @click="removeRule(index)"
            :disable="rules.length === 1"
          />
        </div>

        <q-btn
          flat
          color="primary"
          icon="add"
          label="Agregar otra regla"
          size="sm"
          @click="addRule"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup @click="close" />
        <q-btn
          color="primary"
          label="Guardar Reglas"
          :loading="loading"
          :disable="!hasValidRules"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  evaluationId?: string
  existingRules?: any[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const rules = ref<string[]>([''])

const hasValidRules = computed(() => {
  return rules.value.some(r => r.trim().length > 0)
})

const addRule = () => {
  rules.value.push('')
}

const removeRule = (index: number) => {
  if (rules.value.length > 1) {
    rules.value.splice(index, 1)
  }
}

const save = async () => {
  const validRules = rules.value
    .filter(r => r.trim().length > 0)
    .map((description, index) => ({
      description: description.trim(),
      ruleOrder: index + 1
    }))

  if (validRules.length === 0) return

  loading.value = true
  try {
    emit('save', {
      evaluationId: props.evaluationId,
      rules: validRules
    })
    close()
  } finally {
    loading.value = false
  }
}

const close = () => {
  visible.value = false
  rules.value = ['']
}
</script>