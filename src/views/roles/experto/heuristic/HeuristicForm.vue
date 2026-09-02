<!-- components/experto/heuristic/HeuristicForm.vue -->

<template>
  <div 
    class="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-96 max-h-[85vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
  >
    <!-- Header -->
    <div class="bg-primary text-white p-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs opacity-80">{{ principle?.code || '—' }}</div>
          <div class="text-sm font-semibold">{{ principle?.name || 'Evaluación' }}</div>
        </div>
        <div class="text-xs bg-white/20 px-2 py-1 rounded-full">
          {{ currentIndex + 1 }} / {{ totalPrinciples }}
        </div>
      </div>
      <p class="text-xs opacity-80 mt-1 line-clamp-2">{{ principle?.description || '' }}</p>
    </div>

    <!-- Body -->
    <div class="p-4 overflow-y-auto" style="max-height: calc(85vh - 140px)">
      <div
        v-for="question in principle?.questions || []"
        :key="question.id"
        class="mb-4 border-b border-gray-100 pb-3 last:border-0"
      >
        <label class="text-sm font-medium text-gray-700 block mb-1">
          {{ question.text }}
          <span class="text-xs text-gray-400 ml-1">({{ tipoLabel(question.type) }})</span>
        </label>

        <!-- Escala -->
        <div v-if="question.type === 'scale'" class="mt-1">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">1</span>
            <input
              type="range"
              :min="1"
              :max="5"
              :step="1"
              v-model.number="answers[question.id]"
              class="flex-1 accent-primary"
            />
            <span class="text-xs text-gray-400">5</span>
            <span class="w-6 text-center font-bold text-primary bg-primary/10 rounded px-1 py-0.5 text-sm">
              {{ answers[question.id] || '?' }}
            </span>
          </div>
          <div class="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>Muy en desacuerdo</span>
            <span>Muy de acuerdo</span>
          </div>
        </div>

        <!-- Sí/No -->
        <div v-else-if="question.type === 'yes_no'" class="flex gap-3 mt-1">
          <label class="flex items-center gap-1 text-sm">
            <input type="radio" :name="question.id" :value="true" v-model="answers[question.id]" />
            Sí
          </label>
          <label class="flex items-center gap-1 text-sm">
            <input type="radio" :name="question.id" :value="false" v-model="answers[question.id]" />
            No
          </label>
          <span v-if="answers[question.id] !== undefined" class="text-xs text-gray-400 ml-auto">
            {{ answers[question.id] ? '✅' : '❌' }}
          </span>
        </div>

        <!-- Texto -->
        <div v-else-if="question.type === 'text'" class="mt-1">
          <textarea
            v-model="answers[question.id]"
            rows="2"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Escribe tu observación..."
          />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-gray-200 p-3 flex items-center gap-2 bg-gray-50">
      <q-btn
        v-if="currentIndex > 0"
        flat
        dense
        label="Anterior"
        icon="arrow_back"
        size="sm"
        @click="$emit('prev')"
      />
      <q-btn
        v-if="currentIndex < totalPrinciples - 1"
        unelevated
        color="primary"
        label="Siguiente"
        icon-right="arrow_forward"
        size="sm"
        class="ml-auto"
        @click="$emit('next')"
      />
      <q-btn
        v-else
        unelevated
        color="positive"
        label="Finalizar"
        icon="check"
        size="sm"
        class="ml-auto"
        @click="$emit('save-all')"
      />
      <q-btn
        flat
        dense
        icon="save"
        size="sm"
        label="Guardar"
        class="text-gray-500"
        @click="$emit('save')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HeuristicPrinciple } from '@/types/heuristic.types'

const props = defineProps<{
  principle: HeuristicPrinciple | null
  answers: Record<string, any>
  totalPrinciples: number
  currentIndex: number
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'save-all'): void
}>()

function tipoLabel(type: string): string {
  const labels: Record<string, string> = {
    scale: 'Escala 1-5',
    yes_no: 'Sí/No',
    text: 'Texto libre'
  }
  return labels[type] || type
}
</script>