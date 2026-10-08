<!-- views/roles/docente/heuristics/FrameworksView.vue -->
<template>
  <div>
    <!-- ============================================================ -->
    <!-- HEADER                                                        -->
    <!-- ============================================================ -->
    <div class="row p-5 items-center justify-between q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">
           Frameworks de Heurísticas
        </div>
        <div class="text-caption text-grey-7">
          Gestiona los conjuntos de heurísticas usados en las evaluaciones
        </div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn
          flat
          icon="refresh"
          label="Actualizar"
          color="primary"
          :loading="loadingFrameworks"
          @click="fetchFrameworks"
        />
        <q-btn
          unelevated
          icon="add"
          label="Nuevo framework"
          color="primary"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- ESTADÍSTICAS                                                  -->
    <!-- ============================================================ -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-primary text-weight-bold">
            {{ frameworks.length }}
          </div>
          <div class="text-caption text-grey-7">Frameworks totales</div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-positive text-weight-bold">
            {{ activeFrameworks.length }}
          </div>
          <div class="text-caption text-grey-7">Activos</div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-h4 text-grey-6 text-weight-bold">
            {{ frameworks.length - activeFrameworks.length }}
          </div>
          <div class="text-caption text-grey-7">Inactivos</div>
        </q-card>
      </div>

    </div>

    <!-- ============================================================ -->
    <!-- LOADING / ERROR                                               -->
    <!-- ============================================================ -->
    <div v-if="loadingFrameworks" class="column items-center q-py-xl">
      <q-spinner color="primary" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">
        Cargando frameworks...
      </div>
    </div>

    <div
      v-else-if="!frameworks.length"
      class="text-center q-py-xl text-grey-6"
    >
      <q-icon name="category" size="64px" />
      <div class="text-h6 q-mt-md">No hay frameworks creados</div>
      <div class="text-caption q-mb-md">
        Crea tu primer framework de heurísticas para comenzar
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Crear primer framework"
        @click="openCreateDialog"
      />
    </div>

    <!-- ============================================================ -->
    <!-- GRID DE FRAMEWORKS                                            -->
    <!-- ============================================================ -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="fw in frameworks"
        :key="fw.frameworkId"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card class="framework-card full-height column">
          <!-- Header con badge -->
          <q-card-section class="q-pb-sm">
            <div class="row items-start justify-between no-wrap">
              <div class="col">
                <div class="row items-center q-gutter-xs q-mb-xs">
                  <q-icon name="menu_book" size="20px" color="primary" />
                  <div class="text-h6 ellipsis">{{ fw.name }}</div>
                </div>

                <div class="row items-center q-gutter-xs">
                  <q-badge
                    :color="fw.isActive ? 'positive' : 'grey-6'"
                    text-color="white"
                    :label="fw.isActive ? 'Activo' : 'Inactivo'"
                  />
                  <q-badge
                    v-if="fw.year"
                    color="blue-grey"
                    outline
                    :label="String(fw.year)"
                  />
                </div>
              </div>

              <q-btn
                flat
                round
                dense
                icon="more_vert"
                size="sm"
              >
                <q-menu auto-close>
                  <q-list style="min-width: 180px">
                    <q-item clickable @click="openEditDialog(fw)">
                      <q-item-section avatar>
                        <q-icon name="edit" color="primary" />
                      </q-item-section>
                      <q-item-section>Editar</q-item-section>
                    </q-item>

                    <q-item clickable @click="toggleActive(fw)">
                      <q-item-section avatar>
                        <q-icon
                          :name="fw.isActive ? 'toggle_off' : 'toggle_on'"
                          :color="fw.isActive ? 'grey-6' : 'positive'"
                        />
                      </q-item-section>
                      <q-item-section>
                        {{ fw.isActive ? 'Desactivar' : 'Activar' }}
                      </q-item-section>
                    </q-item>

                    <q-separator />

                    <q-item clickable @click="confirmDelete(fw)">
                      <q-item-section avatar>
                        <q-icon name="delete" color="negative" />
                      </q-item-section>
                      <q-item-section class="text-negative">
                        Eliminar
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </q-card-section>

          <!-- Descripción -->
          <q-card-section class="q-pt-none q-pb-sm">
            <div
              class="text-body2 text-grey-7"
              style="min-height: 40px;"
            >
              {{ fw.description || 'Sin descripción' }}
            </div>
          </q-card-section>

          <q-separator />

          <!-- Metadata -->
          <q-card-section class="q-py-sm">
            <div class="row items-center q-gutter-sm text-caption text-grey-7">
              <div v-if="fw.author" class="row items-center">
                <q-icon name="person" size="14px" class="q-mr-xs" />
                {{ fw.author }}
              </div>
              <div v-else class="row items-center text-grey-5">
                <q-icon name="person_off" size="14px" class="q-mr-xs" />
                Sin autor
              </div>
            </div>
          </q-card-section>

          <q-space />

          <!-- Actions -->
          <q-card-actions class="q-pa-sm">
            <q-btn
              unelevated
              color="primary"
              icon="visibility"
              label="Ver principios"
              size="sm"
              class="col"
              :to="`/docente/gestion/heuristics/frameworks/${fw.frameworkId}`"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- DIALOG: Crear/Editar                                          -->
    <!-- ============================================================ -->
    <FrameworkFormDialog
      v-model="dialogOpen"
      :framework="editingFramework"
      :saving="savingFramework"
      @save="onSaveFramework"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useHeuristicFrameworks } from '@/composables/docente/useHeuristicFrameworks'
import type { HeuristicFramework } from '@/api/heuristic.api'
import FrameworkFormDialog from '@/components/docente/heuristics/FrameworkFormDialog.vue'

const $q = useQuasar()

const {
  frameworks,
  activeFrameworks,
  loadingFrameworks,
  savingFramework,
  fetchFrameworks,
  createFramework,
  updateFramework,
  deleteFramework,
} = useHeuristicFrameworks()

// ============================================================
// STATE
// ============================================================
const dialogOpen = ref(false)
const editingFramework = ref<HeuristicFramework | null>(null)



// ============================================================
// ACTIONS
// ============================================================
function openCreateDialog() {
  editingFramework.value = null
  dialogOpen.value = true
}

function openEditDialog(fw: HeuristicFramework) {
  editingFramework.value = fw
  dialogOpen.value = true
}

async function onSaveFramework(data: any) {
  try {
    if (editingFramework.value) {
      await updateFramework(editingFramework.value.frameworkId, data)
    } else {
      await createFramework(data)
    }
    dialogOpen.value = false
    editingFramework.value = null
  } catch (e) {
    // Error ya manejado en el composable
  }
}

async function toggleActive(fw: HeuristicFramework) {
  try {
    await updateFramework(fw.frameworkId, { isActive: !fw.isActive })
  } catch (e) {
    // Error ya manejado
  }
}

async function confirmDelete(fw: HeuristicFramework) {
  $q.dialog({
    title: 'Eliminar framework',
    message: `¿Estás seguro de eliminar "${fw.name}"?<br><br>
              <strong class="text-negative">Se eliminarán también todos sus principios asociados.</strong><br>
              Esta acción no se puede deshacer.`,
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
      await deleteFramework(fw.frameworkId)
    } catch (e) {
      // Error ya manejado
    }
  })
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  await fetchFrameworks()
})
</script>

<style scoped>
.framework-card {
  transition: all 0.2s ease;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  height: 100%;
}

.framework-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(30, 58, 138, 0.12);
  border-color: #1e3a8a;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>