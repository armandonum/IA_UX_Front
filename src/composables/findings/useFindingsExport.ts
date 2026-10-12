// composables/findings/useFindingsExport.ts
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import * as XLSX from 'xlsx-js-style'
import {
  getHumanLabel,
  getEmotionTemplate,
} from '@/types/expert/findings.dictionary'
import { formatEmotion, formatDate } from '@/composables/expert/dataTranslator'

// ============================================================
// PALETA DE COLORES PARA EL EXCEL
// ============================================================
const COLORS = {
  // Título
  titleBg: '1E3A8A',       // Azul oscuro
  titleFg: 'FFFFFF',

  // Headers
  headerBg: '3B82F6',      // Azul medio
  headerFg: 'FFFFFF',

  // Severidades
  criticalBg: 'FEE2E2',    // Rojo claro
  highBg: 'FED7AA',        // Naranja claro
  mediumBg: 'FEF3C7',      // Amarillo claro
  lowBg: 'DBEAFE',         // Azul claro
  infoBg: 'F1F5F9',        // Gris claro

  // Filas
  evenRowBg: 'FFFFFF',
  oddRowBg: 'F8FAFC',

  // Bordes
  border: 'CBD5E1',
}

// ============================================================
// ESTILOS REUTILIZABLES
// ============================================================
const STYLE_TITLE = {
  fill: { fgColor: { rgb: COLORS.titleBg } },
  font: { bold: true, color: { rgb: COLORS.titleFg }, sz: 16, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } },
  },
}

const STYLE_HEADER = {
  fill: { fgColor: { rgb: COLORS.headerBg } },
  font: { bold: true, color: { rgb: COLORS.headerFg }, sz: 11, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } },
  },
}

const STYLE_CELL = {
  font: { sz: 10, name: 'Calibri' },
  alignment: { vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } },
  },
}

const STYLE_CELL_CENTER = {
  ...STYLE_CELL,
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
}

function getSeverityRowStyle(severity: string): any {
  const bgMap: Record<string, string> = {
    critical: COLORS.criticalBg,
    high: COLORS.highBg,
    medium: COLORS.mediumBg,
    low: COLORS.lowBg,
    info: COLORS.infoBg,
  }
  const bg = bgMap[severity] || COLORS.evenRowBg
  return {
    ...STYLE_CELL,
    fill: { fgColor: { rgb: bg } },
  }
}

function getSeverityRowStyleCenter(severity: string): any {
  const bgMap: Record<string, string> = {
    critical: COLORS.criticalBg,
    high: COLORS.highBg,
    medium: COLORS.mediumBg,
    low: COLORS.lowBg,
    info: COLORS.infoBg,
  }
  const bg = bgMap[severity] || COLORS.evenRowBg
  return {
    ...STYLE_CELL_CENTER,
    fill: { fgColor: { rgb: bg } },
  }
}

function getSeverityLabelColor(severity: string): { bg: string; fg: string } {
  const map: Record<string, { bg: string; fg: string }> = {
    critical: { bg: 'DC2626', fg: 'FFFFFF' },
    high: { bg: 'EA580C', fg: 'FFFFFF' },
    medium: { bg: 'D97706', fg: 'FFFFFF' },
    low: { bg: '0284C7', fg: 'FFFFFF' },
    info: { bg: '64748B', fg: 'FFFFFF' },
  }
  return map[severity] || { bg: '64748B', fg: 'FFFFFF' }
}

