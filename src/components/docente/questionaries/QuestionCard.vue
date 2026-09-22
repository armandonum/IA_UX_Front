<template>
  <q-card
    flat
    bordered
    class="question-card cursor-pointer"
    :class="{
      'selected-card': selected
    }"
    @click="$emit('select', question.questionId)"
  >
    <q-card-section class="q-pa-md">

      <div class="row items-start no-wrap">

        <!-- Icono -->

        <q-avatar
          rounded
          color="primary"
          text-color="white"
          size="42px"
        >
          <q-icon
            :name="icon"
          />
        </q-avatar>

        <!-- Información -->

        <div class="col q-ml-md">

          <div class="text-subtitle2 text-weight-medium">

            {{ question.orderIndex }}.
            {{ title }}

          </div>

          <div class="text-caption text-grey-7 q-mt-xs">

            {{ question.questionType }}

          </div>

          <div class="row q-gutter-sm q-mt-sm">

            <q-chip
              dense
              size="sm"
              color="primary"
              text-color="white"
            >
              {{ typeLabel }}
            </q-chip>

            <q-chip
              v-if="question.isRequired"
              dense
              size="sm"
              color="orange"
              text-color="white"
              icon="priority_high"
            >
              Obligatoria
            </q-chip>

            <q-chip
              v-if="question.allowNotApplicable"
              dense
              size="sm"
              color="grey-7"
              text-color="white"
            >
              N/A
            </q-chip>

          </div>

        </div>

        <!-- Acciones -->

        <q-btn
          flat
          round
          dense
          icon="more_vert"
        >

          <q-menu>

            <q-list style="min-width:180px">

              <q-item
                clickable
                v-close-popup
                @click="$emit('duplicate', question)"
              >
                <q-item-section avatar>
                  <q-icon name="content_copy" />
                </q-item-section>

                <q-item-section>
                  Duplicar
                </q-item-section>
              </q-item>

              <q-item
                clickable
                v-close-popup
                @click="$emit('delete', question)"
              >
                <q-item-section avatar>
                  <q-icon
                    color="negative"
                    name="delete"
                  />
                </q-item-section>

                <q-item-section>
                  Eliminar
                </q-item-section>
              </q-item>

            </q-list>

          </q-menu>

        </q-btn>

      </div>

    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">

import { computed } from 'vue'

import type {
  Question
} from '@/types/questionnaire.types'

const props =
defineProps<{

  question: Question

  selected?: boolean

}>()

defineEmits([

'select',

'duplicate',

'delete',

])

const title =
computed(() => {

  if (
    props.question.questionText.trim() === ''
  ) {
    return 'Nueva pregunta'
  }

  return props.question.questionText

})

const icon =
computed(() => {

  switch (
    props.question.questionType
  ) {

    case 'short_text':
      return 'short_text'

    case 'long_text':
      return 'notes'

    case 'single_choice':
      return 'radio_button_checked'

    case 'multi_choice':
      return 'check_box'

    case 'scale':
      return 'linear_scale'

    case 'boolean':
      return 'toggle_on'

    default:
      return 'help'

  }

})

const typeLabel =
computed(() => {

  switch (
    props.question.questionType
  ) {

    case 'short_text':
      return 'Texto corto'

    case 'long_text':
      return 'Texto largo'

    case 'single_choice':
      return 'Opción única'

    case 'multi_choice':
      return 'Opción múltiple'

    case 'scale':
      return 'Escala'

    case 'boolean':
      return 'Sí / No'

    default:
      return props.question.questionType

  }

})

</script>

<style scoped>

.question-card{

transition:.25s;

border-radius:12px;

}

.question-card:hover{

transform:translateY(-2px);

box-shadow:0 4px 12px rgba(0,0,0,.12);

}

.selected-card{

border:2px solid var(--q-primary);

background:#eef5ff;

}

</style>