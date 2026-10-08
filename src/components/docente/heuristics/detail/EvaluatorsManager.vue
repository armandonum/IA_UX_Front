<!-- components/docente/heuristics/detail/EvaluatorsManager.vue -->
<template>
  <div>
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle2 text-weight-bold">
          👥 Evaluadores asignados ({{ evaluators.length }})
        </div>
        <div class="text-caption text-grey-6">
          Asigna expertos UX para que realicen la evaluación
        </div>
      </div>

      <q-btn
        unelevated
        color="primary"
        icon="person_add"
        label="Asignar evaluador"
        @click="dialogOpen = true"
      />
    </div>

    <!-- ============================================================ -->
    <!-- LOADING / EMPTY                                               -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="32px" />
    </div>

    <div
      v-else-if="!evaluators.length"
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="group_off" size="48px" />
      <div class="text-h6 q-mt-sm">Sin evaluadores</div>
      <div class="text-caption q-mb-md">
        Asigna el primer evaluador a esta evaluación
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="person_add"
        label="Asignar evaluador"
        @click="dialogOpen = true"
      />
    </div>

    <!-- ============================================================ -->
    <!-- LISTA                                                         -->
    <!-- ============================================================ -->
    <q-list v-else bordered separator>
      <q-item v-for="ev in evaluators" :key="ev.id">
        <q-item-section avatar>
          <q-avatar
            :color="ev.completedAt ? 'positive' : 'primary'"
            text-color="white"
          >
            <q-icon
              :name="ev.completedAt ? 'check' : 'person'"
              size="20px"
            />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ getUserName(ev.userId) }}
          </q-item-label>
          <q-item-label caption>
            <q-badge
              :color="getRoleColor(ev.role)"
              text-color="white"
              :label="getRoleLabel(ev.role)"
              class="q-mr-sm"
            />
            <span v-if="ev.notes">{{ ev.notes }}</span>
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="row items-center q-gutter-xs">
            <q-badge
              :color="ev.completedAt ? 'positive' : 'warning'"
              text-color="white"
              :label="ev.completedAt ? 'Completado' : 'Pendiente'"
            />

            <q-btn
              flat
              dense
              round
              icon="edit"
              color="primary"
              size="sm"
              @click="openEditDialog(ev)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>

            <q-btn
              v-if="!ev.completedAt"
              flat
              dense
              round
              icon="check_circle"
              color="positive"
              size="sm"
              @click="confirmMarkCompleted(ev)"
            >
              <q-tooltip>Marcar como completado</q-tooltip>
            </q-btn>

            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              size="sm"
              @click="confirmRemove(ev)"
            >
              <q-tooltip>Remover</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- ============================================================ -->
    <!-- DIALOG: Asignar evaluador                                     -->
    <!-- ============================================================ -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 480px; max-width: 550px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Asignar evaluador</div>
          <div class="text-caption">
            Selecciona un usuario y su rol
          </div>
        </q-card-section>

        <q-form @submit.prevent="onSubmitAssign">
          <q-card-section class="q-gutter-md">
            <q-select
              v-model="newForm.userId"
              :options="availableUsers"
              option-label="display_name"
              option-value="user_id"
              emit-value
              map-options
              filled
              label="Usuario *"
              :rules="[(v) => !!v || 'Selecciona un usuario']"
              :loading="loadingUsers"
              use-input
              input-debounce="300"
              @filter="filterUsers"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white" size="32px">
                      {{ getInitials(scope.opt.display_name) }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.display_name }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.email }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-select
              v-model="newForm.role"
              :options="roleOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              filled
              label="Rol en la evaluación"
            />

            <q-input
              v-model="newForm.notes"
              filled
              type="textarea"
              autogrow
              label="Notas (opcional)"
              placeholder="Ej: Experto en accesibilidad"
              :rows="2"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" @click="dialogOpen = false" />
            <q-btn
              unelevated
              color="primary"
              type="submit"
              label="Asignar"
              :loading="saving"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- ============================================================ -->
    <!-- DIALOG: Editar evaluador                                      -->
    <!-- ============================================================ -->
    <q-dialog v-model="editDialogOpen" persistent>
      <q-card style="min-width: 450px; max-width: 550px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Editar evaluador</div>
        </q-card-section>

        <q-form @submit.prevent="onSubmitEdit">
          <q-card-section class="q-gutter-md">
            <q-select
              v-model="editForm.role"
              :options="roleOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              filled
              label="Rol en la evaluación"
            />

            <q-input
              v-model="editForm.notes"
              filled
              type="textarea"
              autogrow
              label="Notas (opcional)"
              :rows="2"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" @click="editDialogOpen = false" />
            <q-btn
              unelevated
              color="primary"
              type="submit"
              label="Guardar"
              :loading="saving"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useHeuristicEvaluationDetail } from '@/composables/docente/useHeuristicEvaluationDetail'
