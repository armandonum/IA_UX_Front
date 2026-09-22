<template>
  <div class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon name="groups" color="primary" size="28px" class="q-mr-sm" />
      <div>
        <div class="text-h6">Evaluadores Expertos</div>
        <div class="text-caption text-grey-6">
          {{ evaluators.length }} evaluador(es) asignado(s)
        </div>
      </div>
      <q-space />
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="person_add"
        label="Asignar Evaluadores"
        unelevated
        @click="showAssignDialog = true"
      />
    </div>

    <!-- Lista de evaluadores asignados -->
    <div v-if="evaluators.length === 0" class="text-center q-py-xl">
      <q-icon name="group_off" size="64px" color="grey-5" />
      <div class="text-grey-6 q-mt-md">
        No hay evaluadores asignados a esta evaluación
      </div>
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="person_add"
        label="Asignar el primer evaluador"
        unelevated
        class="q-mt-md"
        @click="showAssignDialog = true"
      />
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="evaluator in evaluators"
        :key="evaluator.id"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-avatar color="primary" text-color="white" size="42px">
                {{ getUserInitials(evaluator.userId) }}
              </q-avatar>
              <div class="col">
                <div class="text-weight-medium">
                  {{ getUserName(evaluator.userId) }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ getUserEmail(evaluator.userId) }}
                </div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-py-sm">
            <div class="row items-center q-gutter-xs">
              <q-badge :color="evaluator.role === 'supervisor' ? 'primary' : 'info'">
                {{ evaluator.role === 'supervisor' ? 'Supervisor' : 'Evaluador' }}
              </q-badge>
              <q-badge
                :color="evaluator.completedAt ? 'positive' : 'warning'"
              >
                {{ evaluator.completedAt ? 'Completado' : 'Pendiente' }}
              </q-badge>
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">
              Asignado: {{ formatDate(evaluator.assignedAt) }}
            </div>
          </q-card-section>

          <q-card-actions v-if="canEdit" align="right">
            <q-btn
              flat
              dense
              icon="delete"
              color="negative"
              label="Remover"
              @click="confirmRemove(evaluator)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- DIALOG: ASIGNAR EVALUADORES                                   -->
    <!-- ============================================================ -->
    <q-dialog v-model="showAssignDialog" persistent>
      <q-card style="min-width: 600px; max-width: 90vw; max-height: 80vh">
        <q-card-section>
          <div class="text-h6">Asignar Evaluadores</div>
          <div class="text-caption text-grey-6">
            Selecciona los usuarios que participarán como evaluadores expertos
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-py-md" style="max-height: 50vh; overflow-y: auto">
          <div v-if="availableForAssign.length === 0" class="text-center q-py-lg">
            <q-icon name="info" size="48px" color="grey-5" />
            <div class="text-grey-6 q-mt-sm">
              No hay usuarios disponibles para asignar
            </div>
          </div>

          <q-list v-else separator>
            <q-item
              v-for="user in availableForAssign"
              :key="user.user_id"
              tag="label"
              clickable
            >
              <q-item-section avatar>
                <q-checkbox
                  v-model="selectedUserIds"
                  :val="user.user_id"
                  color="primary"
                />
              </q-item-section>

              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="36px">
                  {{ getInitialsFromUser(user) }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ user.display_name }}
                </q-item-label>
                <q-item-label caption>
                  {{ user.email }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="cancelAssign" />
          <q-btn
            color="primary"
            unelevated
            label="Asignar"
            :disable="selectedUserIds.length === 0"
            @click="handleAssign"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import type { HeuristicEvaluator } from '@/api/heuristic.api'

const props = defineProps<{
  evaluators: HeuristicEvaluator[]
  availableUsers: any[]
  authUserId: string
  canEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'assign', userIds: string[]): void
  (e: 'remove', evaluatorId: string): void
}>()

const $q = useQuasar()

const showAssignDialog = ref(false)
const selectedUserIds = ref<string[]>([])

// Usuarios que aún no están asignados
const availableForAssign = computed(() => {
  const assignedUserIds = new Set(props.evaluators.map(e => e.userId))
  return props.availableUsers.filter(u => !assignedUserIds.has(u.user_id))
})

function getUser(userId: string) {
  return props.availableUsers.find(u => u.user_id === userId)
}

function getUserName(userId: string): string {
  return getUser(userId)?.display_name || 'Usuario desconocido'
}

function getUserEmail(userId: string): string {
  return getUser(userId)?.email || '—'
}

function getUserInitials(userId: string): string {
  const name = getUserName(userId)
  return getInitialsFromName(name)
}

function getInitialsFromUser(user: any): string {
  return getInitialsFromName(user.display_name || '')
}

function getInitialsFromName(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

function handleAssign() {
  emit('assign', selectedUserIds.value)
  selectedUserIds.value = []
  showAssignDialog.value = false
}

function cancelAssign() {
  selectedUserIds.value = []
  showAssignDialog.value = false
}

function confirmRemove(evaluator: HeuristicEvaluator) {
  $q.dialog({
    title: 'Remover Evaluador',
    message: `¿Remover a ${getUserName(evaluator.userId)} de esta evaluación?`,
    ok: { label: 'Remover', color: 'negative' },
    cancel: true,
    persistent: true,
  }).onOk(() => {
    emit('remove', evaluator.id)
  })
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>