// ============================================================
// COMPOSABLE
// ============================================================
export function useFindingsExport() {
  const $q = useQuasar()
  const isExporting = ref(false)
  const progress = ref(0)

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
      const headers = [
        '#',
        'Tipo',
        'Severidad',
        'Estado',
        'Descripción',
        'Recomendación',
        'Impacto',
        'Prioridad',
        'Frecuencia',
        'Emoción',
        'Sentimiento',
        'Comentario usuario',
        'Comentario experto',
        'Pantalla / Componente',
        'Tipo',
        'Creado',
      ]

      const rows = findings.map((f, idx) => {
        // Extraer el nombre y tipo del nodeId si viene enriquecido
        let nodeDisplay = f.nodeId || '—'
        let nodeType = '—'

        // Si el nodeId tiene formato "Nombre (TIPO) [ID]"
        const match = String(f.nodeId || '').match(/^(.+?)\s+\(([^)]+)\)\s+\[([^\]]+)\]$/)
        if (match) {
          nodeDisplay = `${match[1]} [${match[3]}]`
          nodeType = match[2]
        } else if (f.nodeId && getNodeName && getNodeType) {
          // Fallback: intentar resolver con el cache
          const rawId = String(f.nodeId)
          nodeDisplay = getNodeName(rawId) || rawId
          nodeType = getNodeType(rawId) || '—'
        }

        return [
          idx + 1,
          getHumanLabel('type', f.type),
          getHumanLabel('severity', f.severity),
          getHumanLabel('status', f.status),
          f.description || '',
          f.recommendation || '',
          getHumanLabel('impact', f.impact),
          getHumanLabel('priority', f.priority),
          f.frequency || 1,
          formatEmotion(f.emotionInferred),
          f.textualSentiment || '—',
          f.userComment || '—',
          f.expertComment || '—',
          nodeDisplay,
          nodeType,
          formatDate(f.createdAt),
        ]
      })

      // Construir array de arrays (más control sobre estilos por celda)
      const wsData: any[][] = []

      // Fila 1: Título mergeado
      const titleRow = [`Hallazgos - ${projectName}`]
      wsData.push(titleRow)

      // Fila 2: vacía (separador)
      wsData.push([])

      // Fila 3: Headers
      wsData.push(headers)

      // Filas de datos
      rows.forEach((row) => wsData.push(row))

      // Crear worksheet
      const ws1 = XLSX.utils.aoa_to_sheet(wsData)

      // ============================================================
      // APLICAR ESTILOS
      // ============================================================

      // Título mergeado (A1:P1)
      if (!ws1['!merges']) ws1['!merges'] = []
      ws1['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 15 } })

      // Aplicar estilo a cada celda
      const range = XLSX.utils.decode_range(ws1['!ref'] || 'A1:P1')

      // Fila del título
      for (let c = range.s.c; c <= 15; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c })
        if (!ws1[addr]) ws1[addr] = { v: '', t: 's' }
        ws1[addr].s = STYLE_TITLE
      }

      // Headers (fila índice 2)
      for (let c = 0; c <= 15; c++) {
        const addr = XLSX.utils.encode_cell({ r: 2, c })
        if (!ws1[addr]) ws1[addr] = { v: '', t: 's' }
        ws1[addr].s = STYLE_HEADER
      }

      // Filas de datos (a partir de índice 3)
      findings.forEach((f, idx) => {
        const rowIdx = 3 + idx
        const rowStyle = getSeverityRowStyle(f.severity)
        const rowStyleCenter = getSeverityRowStyleCenter(f.severity)
        const sevColors = getSeverityLabelColor(f.severity)

        for (let c = 0; c <= 15; c++) {
          const addr = XLSX.utils.encode_cell({ r: rowIdx, c })
          if (!ws1[addr]) continue

          // Columnas centradas: #, Tipo, Severidad, Estado, Impacto, Prioridad, Frecuencia, TipoNodo
          const centeredCols = [0, 1, 2, 3, 6, 7, 8, 14]
          if (centeredCols.includes(c)) {
            ws1[addr].s = { ...rowStyleCenter }
          } else {
            ws1[addr].s = { ...rowStyle }
          }

          // Columna de Severidad (col 2): color especial según severidad
          if (c === 2) {
            ws1[addr].s = {
              ...ws1[addr].s,
              fill: { fgColor: { rgb: sevColors.bg } },
              font: {
                bold: true,
                color: { rgb: sevColors.fg },
                sz: 10,
                name: 'Calibri',
              },
            }
          }
        }
      })

      // Anchos de columna
      ws1['!cols'] = [
        { wch: 5 },  // #
        { wch: 12 }, // Tipo
        { wch: 12 }, // Severidad
        { wch: 12 }, // Estado
        { wch: 50 }, // Descripción
        { wch: 50 }, // Recomendación
        { wch: 10 }, // Impacto
        { wch: 10 }, // Prioridad
        { wch: 10 }, // Frecuencia
        { wch: 15 }, // Emoción
        { wch: 15 }, // Sentimiento
        { wch: 30 }, // Comentario usuario
        { wch: 30 }, // Comentario experto
        { wch: 30 }, // Pantalla
        { wch: 12 }, // Tipo nodo
        { wch: 20 }, // Creado
      ]

      // Altura de filas
      ws1['!rows'] = [{ hpx: 30 }, { hpx: 5 }, { hpx: 28 }]
      findings.forEach(() => ws1['!rows']!.push({ hpx: 22 }))

      progress.value = 50

      // ============================================================
      // HOJA 2: RESUMEN
      // ============================================================
      const total = findings.length
      const bySeverity = groupCount(findings, 'severity')
      const byStatus = groupCount(findings, 'status')
      const byType = groupCount(findings, 'type')
      const byEmotion = groupCount(findings.filter((f) => f.emotionInferred), 'emotionInferred')
      const bySentiment = groupCount(findings.filter((f) => f.textualSentiment), 'textualSentiment')

      const summaryData: any[][] = [
        [`Resumen - ${projectName}`],
        [],
        ['Métrica', 'Valor'],
        ['Total de hallazgos', total],
        [],
        ['--- POR SEVERIDAD ---', ''],
        ...Object.entries(bySeverity).map(([k, v]) => [
          getHumanLabel('severity', k),
          v,
        ]),
        [],
        ['--- POR ESTADO ---', ''],
        ...Object.entries(byStatus).map(([k, v]) => [
          getHumanLabel('status', k),
          v,
        ]),
        [],
        ['--- POR TIPO ---', ''],
        ...Object.entries(byType).map(([k, v]) => [
          getHumanLabel('type', k),
          v,
        ]),
      ]

      if (Object.keys(byEmotion).length > 0) {
        summaryData.push([])
        summaryData.push(['--- POR EMOCIÓN ---', ''])
        Object.entries(byEmotion).forEach(([k, v]) => {
          const tpl = getEmotionTemplate(k)
          summaryData.push([`${tpl.emoji} ${tpl.labelEs}`, v])
        })
      }

      if (Object.keys(bySentiment).length > 0) {
        summaryData.push([])
        summaryData.push(['--- POR SENTIMIENTO ---', ''])
        Object.entries(bySentiment).forEach(([k, v]) => {
          summaryData.push([k, v])
        })
      }

      const ws2 = XLSX.utils.aoa_to_sheet(summaryData)

      // Merge del título
      if (!ws2['!merges']) ws2['!merges'] = []
      ws2['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } })

      // Estilo del título
      ws2['A1'] = { v: `Resumen - ${projectName}`, t: 's', s: STYLE_TITLE }

      // Estilos de headers de sección (filas con '---')
      const ws2Range = XLSX.utils.decode_range(ws2['!ref'] || 'A1:B1')
      for (let r = 0; r <= ws2Range.e.r; r++) {
        const cellA = XLSX.utils.encode_cell({ r, c: 0 })
        const cellB = XLSX.utils.encode_cell({ r, c: 1 })
        const valA = ws2[cellA]?.v?.toString() || ''

        // Fila de header de sección
        if (valA.startsWith('---')) {
          ws2[cellA].s = {
            ...STYLE_CELL,
            fill: { fgColor: { rgb: COLORS.headerBg } },
            font: { bold: true, color: { rgb: COLORS.headerFg }, sz: 11 },
          }
          if (ws2[cellB]) {
            ws2[cellB].s = {
              ...STYLE_CELL,
              fill: { fgColor: { rgb: COLORS.headerBg } },
            }
          }
        }
        // Fila 3 = headers "Métrica | Valor"
        else if (r === 2 && valA === 'Métrica') {
          ws2[cellA].s = STYLE_HEADER
          if (ws2[cellB]) ws2[cellB].s = STYLE_HEADER
        }
        // Filas de datos
        else if (valA && !valA.startsWith('---') && r > 2) {
          if (ws2[cellA]) ws2[cellA].s = STYLE_CELL
          if (ws2[cellB]) ws2[cellB].s = STYLE_CELL_CENTER
        }
      }

      ws2['!cols'] = [{ wch: 35 }, { wch: 15 }]

      progress.value = 75

      // ============================================================
      // HOJA 3: RECOMENDACIONES
      // ============================================================
      const recommendations = findings.filter((f) => f.recommendation)

      const recHeaders = ['#', 'Prioridad', 'Severidad', 'Hallazgo', 'Recomendación']

      const recData: any[][] = [
        [`Recomendaciones - ${projectName}`],
        [],
        recHeaders,
      ]

      recommendations.forEach((f, idx) => {
        recData.push([
          idx + 1,
          getHumanLabel('priority', f.priority),
          getHumanLabel('severity', f.severity),
          f.description || '',
          f.recommendation || '',
        ])
      })

      if (recommendations.length === 0) {
        recData.push(['—', '—', '—', 'Sin recomendaciones', '—'])
      }

      const ws3 = XLSX.utils.aoa_to_sheet(recData)

      // Merge título
      if (!ws3['!merges']) ws3['!merges'] = []
      ws3['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } })

      // Estilo título
      for (let c = 0; c <= 4; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c })
        if (!ws3[addr]) ws3[addr] = { v: '', t: 's' }
        ws3[addr].s = STYLE_TITLE
      }

      // Headers
      for (let c = 0; c <= 4; c++) {
        const addr = XLSX.utils.encode_cell({ r: 2, c })
        if (!ws3[addr]) ws3[addr] = { v: '', t: 's' }
        ws3[addr].s = STYLE_HEADER
      }

      // Filas de datos
      const ws3Range = XLSX.utils.decode_range(ws3['!ref'] || 'A1:E1')
      for (let r = 3; r <= ws3Range.e.r; r++) {
        for (let c = 0; c <= 4; c++) {
          const addr = XLSX.utils.encode_cell({ r, c })
          if (!ws3[addr]) continue
          ws3[addr].s = [0, 1, 2].includes(c) ? STYLE_CELL_CENTER : STYLE_CELL
        }
      }

      ws3['!cols'] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 12 },
        { wch: 50 },
        { wch: 50 },
      ]

      progress.value = 95

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