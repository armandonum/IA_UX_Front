<!-- views/roles/docente/heuristics/FrameworkDetailView.vue -->
<template>
  <div>
    <!-- ============================================================ -->
    <!-- BREADCRUMB / VOLVER                                           -->
    <!-- ============================================================ -->
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        dense
        icon="arrow_back"
        label="Volver a frameworks"
        color="primary"
        :to="'/docente/gestion'"
        class="q-mr-md"
      />
      <q-breadcrumbs class="text-grey-7" active-color="primary">
        <q-breadcrumbs-el label="Heurísticas" icon="category" />
        <q-breadcrumbs-el :label="framework?.name || 'Cargando...'" />
      </q-breadcrumbs>
    </div>

    <!-- ============================================================ -->
    <!-- LOADING                                                       -->
    <!-- ============================================================ -->
    <div v-if="loading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">Cargando...</div>
    </div>

    <!-- ============================================================ -->
    <!-- FRAMEWORK HEADER                                              -->
    <!-- ============================================================ -->
    <template v-else-if="framework">
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-start justify-between no-wrap">
            <div class="col">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <q-icon name="menu_book" size="32px" color="primary" />
                <div class="text-h5 text-weight-bold">
                  {{ framework.name }}
                </div>
                <q-badge
                  :color="framework.isActive ? 'positive' : 'grey-6'"
                  text-color="white"
                  :label="framework.isActive ? 'Activo' : 'Inactivo'"
                />
              </div>

              <div
                v-if="framework.description"
                class="text-body1 text-grey-7 q-mb-md"
              >
                {{ framework.description }}
              </div>

              <div class="row q-gutter-md text-caption text-grey-6">
                <div v-if="framework.author" class="row items-center">
                  <q-icon name="person" size="14px" class="q-mr-xs" />
                  {{ framework.author }}
                </div>
                <div v-if="framework.year" class="row items-center">
                  <q-icon name="calendar_today" size="14px" class="q-mr-xs" />
                  {{ framework.year }}
                </div>
                <div class="row items-center">
                  <q-icon name="list" size="14px" class="q-mr-xs" />
                  {{ principles.length }} principios
                </div>
              </div>
            </div>

            <div class="row q-gutter-sm">
              <q-btn
                flat
                icon="edit"
                label="Editar"
                color="primary"
                @click="openEditFramework"
              />
              <q-btn
                flat
                icon="refresh"
                color="primary"
                :loading="loadingPrinciples"
                @click="reload"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ============================================================ -->
      <!-- PRINCIPIOS                                                    -->
      <!-- ============================================================ -->
      <q-card flat bordered>
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold">
              📋 Principios
            </div>
            <div class="text-caption text-grey-7">
              Arrastra los principios para reordenarlos
            </div>
          </div>

          <q-btn
            unelevated
            icon="add"
            label="Nuevo principio"
            color="primary"
            @click="openCreatePrincipleDialog"
          />
        </q-card-section>

        <q-separator />

        <!-- Sin principios -->
        <q-card-section
          v-if="!principles.length"
          class="text-center q-py-xl text-grey-6"
        >
          <q-icon name="list" size="48px" />
          <div class="text-h6 q-mt-sm">No hay principios</div>
          <div class="text-caption q-mb-md">
            Agrega el primer principio a este framework
          </div>
          <q-btn
            unelevated
            color="primary"
            icon="add"
            label="Crear primer principio"
            @click="openCreatePrincipleDialog"
          />
        </q-card-section>

        <!-- Lista de principios -->
        <q-list v-else separator>
          <q-item
            v-for="(principle, index) in principles"
            :key="principle.principleId"
            class="principle-item"
          >
            <q-item-section avatar style="min-width: 60px;">
              <q-badge
                color="primary"
                text-color="white"
                class="principle-code"
              >
                {{ principle.code }}
              </q-badge>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-subtitle2 text-weight-medium">
                {{ principle.name }}
                <q-badge
                  v-if="!principle.isActive"
                  color="grey-6"
                  text-color="white"
                  label="Inactivo"
                  class="q-ml-sm"
                />
              </q-item-label>
              <q-item-label caption class="text-grey-7">
                {{ principle.description }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-xs">
                <q-badge
                  color="grey-5"
                  outline
                  class="order-badge"
                  :label="`#${principle.orderIndex}`"
                />
                <q-btn
                  flat
                  dense
                  round
                  icon="edit"
                  color="primary"
                  size="sm"
                  @click="openEditPrincipleDialog(principle)"
                >
                  <q-tooltip>Editar principio</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  round
                  icon="delete"
                  color="negative"
                  size="sm"
                  @click="confirmDeletePrinciple(principle)"
                >
                  <q-tooltip>Eliminar principio</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </template>

    <!-- ============================================================ -->
    <!-- NOT FOUND                                                     -->
    <!-- ============================================================ -->
    <div
      v-else
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="error_outline" size="64px" />
      <div class="text-h6 q-mt-md">Framework no encontrado</div>
      <q-btn
        flat
        color="primary"
        icon="arrow_back"
        label="Volver a frameworks"
        :to="'/docente/gestion'"
        class="q-mt-md"
      />
    </div>

    <!-- ============================================================ -->
    <!-- DIALOGS                                                       -->
    <!-- ============================================================ -->
    <FrameworkFormDialog
      v-model="frameworkDialogOpen"
      :framework="framework"
      :saving="savingFramework"
      @save="onSaveFramework"
    />

    <PrincipleFormDialog
      v-model="principleDialogOpen"
      :framework-id="frameworkId"
      :principle="editingPrinciple"
      :default-order-index="principles.length + 1"
      :saving="savingPrinciple"
      @save="onSavePrinciple"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useHeuristicFrameworks } from '@/composables/docente/useHeuristicFrameworks'
