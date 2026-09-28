<template>
  <div>
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else-if="!data.length" class="text-center q-py-xl">
      <q-icon name="quiz" size="48px" color="grey-5" />
      <div class="text-grey-7 q-mt-sm">No hay respuestas de pre/post test</div>
    </div>

    <template v-else>
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6 text-weight-bold q-mb-md">
            📋 Comparación Pre-Test vs Post-Test
          </div>

          <div class="text-caption text-grey-7 q-mb-md">
            Respuestas agregadas de todos los usuarios representativos
          </div>

          <q-markup-table flat bordered>
            <thead>
              <tr>
                <th class="text-left">Pregunta</th>
                <th class="text-center">Pre-Test</th>
                <th class="text-center">Post-Test</th>
                <th class="text-center">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in groupedRows" :key="i">
                <td>{{ row.question }}</td>
                <td class="text-center">
                  <span v-if="row.pre !== null">{{ row.pre }}</span>
                  <span v-else class="text-grey-5">—</span>
                </td>
                <td class="text-center">
                  <span v-if="row.post !== null">{{ row.post }}</span>
                  <span v-else class="text-grey-5">—</span>
                </td>
                <td class="text-center">
                  <q-chip
                    v-if="row.diff !== null"
                    :color="row.diff > 0 ? 'positive' : row.diff < 0 ? 'negative' : 'grey'"
                    text-color="white"
                    dense
                  >
                    {{ row.diff > 0 ? '+' : '' }}{{ row.diff }}
                  </q-chip>
                  <span v-else class="text-grey-5">—</span>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PrePostReportRow } from '@/api/reports.api'

const props = defineProps<{
  data: PrePostReportRow[]
  loading: boolean
}>()

const groupedRows = computed(() => {
  const map = new Map<string, { question: string; pre: number | null; post: number | null }>()

  props.data.forEach((row) => {
    const key = row.question
    if (!map.has(key)) {
      map.set(key, { question: row.question, pre: null, post: null })
    }
    const entry = map.get(key)!

    let value: number | null = null
    if (row.answer_type === 'scale' && row.avg_scale !== null) {
      value = Number(row.avg_scale)
    } else if (row.answer_type === 'boolean') {
      const total = row.count_true + row.count_false
      value = total > 0 ? Math.round((row.count_true / total) * 100) : null
    } else if (row.answer_type === 'single_choice' || row.answer_type === 'multi_choice') {
      value = row.count_text_answers
    } else {
      value = row.count_text_answers
    }

    if (row.questionnaire_type === 'pretest') entry.pre = value
    if (row.questionnaire_type === 'posttest') entry.post = value
  })

  return Array.from(map.values()).map((r) => ({
    ...r,
    diff: r.pre !== null && r.post !== null ? r.post - r.pre : null,
  }))
})
</script>