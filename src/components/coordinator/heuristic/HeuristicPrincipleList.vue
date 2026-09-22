<template>
  <div class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon name="library_books" color="primary" size="28px" class="q-mr-sm" />
      <div>
        <div class="text-h6">
          Principios de {{ framework?.name || 'Framework' }}
        </div>
        <div class="text-caption text-grey-6">
          {{ framework?.author }} ({{ framework?.year }}) ·
          {{ principles.length }} principios
        </div>
      </div>
    </div>

    <!-- Descripción del framework -->
    <q-banner v-if="framework?.description" rounded class="bg-blue-1 text-primary q-mb-md">
      <template v-slot:avatar>
        <q-icon name="info" color="primary" />
      </template>
      {{ framework.description }}
    </q-banner>

    <!-- Lista de principios -->
    <div v-if="principles.length === 0" class="text-center q-py-xl">
      <q-icon name="inbox" size="64px" color="grey-5" />
      <div class="text-grey-6 q-mt-md">
        Este framework no tiene principios registrados
      </div>
    </div>

    <q-list v-else separator class="rounded-borders border">
      <q-expansion-item
        v-for="(principle, index) in sortedPrinciples"
        :key="principle.principleId"
        expand-separator
        :default-opened="index < 3"
      >
        <template v-slot:header>
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" size="36px">
              {{ principle.code }}
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ principle.name }}
            </q-item-label>
            <q-item-label caption>
              Orden #{{ principle.orderIndex }}
            </q-item-label>
          </q-item-section>
          <!-- <q-item-section side>
            <q-icon name="expand_more" />
          </q-item-section> -->
        </template>
        <q-card flat>
          <q-card-section>
            <div class="text-body2 text-grey-8">
              {{ principle.description }}
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  HeuristicFramework,
  HeuristicPrinciple,
} from '@/api/heuristic.api'

const props = defineProps<{
  framework: HeuristicFramework | null
  principles: HeuristicPrinciple[]
  canEdit: boolean
}>()

const sortedPrinciples = computed(() =>
  [...props.principles].sort((a, b) => a.orderIndex - b.orderIndex),
)
</script>

<style scoped>
.bg-blue-1 {
  background-color: #e3f2fd;
}
</style>