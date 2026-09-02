<!-- components/findings/FindingsExporter.vue -->
<template>
  <div class="findings-exporter">
    <q-card flat bordered>
      <q-card-section>
        <div class="row items-center q-col-gutter-md">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">
              📊 Exportar Hallazgos
            </div>
            <div class="text-caption text-grey-6">
              Exporta los hallazgos a Excel con información enriquecida (pantallas, usuarios, emociones traducidas)
            </div>
          </div>

          <div class="col-auto">
            <div class="row q-gutter-sm">
              <!-- Progreso -->
              <div v-if="isExporting" class="flex items-center q-mr-sm">
                <q-spinner color="primary" size="24px" class="q-mr-sm" />
                <span class="text-caption">{{ progress }}%</span>
              </div>

              <q-btn
                color="primary"
                icon="table_chart"
                label="Exportar a Excel"
                :loading="isExporting"
                :disable="findings.length === 0"
                @click="handleExport"
              >
                <q-tooltip>
                  Exporta {{ findings.length }} hallazgos a Excel
                </q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Barra de progreso -->
        <q-linear-progress
          v-if="isExporting"
          :value="progress / 100"
          color="primary"
          class="q-mt-sm"
          size="8px"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useFindingsExport } from '@/composables/findings/useFindingsExport'

const props = defineProps<{
  findings: any[]
  fileKey: string
  projectName?: string
  sessionId?: string
  nodeCache?: Map<string, { name: string; type: string; componentId?: string }>  
  getNodeName?: (id: string) => string  
  getNodeType?: (id: string) => string  
}>()

const $q = useQuasar()
const { isExporting, progress, exportFindingsToExcel } = useFindingsExport()

const hasFindings = computed(() => props.findings && props.findings.length > 0)

async function handleExport() {
  if (!hasFindings.value) {
    $q.notify({
      type: 'warning',
      message: 'No hay hallazgos para exportar'
    })
    return
  }

  if (!props.fileKey) {
    $q.notify({
      type: 'warning',
      message: 'No se encontró el File Key del proyecto'
    })
    return
  }

  await exportFindingsToExcel(
    props.findings,
    props.fileKey,
    props.projectName || 'Proyecto',
    props.sessionId || '',
    props.nodeCache,
    props.getNodeName,
    props.getNodeType
  )
}
</script>