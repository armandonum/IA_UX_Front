<template>
  <q-page class="q-pa-md">
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">
          📊 Reportes de Experimentos Formales
        </div>
        <div class="text-caption text-grey-7">
          Análisis agregado de todos los métodos aplicados al proyecto
        </div>
      </div>

      <q-btn
        color="primary"
        icon="refresh"
        label="Actualizar"
        flat
        :loading="loading"
        @click="loadActiveReport"
      />
    </div>

    <!-- ============================================================ -->
    <!-- FILTROS                                                       -->
    <!-- ============================================================ -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-6">
            <q-select
              v-model="selectedProjectId"
              :options="projects"
              option-label="project_name"
              option-value="project_id"
              emit-value
              map-options
              label="Proyecto"
              outlined
              dense
              :loading="loading"
              @update:model-value="changeProject"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.project_name }}</q-item-label>
                    <q-item-label caption>
                      {{ scope.opt.sessions_count }} sesiones
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-6">
            <q-btn
              color="primary"
              icon="assessment"
              label="Actualizar datos"
              :loading="loading"
              @click="loadActiveReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ============================================================ -->
    <!-- TABS DE REPORTES                                              -->
    <!-- ============================================================ -->
    <q-card flat bordered>
      <q-tabs
        v-model="activeReport"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="text-grey-7"
        narrow-indicator
        @update:model-value="changeReport"
      >
        <q-tab name="centralizer" icon="dashboard" label="Centralizador" />
        <q-tab name="pre-post" icon="quiz" label="Pre/Post Test" />
        <q-tab name="by-requirement" icon="rule" label="Por Requerimiento" />
        <q-tab name="by-flow" icon="route" label="Por Flujo" />
        <q-tab name="by-screen" icon="screenshot_monitor" label="Por Interfaz" />
        <q-tab name="by-ui-element" icon="widgets" label="Por Elemento UI" />
        <q-tab name="critical" icon="warning" label="Interacciones Críticas" />
        <q-tab name="affective-task" icon="sentiment_satisfied" label="Afectivo por Tarea" />
        <q-tab name="sentiment-findings" icon="psychology" label="Sentimiento + Hallazgo" />
        <q-tab name="expert-comments" icon="rate_review" label="Comentarios Expertos" />
      </q-tabs>

      <q-separator />

      <!-- ============================================================ -->
      <!-- CONTENIDO POR TAB                                             -->
      <!-- ============================================================ -->
      <q-tab-panels v-model="activeReport" animated>
        <q-tab-panel name="centralizer">
          <CentralizerReport :data="centralizerReport" :loading="loading" />
        </q-tab-panel>

        <q-tab-panel name="pre-post">
          <PrePostComparisonCard :data="prePostData" :loading="loading" />
        </q-tab-panel>

        <q-tab-panel name="by-requirement">
          <FindingsByRequirementReport :data="findingsByRequirement" :loading="loading" />
        </q-tab-panel>

        <q-tab-panel name="by-flow">
          <FindingsByFlowReport :data="findingsByFlow" :loading="loading" />
        </q-tab-panel>

        <q-tab-panel name="by-screen">
          <FindingsByScreenReport :data="findingsByScreen" :loading="loading" />
        </q-tab-panel>

        <q-tab-panel name="by-ui-element">
          <FindingsByUiElementReport :data="findingsByUiElement" :loading="loading" />
        </q-tab-panel>

        <q-tab-panel name="critical">
          <CriticalInteractionsReport :data="criticalInteractions" :loading="loading" />
        </q-tab-panel>

        <q-tab-panel name="affective-task">
          <AffectiveByTaskReport :data="affectiveByTask" :loading="loading" />
        </q-tab-panel>

        <q-tab-panel name="sentiment-findings">
          <SentimentFindingsReport :data="sentimentsWithFindings" :loading="loading" />
        </q-tab-panel>

        <q-tab-panel name="expert-comments">
          <ExpertCommentsReport :data="expertComments" :loading="loading" />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useFormalReports } from '@/composables/reports/useFormalReports'

import CentralizerReport from '@/components/reports/CentralizerReport.vue'
import PrePostComparisonCard from '@/components/reports/PrePostComparisonCard.vue'
import FindingsByRequirementReport from '@/components/reports/FindingsByRequirementReport.vue'
import FindingsByFlowReport from '@/components/reports/FindingsByFlowReport.vue'
import FindingsByScreenReport from '@/components/reports/FindingsByScreenReport.vue'
import FindingsByUiElementReport from '@/components/reports/FindingsByUiElementReport.vue'
import CriticalInteractionsReport from '@/components/reports/CriticalInteractionsReport.vue'
import AffectiveByTaskReport from '@/components/reports/AffectiveByTaskReport.vue'
import SentimentFindingsReport from '@/components/reports/SentimentFindingsReport.vue'
import ExpertCommentsReport from '@/components/reports/ExpertCommentsReport.vue'

const auth = useAuthStore()

const {
  loading,
  projects,
  selectedProjectId,
  activeReport,
  prePostData,
  findingsByRequirement,
  findingsByFlow,
  findingsByScreen,
  findingsByUiElement,
  criticalInteractions,
  affectiveByTask,
  sentimentsWithFindings,
  expertComments,
  centralizerReport,
  loadProjects,
  loadActiveReport,
  changeReport,
  changeProject,
} = useFormalReports()

onMounted(async () => {
  const userId = auth.user?.user_id
  if (!userId) return

  await loadProjects(userId)
  await loadActiveReport()
})
</script>