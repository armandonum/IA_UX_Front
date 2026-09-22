<!-- components/coordinador/heuristic/detail/HeuristicCommentList.vue -->
<template>
  <q-card flat bordered>
    <q-card-section class="q-pa-sm">
      <!-- Header -->
      <div class="row items-center q-mb-sm">
        <q-icon name="chat" color="green" size="20px" class="q-mr-sm" />
        <div class="text-subtitle2 text-dark">
          Comentarios del Usuario
        </div>
        <q-badge color="green" rounded class="q-ml-sm">
          {{ comments.length }}
        </q-badge>
      </div>

      <!-- Sin comentarios -->
      <div
        v-if="!comments.length"
        class="text-center q-py-md text-caption text-grey-6"
      >
        <q-icon name="chat_bubble_outline" size="32px" />
        <div class="q-mt-xs">Aún no hay comentarios</div>
      </div>

      <!-- Lista -->
      <div v-else class="q-gutter-y-xs">
        <div
          v-for="c in comments"
          :key="c.commentId"
          class="comment-item row items-center q-px-sm q-py-xs rounded-borders"
        >
          <span
            class="text-caption text-primary font-mono cursor-pointer q-mr-sm"
            style="min-width: 50px"
            @click="$emit('seek', c.elapsedMsTotal)"
          >
            {{ formatTimeMs(c.elapsedMsTotal) }}
          </span>

          <span class="text-body2 col ellipsis">
            {{ c.text }}
          </span>

          <q-btn
            dense
            flat
            round
            size="sm"
            icon="edit"
            color="primary"
            @click="$emit('edit', c.elapsedMsTotal, c)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            round
            size="sm"
            icon="delete"
            color="negative"
            @click="$emit('delete', c.commentId)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { SessionComment } from '@/composables/coordinator/heuristic/useHeuristicSessionDetail'

defineProps<{
  comments: SessionComment[]
}>()

defineEmits<{
  (e: 'edit', ms: number, comment: SessionComment): void
  (e: 'delete', commentId: string): void
  (e: 'seek', ms: number): void
}>()

function formatTimeMs(ms: number): string {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}
</script>

<style scoped>
.comment-item {
  background: #f1f5f9;
  transition: background 0.15s;
}

.comment-item:hover {
  background: #e2e8f0;
}
</style>