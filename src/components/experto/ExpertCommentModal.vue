<!-- components/experto/ExpertCommentModal.vue -->

<template>
  <q-dialog v-model="localShow" persistent>
    <q-card style="min-width:450px; max-width:600px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-dark">
          <q-icon name="comment" color="primary" class="q-mr-sm" />
          {{ editingComment ? 'Editar comentario' : 'Nuevo comentario de experto' }}
        </div>
        <q-space />
        <q-btn dense flat icon="close" @click="close" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-sm">
        <div class="row q-col-gutter-sm q-mb-sm">
          <div class="col-6">
            <div class="text-caption text-grey-6">⏱️ Momento</div>
            <div class="text-caption text-dark">{{ formatTiempoS(ms) }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-6">🎭 Emoción</div>
            <div class="text-caption text-dark">{{ emotionLabel || '—' }}</div>
          </div>
        </div>

        <q-form @submit.prevent="save">
          <!-- Tipo de comentario -->
          <q-select
            v-model="form.commentType"
            :options="commentTypeOptions"
            label="Tipo de comentario *"
            dense
            filled
            emit-value
            map-options
            :rules="[val => !!val || 'Selecciona un tipo']"
            class="q-mb-sm"
          />

          <!-- Severidad -->
          <q-select
            v-model="form.severity"
            :options="severityOptions"
            label="Severidad"
            dense
            filled
            emit-value
            map-options
            class="q-mb-sm"
          />

          <!-- Comentario -->
          <q-input
            v-model="form.comment"
            type="textarea"
            rows="3"
            filled
            dense
            label="Comentario *"
            placeholder="Describe tu observación..."
            :rules="[val => !!val || 'El comentario es obligatorio']"
            class="q-mb-sm"
            autogrow
          />

          <!-- Node ID / Screen -->
          <!-- <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input
                v-model="form.nodeId"
                label="Node ID (opcional)"
                dense
                filled
                placeholder="Ej: 1:65"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model="form.screenIdentifier"
                label="Pantalla (opcional)"
                dense
                filled
                placeholder="Ej: home-screen"
              />
            </div>
          </div> -->

          <div class="row q-col-gutter-sm q-mt-sm">
            <div class="col-6">
              <q-btn
                unelevated
                color="primary"
                label="Guardar"
                type="submit"
                class="full-width"
                :loading="loading"
              />
            </div>
            <div class="col-6">
              <q-btn
                flat
                label="Cancelar"
                class="full-width"
                @click="close"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'

// 🔥 Permitir null en taskId
const props = defineProps<{
  show: boolean
  ms: number
  emotionLabel?: string
  projectId: string
  sessionId: string
  taskId?: string | null  // ✅ Permitir null
  authorId: string
  editingComment?: any | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const $q = useQuasar()
const localShow = ref(props.show)
const loading = ref(false)

const form = ref({
  commentType: 'observation',
  comment: '',
  severity: 3,
  nodeId: '',
  screenIdentifier: '',
})

const commentTypeOptions = [
  { label: '👀 Observación', value: 'observation' },
  { label: '🐛 Problema', value: 'problem' },
  { label: '💡 Recomendación', value: 'recommendation' },
  { label: '✅ Positivo', value: 'positive' },
  { label: '❓ Pregunta', value: 'question' },
]

const severityOptions = [
  { label: '🟢 Leve (1)', value: 1 },
  { label: '🟡 Moderado (2)', value: 2 },
  { label: '🟠 Grave (3)', value: 3 },
  { label: '🔴 Crítico (4)', value: 4 },
  { label: '⛔ Bloqueante (5)', value: 5 },
]

watch(() => props.show, (val) => {
  localShow.value = val
  if (val && props.editingComment) {
    form.value = {
      commentType: props.editingComment.commentType || 'observation',
      comment: props.editingComment.comment || '',
      severity: props.editingComment.severity || 3,
      nodeId: props.editingComment.nodeId || '',
      screenIdentifier: props.editingComment.screenIdentifier || '',
    }
  } else if (val) {
    resetForm()
  }
})

watch(localShow, (val) => {
  emit('update:show', val)
  if (!val) emit('close')
})

function resetForm() {
  form.value = {
    commentType: 'observation',
    comment: '',
    severity: 3,
    nodeId: '',
    screenIdentifier: '',
  }
}

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

async function save() {
  if (!form.value.comment.trim()) {
    $q.notify({ type: 'warning', message: 'El comentario es obligatorio' })
    return
  }

  loading.value = true

  const data = {
    projectId: props.projectId,
    sessionId: props.sessionId,
    taskId: props.taskId || null,  // ✅ Convertir undefined a null
    authorId: props.authorId,
    commentType: form.value.commentType,
    comment: form.value.comment.trim(),
    nodeId: form.value.nodeId || null,
    screenIdentifier: form.value.screenIdentifier || null,
    severity: form.value.severity,
    elapsedMsTotal: Math.round(props.ms),
    ...(props.editingComment && { commentId: props.editingComment.commentId }),
  }

  emit('save', data)
  loading.value = false
  close()
}

function close() {
  localShow.value = false
  emit('close')
}
</script>