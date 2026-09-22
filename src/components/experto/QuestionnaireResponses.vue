<template>
  <div v-if="responses && responses.length > 0" class="q-py-sm">
    <div
      v-for="(response, index) in responses"
      :key="index"
      class="q-mb-md q-pa-sm"
      style="border-bottom: 1px solid #e2e8f0"
    >
      <!-- Pregunta -->
      <div class="text-weight-bold" style="color: #0f172a; font-size: 0.95rem">
        {{ index + 1 }}. {{ response.questionText }}
      </div>

      <!-- Tipo de respuesta -->
      <div class="q-mt-xs" style="color: #334155; font-size: 0.85rem">
        <!-- Texto libre -->
        <template v-if="response.questionType === 'short_text' || response.questionType === 'long_text'">
          <div class="q-mt-xs">
            <span class="text-grey-7">Respuesta:</span>
            <span style="color: #1e3a8a; font-weight: 500"> {{ response.answerText || 'No respondida' }}</span>
          </div>
        </template>

        <!-- Opción única -->
        <template v-else-if="response.questionType === 'single_choice'">
          <div class="q-mt-xs">
            <q-icon name="check_circle" color="positive" size="18px" />
            <span style="color: #1e3a8a; font-weight: 500"> {{ response.selectedOptionLabel || 'No seleccionada' }}</span>
          </div>
        </template>

        <!-- Opción múltiple -->
        <template v-else-if="response.questionType === 'multi_choice'">
          <div class="q-mt-xs">
            <div v-if="response.selectedOptionLabels && response.selectedOptionLabels.length > 0">
              <div
                v-for="(label, idx) in response.selectedOptionLabels"
                :key="idx"
                class="q-py-xs"
              >
                <q-icon name="check_box" color="positive" size="18px" />
                <span style="color: #1e3a8a; font-weight: 500"> {{ label }}</span>
              </div>
            </div>
            <span v-else class="text-grey-6">Ninguna opción seleccionada</span>
          </div>
        </template>

        <!-- Escala -->
        <template v-else-if="response.questionType === 'scale'">
          <div class="q-mt-xs">
            <span class="text-grey-7">Valor:</span>
            <span style="color: #1e3a8a; font-weight: 600; font-size: 1.1rem">
              {{ response.scaleValue !== null && response.scaleValue !== undefined ? response.scaleValue : 'No respondido' }}
            </span>
          </div>
        </template>

        <!-- Booleano (Sí/No) -->
        <template v-else-if="response.questionType === 'boolean'">
          <div class="q-mt-xs">
            <q-icon
              :name="response.booleanValue ? 'check_circle' : 'cancel'"
              :color="response.booleanValue ? 'positive' : 'negative'"
              size="20px"
            />
            <span style="color: #1e3a8a; font-weight: 500">
              {{ response.booleanValue === true ? 'Sí' : response.booleanValue === false ? 'No' : 'No respondido' }}
            </span>
          </div>
        </template>

        <!-- Otros tipos -->
        <template v-else>
          <div class="q-mt-xs text-grey-6">
            <em>Respuesta no disponible para este tipo de pregunta</em>
          </div>
        </template>
      </div>
    </div>
  </div>

  <div v-else class="text-center q-py-lg text-grey-6">
    <q-icon name="info" size="32px" class="q-mb-sm" />
    <div>No hay respuestas disponibles</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  responses: any[];
}>();
</script>