// composables/findings/useFindingsExport.ts
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import * as XLSX from 'xlsx'
import {
  getHumanLabel,
  getEmotionTemplate,
} from '@/types/expert/findings.dictionary'
import { formatEmotion, formatDate } from '@/composables/expert/dataTranslator'

export function useFindingsExport() {
  const $q = useQuasar()
  const isExporting = ref(false)
  const progress = ref(0)

  /**
   * Exporta hallazgos a Excel con formato amigable
   */
  async function exportFindingsToExcel(
    findings: any[],
    fileKey: string,
    projectName: string = 'Proyecto',
    sessionId: string = '',
    nodeCache?: Map<string, { name: string; type: string; componentId?: string }>,
    getNodeName?: (id: string) => string,
    getNodeType?: (id: string) => string,
  ) {
    if (!findings.length) {
      $q.notify({ type: 'warning', message: 'No hay hallazgos para exportar' })
      return
    }

    isExporting.value = true
    progress.value = 0

    try {
      // ============================================================
      // HOJA 1: HALLAZGOS DETALLADOS
      // ============================================================
      const findingsSheet = findings.map((f, idx) => {
        const nodeName = f.nodeId && getNodeName ? getNodeName(f.nodeId) : f.nodeId || '—'
        const nodeType = f.nodeId && getNodeType ? getNodeType(f.nodeId) : '—'

        return {
          '#': idx + 1,
          'Tipo': getHumanLabel('type', f.type),
          'Severidad': getHumanLabel('severity', f.severity),
          'Estado': getHumanLabel('status', f.status),
          'Descripción': f.description || '',
          'Recomendación': f.recommendation || '',
          'Impacto': getHumanLabel('impact', f.impact),
          'Prioridad': getHumanLabel('priority', f.priority),
          'Frecuencia': f.frequency || 1,
          'Emoción detectada': formatEmotion(f.emotionInferred),
          'Sentimiento': f.textualSentiment || '—',
          'Comentario del usuario': f.userComment || '—',
          'Comentario del experto': f.expertComment || '—',
          'Pantalla': nodeName,
          'Tipo de pantalla': nodeType,
          'Creado': formatDate(f.createdAt),
        }
      })

      const ws1 = XLSX.utils.json_to_sheet(findingsSheet)
      ws1['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 50 }, { wch: 50 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
        { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 20 },
      ]
      progress.value = 40

      // ============================================================
      // HOJA 2: RESUMEN
      // ============================================================
      const total = findings.length
      const bySeverity = groupCount(findings, 'severity')
      const byStatus = groupCount(findings, 'status')
      const byType = groupCount(findings, 'type')
      const byEmotion = groupCount(findings.filter(f => f.emotionInferred), 'emotionInferred')
      const bySentiment = groupCount(findings.filter(f => f.textualSentiment), 'textualSentiment')

      const summaryRows: any[] = [
        { 'Métrica': 'Total de hallazgos', 'Valor': total },
        { 'Métrica': '', 'Valor': '' },
        { 'Métrica': '--- POR SEVERIDAD ---', 'Valor': '' },
        ...Object.entries(bySeverity).map(([k, v]) => ({
          'Métrica': getHumanLabel('severity', k),
          'Valor': v,
        })),
        { 'Métrica': '', 'Valor': '' },
        { 'Métrica': '--- POR ESTADO ---', 'Valor': '' },
        ...Object.entries(byStatus).map(([k, v]) => ({
          'Métrica': getHumanLabel('status', k),
          'Valor': v,
        })),
        { 'Métrica': '', 'Valor': '' },
        { 'Métrica': '--- POR TIPO ---', 'Valor': '' },
        ...Object.entries(byType).map(([k, v]) => ({
          'Métrica': getHumanLabel('type', k),
          'Valor': v,
        })),
      ]

      if (Object.keys(byEmotion).length > 0) {
        summaryRows.push({ 'Métrica': '', 'Valor': '' })
        summaryRows.push({ 'Métrica': '--- POR EMOCIÓN ---', 'Valor': '' })
        Object.entries(byEmotion).forEach(([k, v]) => {
          const tpl = getEmotionTemplate(k)
          summaryRows.push({ 'Métrica': `${tpl.emoji} ${tpl.labelEs}`, 'Valor': v })
        })
      }

      if (Object.keys(bySentiment).length > 0) {
        summaryRows.push({ 'Métrica': '', 'Valor': '' })
        summaryRows.push({ 'Métrica': '--- POR SENTIMIENTO ---', 'Valor': '' })
        Object.entries(bySentiment).forEach(([k, v]) => {
          summaryRows.push({ 'Métrica': k, 'Valor': v })
        })
      }

      const ws2 = XLSX.utils.json_to_sheet(summaryRows)
      ws2['!cols'] = [{ wch: 35 }, { wch: 15 }]
      progress.value = 70

      // ============================================================
      // HOJA 3: RECOMENDACIONES
      // ============================================================
      const recommendations = findings
        .filter((f) => f.recommendation)
        .map((f, idx) => ({
          '#': idx + 1,
          'Prioridad': getHumanLabel('priority', f.priority),
          'Severidad': getHumanLabel('severity', f.severity),
          'Hallazgo': f.description,
          'Recomendación': f.recommendation,
        }))

      const ws3 = XLSX.utils.json_to_sheet(
        recommendations.length > 0
          ? recommendations
          : [{ '#': 1, 'Prioridad': '—', 'Severidad': '—', 'Hallazgo': 'Sin recomendaciones', 'Recomendación': '—' }],
      )
      ws3['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 50 }, { wch: 50 },
      ]
      progress.value = 90

      // ============================================================
      // CREAR WORKBOOK
      // ============================================================
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws1, 'Hallazgos')
      XLSX.utils.book_append_sheet(wb, ws2, 'Resumen')
      XLSX.utils.book_append_sheet(wb, ws3, 'Recomendaciones')

      // ============================================================
      // GUARDAR
      // ============================================================
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `Hallazgos_${sanitizeFilename(projectName)}_${timestamp}.xlsx`
      XLSX.writeFile(wb, filename)

      progress.value = 100

      $q.notify({
        type: 'positive',
        message: `✅ Excel exportado: ${filename}`,
        icon: 'table_chart',
      })
    } catch (error) {
      console.error('Error exportando Excel:', error)
      $q.notify({
        type: 'negative',
        message: 'Error al exportar el Excel',
      })
    } finally {
      isExporting.value = false
      setTimeout(() => {
        progress.value = 0
      }, 1000)
    }
  }

  function groupCount(items: any[], field: string): Record<string, number> {
    const result: Record<string, number> = {}
    items.forEach((item) => {
      const key = item[field] || 'sin_definir'
      result[key] = (result[key] || 0) + 1
    })
    return result
  }

  function sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-z0-9_-]/gi, '_')
      .replace(/_+/g, '_')
      .slice(0, 50)
  }

  return {
    isExporting,
    progress,
    exportFindingsToExcel,
  }
}