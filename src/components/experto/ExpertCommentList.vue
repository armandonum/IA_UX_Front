<!-- components/experto/ExpertCommentList.vue -->

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle2 text-dark">
          🔍 Comentarios de expertos
        </div>
        <q-badge color="primary" rounded class="q-ml-sm">{{ comments.length }}</q-badge>
      </div>

      <div v-if="!comments.length" class="text-center text-caption text-grey-6 q-py-md">
        No hay comentarios de expertos
      </div>

      <div
        v-for="c in comments"
        :key="c.commentId"
        class="q-px-sm q-py-xs q-mb-xs rounded"
        :class="getCommentClass(c.commentType)"
        @click="$emit('seek', c.elapsedMsTotal)"
      >
        <div class="row items-center">
          <q-chip
            :color="getTypeColor(c.commentType)"
            text-color="white"
            size="sm"
            dense
          >
            {{ getTypeLabel(c.commentType) }}
          </q-chip>
          <span class="font-mono text-caption text-grey-7" style="min-width:50px;">
            {{ formatTiempoS(c.elapsedMsTotal) }}
          </span>
          <span class="text-caption text-dark col ellipsis q-ml-sm">
            {{ c.comment }}
          </span>
          <q-chip
            v-if="c.severity"
            :color="getSeverityColor(c.severity)"
            text-color="white"
            size="sm"
            dense
          >
            {{ getSeverityLabel(c.severity) }}
          </q-chip>
          <q-btn
            dense
            flat
            size="sm"
            icon="edit"
            color="primary"
            @click.stop="$emit('edit', c.elapsedMsTotal, c)"
          />
          <q-btn
            dense
            flat
            size="sm"
            icon="delete"
            color="negative"
            @click.stop="$emit('delete', c.commentId)"
          />
        </div>
        <div v-if="c.nodeId || c.screenIdentifier" class="text-[10px] text-grey-6 q-mt-xs">
          <span v-if="c.nodeId">Node: {{ c.nodeId }}</span>
          <span v-if="c.screenIdentifier" class="q-ml-sm">Pantalla: {{ c.screenIdentifier }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
const props = defineProps<{
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

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    observation: 'Observación',
    problem: 'Problema',
    recommendation: 'Recomendación',
    positive: 'Positivo',
    question: 'Pregunta',
  }
  return labels[type] || type
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    observation: 'blue',
    problem: 'negative',
    recommendation: 'purple',
    positive: 'positive',
    question: 'orange',
  }
  return colors[type] || 'grey'
}

function getSeverityLabel(severity: number): string {
  const labels: Record<number, string> = {
    1: 'Leve',
    2: 'Moderado',
    3: 'Grave',
    4: 'Crítico',
    5: 'Bloqueante',
  }
  return labels[severity] || `Nivel ${severity}`
}

function getSeverityColor(severity: number): string {
  const colors: Record<number, string> = {
    1: 'green',
    2: 'blue',
    3: 'orange',
    4: 'red',
    5: 'dark-red',
  }
  return colors[severity] || 'grey'
}

function getCommentClass(type: string): string {
  const classes: Record<string, string> = {
    observation: 'bg-blue-1',
    problem: 'bg-red-1',
    recommendation: 'bg-purple-1',
    positive: 'bg-green-1',
    question: 'bg-orange-1',
  }
  return classes[type] || 'bg-grey-1'
}
</script>