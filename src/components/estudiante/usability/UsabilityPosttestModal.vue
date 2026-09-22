<!-- views/roles/estudiante/components/UsabilityPosttestModal.vue -->
<template>
  <QuestionnaireModal
    :show="show"
    :questionnaire="questionnaire"
    :loading="loading"
    titulo-boton="Finalizar evaluación"
    @enviar="$emit('enviar', $event)"
  />
</template>

<script setup lang="ts">
import QuestionnaireModal from '@/components/estudiante/figma/QuestionnaireModal.vue'
import type { Questionnaire, QuestionAnswer } from '@/types/usability'

defineProps<{
  show: boolean
  questionnaire: Questionnaire
  loading?: boolean
}>()

defineEmits<{
  (e: 'enviar', answers: QuestionAnswer[]): void
}>()
</script>