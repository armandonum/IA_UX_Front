<template>
  <q-card flat bordered>
    <q-card-section class="q-pa-sm">
      <div class="row items-center">
        <div class="text-subtitle2 text-dark">Comentarios</div>
        <q-badge color="positive" rounded class="q-ml-sm">{{ comments.length }}</q-badge>
    
      </div>
      <div v-if="!comments.length" class="text-center text-caption text-grey-6 q-py-md">
        Aún no hay comentarios
      </div>
      <div
        v-for="c in comments"
        :key="c.commentId"
        class="row items-center q-px-sm q-py-xs q-mb-xs bg-grey-1 rounded"
      >
        <span
          class="text-caption text-primary font-mono cursor-pointer"
          style="min-width:50px;"
          @click="$emit('seek', c.elapsedMsTotal)"
        >
          {{ formatTiempoS(c.elapsedMsTotal) }}
        </span>
        <span class="text-caption text-dark col">{{ c.text }}</span>
        <q-btn dense flat size="sm" icon="edit" color="primary" @click="$emit('edit', c.elapsedMsTotal, c)" />
        <q-btn dense flat size="sm" icon="delete" color="negative" @click="$emit('delete', c.commentId)" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  comments: any[]
}>()

defineEmits<{
  (e: 'edit', ms: number, comment: any): void
  (e: 'delete', commentId: string): void
  (e: 'seek', ms: number): void
}>()

function formatTiempoS(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}
</script>