import type { HeuristicPrinciple } from '@/api/heuristic.api'
import FrameworkFormDialog from '@/components/docente/heuristics/FrameworkFormDialog.vue'
import PrincipleFormDialog from '@/components/docente/heuristics/PrincipleFormDialog.vue'

const route = useRoute()
const $q = useQuasar()

const frameworkId = computed(() => route.params.frameworkId as string)

const {
  currentFramework: framework,
  principles,
  loadingPrinciples,
  savingFramework,
  savingPrinciple,
  fetchFramework,
  fetchPrinciples,
  updateFramework,
  createPrinciple,
  updatePrinciple,
  deletePrinciple,
} = useHeuristicFrameworks()

const loading = ref(true)

// ============================================================
// STATE
// ============================================================
const frameworkDialogOpen = ref(false)
const principleDialogOpen = ref(false)
const editingPrinciple = ref<HeuristicPrinciple | null>(null)

// ============================================================
// ACTIONS
// ============================================================
async function load() {
  loading.value = true
  try {
    await fetchFramework(frameworkId.value)
    await fetchPrinciples(frameworkId.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function reload() {
  await fetchPrinciples(frameworkId.value)
}

function openEditFramework() {
  frameworkDialogOpen.value = true
}

async function onSaveFramework(data: any) {
  try {
    await updateFramework(frameworkId.value, data)
    frameworkDialogOpen.value = false
  } catch (e) {
    // Error manejado
  }
}

function openCreatePrincipleDialog() {
  editingPrinciple.value = null
  principleDialogOpen.value = true
}

function openEditPrincipleDialog(p: HeuristicPrinciple) {
  editingPrinciple.value = p
  principleDialogOpen.value = true
}

async function onSavePrinciple(data: any) {
  try {
    if (editingPrinciple.value) {
      await updatePrinciple(editingPrinciple.value.principleId, data)
    } else {
      await createPrinciple(data)
    }
    principleDialogOpen.value = false
    editingPrinciple.value = null
  } catch (e) {
    // Error manejado
  }
}

function confirmDeletePrinciple(p: HeuristicPrinciple) {
  $q.dialog({
    title: 'Eliminar principio',
    message: `¿Estás seguro de eliminar "${p.code} - ${p.name}"?
              <br><br>
              <strong class="text-negative">Si hay observaciones asociadas, no se podrá eliminar.</strong>`,
    html: true,
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7',
    },
    ok: {
      label: 'Eliminar',
      color: 'negative',
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    try {
      await deletePrinciple(p.principleId)
    } catch (e) {
      // Error manejado
    }
  })
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(load)
</script>

<style scoped>
.principle-item {
  transition: background-color 0.15s;
}

.principle-item:hover {
  background-color: #f8fafc;
}

.principle-code {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 4px 8px;
  min-width: 40px;
}

.order-badge {
  font-size: 11px;
  padding: 2px 6px;
}
</style>