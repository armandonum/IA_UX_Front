<!-- components/rules/RulesManager.vue -->
<template>
  <div>

    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center q-gutter-sm">
        <q-icon
          name="gavel"
          color="primary"
          size="20px"
        />

        <div class="text-subtitle1 text-weight-medium">
          Reglas de la Evaluación
        </div>
      </div>

      <q-btn
        v-if="canEdit"
        color="primary"
        icon="add"
        label="Agregar Regla"
        size="sm"
        unelevated
        @click="$emit('add')"
      />
    </div>

    <!-- Sin reglas -->
    <div
      v-if="rules.length === 0"
      class="column items-center q-py-xl"
    >
      <q-icon
        name="gavel"
        size="42px"
        color="grey-5"
      />

      <div class="text-body2 text-grey-6 q-mt-sm">
        No hay reglas definidas
      </div>

      <q-btn
        v-if="canEdit"
        flat
        color="primary"
        icon="add"
        label="Agregar regla"
        class="q-mt-sm"
        @click="$emit('add')"
      />
    </div>

    <!-- Lista de reglas -->
    <div v-else class="column q-gutter-sm">

      <q-card
        v-for="rule in sortedRules"
        :key="rule.id"
        flat
        bordered
      >
        <q-card-section class="q-py-sm">

          <div class="row items-center no-wrap">

            <!-- Número de regla -->
            <q-avatar
              size="32px"
              color="primary"
              text-color="white"
              class="q-mr-md"
            >
              {{ rule.ruleOrder }}
            </q-avatar>

            <!-- Contenido -->
            <div class="col">

              <div class="text-body2 text-weight-medium">
                {{ rule.description }}
              </div>

              <div class="text-caption text-grey-6 q-mt-xs">
                Creado: {{ formatDate(rule.createdAt) }}
              </div>

            </div>

            <!-- Acciones -->
            <div
              v-if="canEdit"
              class="row items-center q-gutter-xs q-ml-md"
            >
              <q-btn
                icon="edit"
                flat
                round
                dense
                size="sm"
                color="primary"
                @click="$emit('edit', rule)"
              >
                <q-tooltip>
                  Editar regla
                </q-tooltip>
              </q-btn>

              <q-btn
                icon="delete"
                flat
                round
                dense
                size="sm"
                color="negative"
                @click="confirmDelete(rule.id)"
              >
                <q-tooltip>
                  Eliminar regla
                </q-tooltip>
              </q-btn>
            </div>

          </div>

        </q-card-section>
      </q-card>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps<{
  rules: any[]
  canEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', rule: any): void
  (e: 'delete', id: string): void
  (e: 'reorder', ruleIds: string[]): void
}>()

const $q = useQuasar()

const sortedRules = computed(() => {
  return [...props.rules].sort(
    (a, b) => a.ruleOrder - b.ruleOrder
  )
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const confirmDelete = (id: string) => {
  $q.dialog({
    title: 'Eliminar Regla',
    message: '¿Estás seguro de eliminar esta regla?',
    ok: {
      label: 'Eliminar',
      color: 'negative'
    },
    cancel: {
      label: 'Cancelar',
      flat: true
    }
  }).onOk(() => {
    emit('delete', id)
  })
}
</script>