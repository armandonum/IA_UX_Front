import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { reportsApi } from '@/api/reports.api'
import type {
  PrePostReportRow,
  FindingsByRequirementRow,
  FindingsByFlowRow,
  FindingsByScreenRow,
  FindingsByUiElementRow,
  CriticalInteractionRow,
  AffectiveByTaskRow,
  SentimentWithFindingRow,
  ExpertCommentRow,
  CentralizerReport,
  MyProject,
} from '@/api/reports.api'

export type ReportType =
  | 'pre-post'
  | 'by-requirement'
  | 'by-flow'
  | 'by-screen'
  | 'by-ui-element'
  | 'critical'
  | 'affective-task'
  | 'sentiment-findings'
  | 'expert-comments'
  | 'centralizer'

export function useFormalReports() {
  const $q = useQuasar()

  const loading = ref(false)
  const projects = ref<MyProject[]>([])
  const selectedProjectId = ref<string | null>(null)
  const activeReport = ref<ReportType>('centralizer')

  // Data por reporte
  const prePostData = ref<PrePostReportRow[]>([])
  const findingsByRequirement = ref<FindingsByRequirementRow[]>([])
  const findingsByFlow = ref<FindingsByFlowRow[]>([])
  const findingsByScreen = ref<FindingsByScreenRow[]>([])
  const findingsByUiElement = ref<FindingsByUiElementRow[]>([])
  const criticalInteractions = ref<CriticalInteractionRow[]>([])
  const affectiveByTask = ref<AffectiveByTaskRow[]>([])
  const sentimentsWithFindings = ref<SentimentWithFindingRow[]>([])
  const expertComments = ref<ExpertCommentRow[]>([])
  const centralizerReport = ref<CentralizerReport | null>(null)

  // ============================================================
  // Cargar proyectos
  // ============================================================
  async function loadProjects(userId: string) {
    loading.value = true
    try {
      const { data } = await reportsApi.getMyProjects(userId)
      projects.value = data
      if (data.length > 0 && !selectedProjectId.value) {
        selectedProjectId.value = data[0].project_id
      }
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Error al cargar proyectos' })
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // Cargar reporte activo
  // ============================================================
  async function loadActiveReport() {
    if (!selectedProjectId.value) return

    loading.value = true
    try {
      const pid = selectedProjectId.value

      switch (activeReport.value) {
        case 'pre-post':
          prePostData.value = (await reportsApi.getPrePostReport(pid)).data
          break
        case 'by-requirement':
          findingsByRequirement.value = (await reportsApi.getFindingsByRequirement(pid)).data
          break
        case 'by-flow':
          findingsByFlow.value = (await reportsApi.getFindingsByFlow(pid)).data
          break
        case 'by-screen':
          findingsByScreen.value = (await reportsApi.getFindingsByScreen(pid)).data
          break
        case 'by-ui-element':
          findingsByUiElement.value = (await reportsApi.getFindingsByUiElement(pid)).data
          break
        case 'critical':
          criticalInteractions.value = (await reportsApi.getCriticalInteractions(pid)).data
          break
        case 'affective-task':
          affectiveByTask.value = (await reportsApi.getAffectiveByTask(pid)).data
          break
        case 'sentiment-findings':
          sentimentsWithFindings.value = (await reportsApi.getSentimentsWithFindings(pid)).data
          break
        case 'expert-comments':
          expertComments.value = (await reportsApi.getExpertComments(pid)).data
          break
        case 'centralizer':
          centralizerReport.value = (await reportsApi.getCentralizerReport(pid)).data
          break
      }
    } catch (error) {
      console.error(error)
      $q.notify({ type: 'negative', message: 'Error al cargar el reporte' })
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // Cambiar de reporte
  // ============================================================
  async function changeReport(type: ReportType) {
    activeReport.value = type
    await loadActiveReport()
  }

  // ============================================================
  // Cambiar de proyecto
  // ============================================================
  async function changeProject(projectId: string) {
    selectedProjectId.value = projectId
    await loadActiveReport()
  }

  const currentProject = computed(() =>
    projects.value.find((p) => p.project_id === selectedProjectId.value),
  )

  return {
    // Estado
    loading,
    projects,
    selectedProjectId,
    activeReport,
    currentProject,

    // Data
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

    // Acciones
    loadProjects,
    loadActiveReport,
    changeReport,
    changeProject,
  }
}