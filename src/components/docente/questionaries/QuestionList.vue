<template>
  <q-card flat bordered>
    <q-card-section class="row items-center justify-between">
      <div class="text-subtitle1 text-weight-medium">Preguntas</div>
      <q-btn dense flat round icon="add" color="primary" @click="emit('create')" />
    </q-card-section>

    <q-separator />

    <q-list separator>
      <q-item
        v-for="question in sortedQuestions"
        :key="question.questionId"
        clickable
        :active="question.questionId === selectedQuestionId"
        active-class="bg-blue-1"
        @click="emit('select', question.questionId)"
      >
        <q-item-section avatar>
          <q-badge color="grey-6">{{ question.orderIndex }}</q-badge>
        </q-item-section>

        <q-item-section>
          <q-item-label lines="2">{{ question.questionText || 'Pregunta sin título' }}</q-item-label>
          <q-item-label caption>{{ typeLabel(question.questionType) }}</q-item-label>
        </q-item-section>

        <q-item-section side v-if="question.isRequired">
          <q-icon name="star" size="14px" color="orange" />
        </q-item-section>
      </q-item>

      <q-item v-if="!questions.length">
        <q-item-section class="text-grey-6 text-center">
          Todavía no hay preguntas. Usa el botón "+" para crear la primera.
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Question, QuestionType } from '@/types/questionnaire.types'

const props = defineProps<{
  questions: Question[]
  selectedQuestionId?: string
}>()

const emit = defineEmits<{
  (e: 'select', questionId: string): void
  (e: 'create'): void
}>()

const sortedQuestions = computed(() =>
  [...props.questions].sort((a, b) => a.orderIndex - b.orderIndex),
)

const typeLabels: Record<QuestionType, string> = {
  short_text: 'Texto corto',
  long_text: 'Texto largo',
  single_choice: 'Opción única',
  multi_choice: 'Opción múltiple',
  scale: 'Escala',
  boolean: 'Sí / No',
}

function typeLabel(type: QuestionType) {
  return typeLabels[type] ?? type
}
</script>