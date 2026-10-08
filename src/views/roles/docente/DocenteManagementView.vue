<!-- views/roles/docente/DocenteManagementView.vue -->
<template>
  <q-page class="q-pa-md">
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">
          <q-icon name="school" size="sm" class="q-mr-sm" />
          Panel de Gestión Docente
        </div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Administra heurísticas, evaluaciones, cuestionarios y más
        </div>
      </div>

      <!-- Selector de semestre -->
      <div style="min-width: 260px;">
        <q-select
          v-model="selectedSemesterId"
          :options="semesterStore.semesters"
          option-label="name"
          option-value="semesterId"
          emit-value
          map-options
          outlined
          dense
          label="Semestre activo"
          :loading="semesterStore.loading"
        >
          <template v-slot:prepend>
            <q-icon name="calendar_month" color="primary" />
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>
                  {{ scope.opt.name }}
                  <q-badge
                    v-if="scope.opt.isActive"
                    color="positive"
                    class="q-ml-sm"
                    label="Activo"
                  />
                </q-item-label>
                <q-item-label caption>{{ scope.opt.code }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- AVISO SI NO HAY SEMESTRE                                      -->
    <!-- ============================================================ -->
    <q-banner
      v-if="!selectedSemesterId"
      rounded
      class="bg-orange-1 text-orange-10 q-mb-md"
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>
      Selecciona un semestre para comenzar a gestionar.
    </q-banner>

    <!-- ============================================================ -->
    <!-- TABS PRINCIPALES                                              -->
    <!-- ============================================================ -->
    <q-card v-else flat bordered>
      <q-tabs
        v-model="activeTab"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="text-grey-7"
        narrow-indicator
        no-caps
      >
        <q-tab name="frameworks" icon="category" label="Heurísticas" />
        <q-tab
          name="heuristic-evaluations"
          icon="fact_check"
          label="Eval. Heurísticas"
        />
        <q-tab
          name="cognitive-evaluations"
          icon="psychology"
          label="Eval. Cognitivas"
        />
        <q-tab name="questionnaires" icon="quiz" label="Cuestionarios" />
        <q-tab name="projects" icon="folder" label="Proyectos" />
        <q-tab name="tasks" icon="assignment" label="Requerimientos" />
        <q-tab name="flows" icon="route" label="Flujos" />
        <q-tab name="students" icon="group" label="Estudiantes" />
        <q-tab name="reviewers" icon="badge" label="Evaluadores" />
        <q-tab name="reports" icon="analytics" label="Reportes" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated keep-alive>
        <!-- ============================================================ -->
        <!-- TAB: Heurísticas                                              -->
        <!-- ============================================================ -->
   <q-tab-panel name="frameworks" class="q-pa-none">
  <FrameworksView />
</q-tab-panel>

        <!-- ============================================================ -->
        <!-- TAB: Evaluaciones Heurísticas                                 -->
        <!-- ============================================================ -->
        <q-tab-panel name="heuristic-evaluations" class="q-pa-none">
  <EvaluationsListView />
</q-tab-panel>

        <!-- ============================================================ -->
        <!-- TAB: Evaluaciones Cognitivas                                  -->
        <!-- ============================================================ -->
        <q-tab-panel name="cognitive-evaluations" class="q-pa-md">
          <div class="text-center q-py-xl text-grey-6">
            <q-icon name="psychology" size="48px" />
            <div class="text-h6 q-mt-sm">Evaluaciones Cognitivas</div>
            <div class="text-caption">
              Próximamente: Recorrido cognitivo (Fase 4)
            </div>
          </div>
        </q-tab-panel>

        <!-- ============================================================ -->
        <!-- TAB: Cuestionarios                                            -->
        <!-- ============================================================ -->
        <q-tab-panel name="questionnaires" class="q-pa-none">
          <Questionaries />
        </q-tab-panel>

        <!-- ============================================================ -->
        <!-- TAB: Proyectos                                                -->
        <!-- ============================================================ -->
        <q-tab-panel name="projects" class="q-pa-none">
          <ProyectsPanel :semester-id="selectedSemesterId" />
        </q-tab-panel>

        <!-- ============================================================ -->
        <!-- TAB: Requerimientos                                           -->
        <!-- ============================================================ -->
        <q-tab-panel name="tasks" class="q-pa-none">
          <TasksPanel :semester-id="selectedSemesterId" />
        </q-tab-panel>

        <!-- ============================================================ -->
        <!-- TAB: Flujos                                                   -->
        <!-- ============================================================ -->
        <q-tab-panel name="flows" class="q-pa-none">
          <FlowsPanel />
        </q-tab-panel>

        <!-- ============================================================ -->
        <!-- TAB: Estudiantes                                              -->
        <!-- ============================================================ -->
        <q-tab-panel name="students" class="q-pa-none">
          <StudentsPanel :semester-id="selectedSemesterId" />
        </q-tab-panel>

        <!-- ============================================================ -->
        <!-- TAB: Evaluadores                                              -->
        <!-- ============================================================ -->
        <q-tab-panel name="reviewers" class="q-pa-none">
          <ReviewersPanel :semester-id="selectedSemesterId" />
        </q-tab-panel>

        <!-- ============================================================ -->
        <!-- TAB: Reportes                                                 -->
        <!-- ============================================================ -->
        <q-tab-panel name="reports" class="q-pa-md">
          <div class="text-center q-py-xl text-grey-6">
            <q-icon name="analytics" size="48px" />
            <div class="text-h6 q-mt-sm">Reportes</div>
            <div class="text-caption">
              Próximamente: Reportes de los 3 métodos (Fase 6)
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDocenteManagement } from '@/composables/useDocenteManagement'
import { useSemesterStore } from '@/stores/semester.store'

// Componentes existentes
import Questionaries from '@/components/docente/Questionaries.vue'
import ProyectsPanel from '@/components/docente/ProyectsPanel.vue'
import TasksPanel from '@/components/docente/TasksPanel.vue'
import FlowsPanel from '@/components/docente/FlowsPanel.vue'
import StudentsPanel from '@/components/docente/StudentsPanel.vue'
import ReviewersPanel from '@/components/docente/ReviewersPanel.vue'
import FrameworksView from '@/views/roles/docente/heuristics/FrameworksView.vue'
import EvaluationsListView from '@/views/roles/docente/heuristics/EvaluationsListView.vue'

const semesterStore = useSemesterStore()

const {
  selectedSemesterId,
  activeTab,
  loadSemesters,
} = useDocenteManagement()

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  await loadSemesters()
})
</script>