import { usersApi } from '@/api/users.api'
import type {
  HeuristicEvaluator,
  HeuristicEvaluation,
} from '@/api/heuristic.api'

const props = defineProps<{
  evaluationId: string
  evaluators: HeuristicEvaluator[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'added'): void
  (e: 'removed'): void
  (e: 'updated'): void
}>()

const $q = useQuasar()

const {
  addEvaluator,
  updateEvaluator,
  markEvaluatorCompleted,
  removeEvaluator,
} = useHeuristicEvaluationDetail()

// ============================================================
// STATE
// ============================================================
const dialogOpen = ref(false)
const editDialogOpen = ref(false)
const saving = ref(false)

const allUsers = ref<any[]>([])
const loadingUsers = ref(false)

const newForm = reactive({
  userId: '',
  role: 'evaluator',
  notes: '',
})

const editForm = reactive({
  id: '',
  role: 'evaluator',
  notes: '',
})

// ============================================================
// COMPUTED
// ============================================================
const roleOptions = [
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Evaluador', value: 'evaluator' },
  { label: 'Observador', value: 'observer' },
]

const availableUsers = computed(() => {
  const assignedIds = props.evaluators.map((e) => e.userId)
  return allUsers.value.filter((u) => !assignedIds.includes(u.user_id))
})

// ============================================================
// LOAD USERS
// ============================================================
async function loadUsers() {
  loadingUsers.value = true
  try {
    const users = await usersApi.getAll()
    allUsers.value = users
  } catch (e) {
    console.error('Error cargando usuarios:', e)
  } finally {
    loadingUsers.value = false
  }
}

function filterUsers(val: string, update: any) {
  if (val === '') {
    update(() => {})
    return
  }
  update(() => {
    const needle = val.toLowerCase()
    allUsers.value = allUsers.value.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(needle) ||
        u.email?.toLowerCase().includes(needle),
    )
  })
}

// ============================================================
// ACTIONS
// ============================================================
async function onSubmitAssign() {
  saving.value = true
  try {
    await addEvaluator({
      evaluationId: props.evaluationId,
      userId: newForm.userId,
      role: newForm.role,
      notes: newForm.notes || undefined,
    })
    dialogOpen.value = false
    resetNewForm()
    emit('added')
  } catch (e) {
    // Error manejado
  } finally {
    saving.value = false
  }
}

function openEditDialog(ev: HeuristicEvaluator) {
  editForm.id = ev.id
  editForm.role = ev.role
  editForm.notes = ev.notes || ''
  editDialogOpen.value = true
}

async function onSubmitEdit() {
  saving.value = true
  try {
    await updateEvaluator(editForm.id, {
      role: editForm.role,
      notes: editForm.notes || undefined,
    })
    editDialogOpen.value = false
    emit('updated')
  } catch (e) {
    // Error manejado
  } finally {
    saving.value = false
  }
}

async function confirmMarkCompleted(ev: HeuristicEvaluator) {
  $q.dialog({
    title: 'Marcar como completado',
    message: `¿Marcar este evaluador como completado?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await markEvaluatorCompleted(ev.id)
      emit('updated')
    } catch (e) {
      // Error manejado
    }
  })
}

async function confirmRemove(ev: HeuristicEvaluator) {
  $q.dialog({
    title: 'Remover evaluador',
    message: `¿Estás seguro de remover a este evaluador?<br>
              <strong class="text-negative">Se perderá su progreso si lo tenía.</strong>`,
    html: true,
    cancel: true,
    persistent: true,
    ok: { label: 'Remover', color: 'negative', unelevated: true },
  }).onOk(async () => {
    try {
      await removeEvaluator(ev.id)
      emit('removed')
    } catch (e) {
      // Error manejado
    }
  })
}

// ============================================================
// HELPERS
// ============================================================
function getUserName(userId: string): string {
  const u = allUsers.value.find((user) => user.user_id === userId)
  return u?.display_name || `Usuario ${userId.substring(0, 8)}`
}

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    supervisor: 'Supervisor',
    evaluator: 'Evaluador',
    observer: 'Observador',
  }
  return labels[role] || role
}

function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    supervisor: 'primary',
    evaluator: 'info',
    observer: 'grey-6',
  }
  return colors[role] || 'grey'
}

function resetNewForm() {
  newForm.userId = ''
  newForm.role = 'evaluator'
  newForm.notes = ''
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(loadUsers)
</script>