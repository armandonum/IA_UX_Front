<!-- components/experto/SessionReportGenerator.vue -->
<template>
  <div>
    <!-- Botón de generación de reporte -->
    <q-btn
      color="primary"
      icon="picture_as_pdf"
      :label="loading ? 'Generando...' : 'Generar Reporte PDF'"
      :loading="loading"
      @click="generateReport"
      class="q-mr-sm"
    />

    <!-- Diálogo de configuración -->
    <q-dialog v-model="showConfig" persistent max-width="600px">
      <q-card>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">📄 Configurar Reporte</div>
          <div class="text-subtitle2">Personaliza el contenido del informe</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input v-model="reportConfig.title" label="Título del Reporte" filled dense />

          <div class="text-subtitle1 q-mt-sm">Secciones a incluir:</div>
          <q-toggle v-model="reportConfig.includeSummary" label="Resumen Ejecutivo" />
          <q-toggle v-model="reportConfig.includeFindings" label="Hallazgos Detallados" />
          <q-toggle v-model="reportConfig.includeEmotions" label="Análisis Emocional" />
          <q-toggle v-model="reportConfig.includeSentiments" label="Análisis de Sentimientos" />
          <q-toggle v-model="reportConfig.includeEvents" label="Línea de Tiempo" />
          <q-toggle v-model="reportConfig.includeRecommendations" label="Recomendaciones" />

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-select v-model="reportConfig.language" :options="languageOptions" label="Idioma" filled dense emit-value map-options />
            </div>
            <div class="col-6">
              <q-select v-model="reportConfig.pageSize" :options="pageSizeOptions" label="Tamaño de página" filled dense emit-value map-options />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup @click="showConfig = false" />
          <q-btn color="primary" label="Generar Reporte" :loading="generating" @click="generateWithConfig" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Contenido del reporte (oculto, solo para renderizar HTML) -->
    <div ref="reportContentRef" style="position: absolute; left: -9999px; top: 0; width: 794px; background: white; padding: 40px; font-family: Arial, sans-serif;">
      <div v-html="reportHTML" />
    </div>

    <!-- Previsualización -->
    <q-dialog v-model="showPreview" max-width="90%" style="height: 90vh;">
      <q-card style="width: 100%; height: 100%;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">📄 Previsualización del Reporte</div>
          <div class="text-subtitle2">Vista previa del informe generado</div>
        </q-card-section>

        <q-card-section style="height: calc(100% - 140px); overflow: auto; background: #f1f5f9;">
          <div v-html="reportHTML" class="report-preview" style="max-width: 794px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-height: 500px;"></div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" v-close-popup @click="showPreview = false" />
          <q-btn color="primary" icon="download" label="Descargar PDF" @click="downloadPDF" :loading="downloading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ============================================================
// PROPS CON VALORES POR DEFECTO
// ============================================================
const props = defineProps<{
  session?: any
  findings?: any[]
  events?: any[]
  emotionReadings?: any[]
  sentiments?: any[]
  comments?: any[]
  expertComments?: any[]
  taskName?: string
  projectName?: string
  evaluationId?: string
}>()

const $q = useQuasar()
const loading = ref(false)
const generating = ref(false)
const downloading = ref(false)
const showConfig = ref(false)
const showPreview = ref(false)
const reportContentRef = ref<HTMLDivElement | null>(null)
const reportHTML = ref('')

// ============================================================
// CONFIGURACIÓN
// ============================================================
const reportConfig = ref({
  title: `Informe de Evaluación - ${new Date().toLocaleDateString()}`,
  includeSummary: true,
  includeFindings: true,
  includeEmotions: true,
  includeSentiments: true,
  includeEvents: true,
  includeRecommendations: true,
  language: 'es',
  pageSize: 'a4',
})

const languageOptions = [
  { label: 'Español', value: 'es' },
  { label: 'English', value: 'en' },
]

const pageSizeOptions = [
  { label: 'A4', value: 'a4' },
  { label: 'Letter', value: 'letter' },
  { label: 'Legal', value: 'legal' },
]

// ============================================================
// TRADUCCIONES Y HELPERS
// ============================================================
const t = (key: string) => {
  const translations: Record<string, Record<string, string>> = {
    es: {
      title: 'Título',
      summary: 'Resumen Ejecutivo',
      findings: 'Hallazgos',
      emotions: 'Análisis Emocional',
      sentiments: 'Análisis de Sentimientos',
      events: 'Línea de Tiempo',
      recommendations: 'Recomendaciones',
      totalFindings: 'Total de Hallazgos',
      criticalFindings: 'Hallazgos Críticos',
      resolvedFindings: 'Hallazgos Resueltos',
      severity: 'Severidad',
      type: 'Tipo',
      status: 'Estado',
      description: 'Descripción',
      recommendation: 'Recomendación',
      emotion: 'Emoción',
      sentiment: 'Sentimiento',
      time: 'Tiempo',
      event: 'Evento',
      generated: 'Generado el',
      page: 'Página',
      of: 'de',
    },
    en: {
      title: 'Title',
      summary: 'Executive Summary',
      findings: 'Findings',
      emotions: 'Emotional Analysis',
      sentiments: 'Sentiment Analysis',
      events: 'Timeline',
      recommendations: 'Recommendations',
      totalFindings: 'Total Findings',
      criticalFindings: 'Critical Findings',
      resolvedFindings: 'Resolved Findings',
      severity: 'Severity',
      type: 'Type',
      status: 'Status',
      description: 'Description',
      recommendation: 'Recommendation',
      emotion: 'Emotion',
      sentiment: 'Sentiment',
      time: 'Time',
      event: 'Event',
      generated: 'Generated on',
      page: 'Page',
      of: 'of',
    },
  }
  return translations[reportConfig.value.language]?.[key] || key
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
  }
  return labels[severity] || severity
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    not_resolved: 'No Resuelto',
    kept: 'Conservado',
  }
  return labels[status] || status
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    problem: 'Problema',
    difficulty: 'Dificultad',
    accessibility: 'Accesibilidad',
    friction: 'Fricción',
    positive: 'Positivo',
    opportunity: 'Oportunidad',
  }
  return labels[type] || type
}

const getEmotionLabel = (emotion: string) => {
  const labels: Record<string, string> = {
    happy: 'Felicidad 😊',
    sad: 'Tristeza 😔',
    angry: 'Enojo 😠',
    surprise: 'Sorpresa 😮',
    disgust: 'Asco 😖',
    fear: 'Miedo 😨',
    neutral: 'Neutral 😐',
    frustration: 'Frustración 😤',
    confusion: 'Confusión 😕',
  }
  return labels[emotion] || emotion || '—'
}

const formatTime = (ms: number) => {
  if (!ms || ms < 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#3b82f6',
  }
  return colors[severity] || '#64748b'
}

// ============================================================
// GENERAR HTML DEL REPORTE (CON VALIDACIONES)
// Cada sección grande queda envuelta en un div.pdf-section para
// que el generador de PDF pueda paginar sin cortar contenido.
// ============================================================
const generateReportHTML = () => {
  // 🔥 Validar y asegurar que los arrays existan
  const findings = Array.isArray(props.findings) ? props.findings : []
  const events = Array.isArray(props.events) ? props.events : []
  const emotionReadings = Array.isArray(props.emotionReadings) ? props.emotionReadings : []
  const sentiments = Array.isArray(props.sentiments) ? props.sentiments : []
  const comments = Array.isArray(props.comments) ? props.comments : []
  const expertComments = Array.isArray(props.expertComments) ? props.expertComments : []

  const session = props.session || {}

  const totalFindings = findings.length
  const criticalFindings = findings.filter(f => f?.severity === 'critical').length
  const resolvedFindings = findings.filter(f => f?.status === 'resolved').length
  const activeFindings = findings.filter(f => f?.status === 'pending' || f?.status === 'in_progress').length
  const durationMs = session?.durationSeconds ? session.durationSeconds * 1000 : 0

  let html = `
    <div class="pdf-section" style="font-family: Arial, sans-serif; color: #1e293b;">
      <!-- Título -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e3a8a; font-size: 24px; margin-bottom: 5px;">${reportConfig.value.title}</h1>
        <p style="color: #475569; font-size: 14px; margin: 0;">${props.projectName || 'Proyecto'} - ${props.taskName || 'Sesión de Evaluación'}</p>
        <p style="color: #64748b; font-size: 12px; margin: 5px 0;">ID: ${session?.sessionId || 'N/A'} | Duración: ${formatTime(durationMs)}</p>
        <hr style="border: 1px solid #e2e8f0; margin: 15px 0;">
      </div>
    </div>
  `

  // ============================================================
  // 1. RESUMEN EJECUTIVO
  // ============================================================
  if (reportConfig.value.includeSummary) {
    html += `
      <div class="pdf-section">
      <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">📊 ${t('summary')}</h2>
      <div style="display: flex; gap: 10px; margin: 15px 0; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 100px; background: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 28px; font-weight: bold; color: #1e3a8a;">${totalFindings}</div>
          <div style="font-size: 12px; color: #64748b;">${t('totalFindings')}</div>
        </div>
        <div style="flex: 1; min-width: 100px; background: #fef2f2; padding: 15px; text-align: center; border-radius: 8px; border: 1px solid #fecaca;">
          <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${criticalFindings}</div>
          <div style="font-size: 12px; color: #64748b;">${t('criticalFindings')}</div>
        </div>
        <div style="flex: 1; min-width: 100px; background: #f0fdf4; padding: 15px; text-align: center; border-radius: 8px; border: 1px solid #bbf7d0;">
          <div style="font-size: 28px; font-weight: bold; color: #16a34a;">${resolvedFindings}</div>
          <div style="font-size: 12px; color: #64748b;">${t('resolvedFindings')}</div>
        </div>
        <div style="flex: 1; min-width: 100px; background: #fefce8; padding: 15px; text-align: center; border-radius: 8px; border: 1px solid #fde68a;">
          <div style="font-size: 28px; font-weight: bold; color: #ca8a04;">${activeFindings}</div>
          <div style="font-size: 12px; color: #64748b;">Activos</div>
        </div>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #1e293b;">
        En la sesión de evaluación se identificaron un total de ${totalFindings} hallazgos,
        de los cuales ${criticalFindings} son de severidad crítica. Actualmente,
        ${resolvedFindings} hallazgos han sido resueltos y ${activeFindings} se encuentran
        en estado activo.
        ${findings.length > 0 && findings[0]?.description ? `El hallazgo más crítico identificado fue: "${findings.find(f => f.severity === 'critical')?.description || findings[0]?.description || 'N/A'}"` : ''}
      </p>
      <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
      </div>
    `
  }

  // ============================================================
  // 2. HALLAZGOS (se muestran TODOS, sin límite, cada fila es su
  // propia sub-sección para que la paginación no la corte a la mitad)
  // ============================================================
  if (reportConfig.value.includeFindings && findings.length > 0) {
    html += `
      <div class="pdf-section">
      <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">📋 ${t('findings')}</h2>
      </div>
      <div class="pdf-section">
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 10px 0;">
        <thead>
          <tr style="background: #1e3a8a; color: white;">
            <th style="padding: 8px; text-align: center;">#</th>
            <th style="padding: 8px; text-align: center;">${t('type')}</th>
            <th style="padding: 8px; text-align: left;">${t('description')}</th>
            <th style="padding: 8px; text-align: center;">${t('severity')}</th>
            <th style="padding: 8px; text-align: center;">${t('status')}</th>
            <th style="padding: 8px; text-align: center;">${t('emotion')}</th>
          </tr>
        </thead>
        <tbody>
    `

    findings.forEach((finding, index) => {
      const color = getSeverityColor(finding?.severity || 'medium')
      html += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px; text-align: center;">${index + 1}</td>
          <td style="padding: 8px; text-align: center;">${getTypeLabel(finding?.type)}</td>
          <td style="padding: 8px;">${finding?.description || '—'}</td>
          <td style="padding: 8px; text-align: center;">
            <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${getSeverityLabel(finding?.severity)}</span>
          </td>
          <td style="padding: 8px; text-align: center;">${getStatusLabel(finding?.status)}</td>
          <td style="padding: 8px; text-align: center;">${getEmotionLabel(finding?.emotionInferred)}</td>
        </tr>
      `
    })

    html += `
        </tbody>
      </table>
      <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
      </div>
    `
  } else if (reportConfig.value.includeFindings) {
    html += `
      <div class="pdf-section">
      <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">📋 ${t('findings')}</h2>
      <p style="font-size: 14px; color: #64748b;">No se encontraron hallazgos registrados en esta sesión.</p>
      <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
      </div>
    `
  }

  // ============================================================
  // 3. ANÁLISIS EMOCIONAL (se muestran TODAS las lecturas)
  // ============================================================
  if (reportConfig.value.includeEmotions && emotionReadings.length > 0) {
    html += `
      <div class="pdf-section">
      <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">😊 ${t('emotions')}</h2>
    `

    const emotionCounts: Record<string, number> = {}
    emotionReadings.forEach(em => {
      const label = em?.dominantEmotion || 'unknown'
      emotionCounts[label] = (emotionCounts[label] || 0) + 1
    })

    const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])

    html += `<div style="display: flex; gap: 10px; margin: 10px 0; flex-wrap: wrap;">`
    sortedEmotions.forEach(([emotion, count]) => {
      const pct = Math.round((count / emotionReadings.length) * 100)
      html += `
        <div style="flex: 1; min-width: 80px; background: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 28px;">${emotion === 'happy' ? '😊' : emotion === 'sad' ? '😔' : emotion === 'angry' ? '😠' : emotion === 'surprise' ? '😮' : emotion === 'neutral' ? '😐' : emotion === 'frustration' ? '😤' : '😶'}</div>
          <div style="font-size: 20px; font-weight: bold; color: #1e3a8a;">${count}</div>
          <div style="font-size: 12px; color: #64748b;">${getEmotionLabel(emotion)} (${pct}%)</div>
        </div>
      `
    })
    html += `</div>
      </div>
    `

    html += `
      <div class="pdf-section">
      <h3 style="color: #1e40af; font-size: 14px; margin-top: 15px;">📈 Línea de Tiempo Emocional</h3>
    `
    emotionReadings.forEach(em => {
      html += `<div style="background: #f8fafc; padding: 6px 12px; border-radius: 6px; font-size: 12px; margin: 3px 0;">${formatTime(em?.elapsedMsTotal || 0)} → ${getEmotionLabel(em?.dominantEmotion || '—')}</div>`
    })
    html += `<hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
      </div>
    `
  } else if (reportConfig.value.includeEmotions) {
    html += `
      <div class="pdf-section">
      <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">😊 ${t('emotions')}</h2>
      <p style="font-size: 14px; color: #64748b;">No hay lecturas de emociones registradas en esta sesión.</p>
      <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
      </div>
    `
  }

  // ============================================================
  // 4. ANÁLISIS DE SENTIMIENTOS (se muestran TODOS los comentarios)
  // ============================================================
  if (reportConfig.value.includeSentiments && sentiments.length > 0) {
    html += `
      <div class="pdf-section">
      <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">🧠 ${t('sentiments')}</h2>
    `

    const sentimentCounts: Record<string, number> = {}
    sentiments.forEach(s => {
      const label = s?.uxLabel || 'neutral'
      sentimentCounts[label] = (sentimentCounts[label] || 0) + 1
    })

    const sortedSentiments = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])

    if (sortedSentiments.length > 0) {
      html += `<div style="display: flex; gap: 10px; margin: 10px 0; flex-wrap: wrap;">`
      sortedSentiments.forEach(([sentiment, count]) => {
        const pct = Math.round((count / sentiments.length) * 100)
        html += `
          <div style="flex: 1; min-width: 80px; background: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 20px; font-weight: bold; color: #1e3a8a;">${count}</div>
            <div style="font-size: 12px; color: #64748b;">${sentiment} (${pct}%)</div>
          </div>
        `
      })
      html += `</div>`
    }
    html += `</div>`

    const relevantComments = sentiments.filter(s => s?.uxLabel && s?.uxLabel !== 'neutral')

    if (relevantComments.length > 0) {
      html += `
        <div class="pdf-section">
        <h3 style="color: #1e40af; font-size: 14px; margin-top: 15px;">💬 Comentarios Relevantes</h3>
        </div>
      `
      relevantComments.forEach(s => {
        html += `
          <div class="pdf-section" style="background: #f8fafc; padding: 10px 15px; border-radius: 8px; margin: 5px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-style: italic; font-size: 13px;">"${s?.text || 'Sin texto'}"</p>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b;">— ${s?.uxLabel || 'N/A'} (${Math.round((s?.confidence || 0) * 100)}% confianza)</p>
          </div>
        `
      })
    }

    html += `<div class="pdf-section"><hr style="border: 1px solid #e2e8f0; margin: 20px 0;"></div>`
  } else if (reportConfig.value.includeSentiments) {
    html += `
      <div class="pdf-section">
      <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">🧠 ${t('sentiments')}</h2>
      <p style="font-size: 14px; color: #64748b;">No hay análisis de sentimientos registrados en esta sesión.</p>
      <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
      </div>
    `
  }

  // ============================================================
  // 5. EVENTOS Y LÍNEA DE TIEMPO (se muestran TODOS los eventos)
  // ============================================================
  if (reportConfig.value.includeEvents && events.length > 0) {
    html += `
      <div class="pdf-section">
      <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">⏱️ ${t('events')}</h2>
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <h3 style="color: #1e40af; font-size: 14px;">Tipos de Eventos</h3>
    `

    const eventTypes: Record<string, number> = {}
    events.forEach(e => {
      const type = e?.event_type || 'unknown'
      eventTypes[type] = (eventTypes[type] || 0) + 1
    })

    const sortedEvents = Object.entries(eventTypes).sort((a, b) => b[1] - a[1])

    if (sortedEvents.length > 0) {
      sortedEvents.forEach(([type, count]) => {
        html += `<div style="font-size: 12px; color: #64748b;">${type}: ${count} veces</div>`
      })
    } else {
      html += `<div style="font-size: 12px; color: #64748b;">No hay tipos de eventos registrados</div>`
    }

    html += `
        </div>
        <div style="flex: 1; min-width: 150px; text-align: center; background: #f8fafc; padding: 15px; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #1e3a8a;">${events.length}</div>
          <div style="font-size: 12px; color: #64748b;">eventos registrados</div>
        </div>
      </div>
      </div>
    `

    html += `
      <div class="pdf-section">
      <h3 style="color: #1e40af; font-size: 14px; margin-top: 15px;">📋 Línea de Tiempo de Eventos</h3>
    `
    events.forEach(e => {
      const nodeInfo = e?.node_id ? `[${e.node_id}]` : ''
      html += `<div style="background: #f8fafc; padding: 6px 12px; border-radius: 6px; font-size: 12px; margin: 3px 0;">${formatTime(e?.elapsed_ms_total || 0)} → ${e?.event_type || 'evento'} ${nodeInfo}</div>`
    })
    html += `<hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
      </div>
    `
  } else if (reportConfig.value.includeEvents) {
    html += `
      <div class="pdf-section">
      <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">⏱️ ${t('events')}</h2>
      <p style="font-size: 14px; color: #64748b;">No hay eventos registrados en esta sesión.</p>
      <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
      </div>
    `
  }

  // ============================================================
  // 6. RECOMENDACIONES (se muestran TODAS)
  // ============================================================
  if (reportConfig.value.includeRecommendations) {
    const recommendations = findings
      .filter(f => f?.recommendation)
      .map(f => f.recommendation)

    if (recommendations.length > 0) {
      html += `
        <div class="pdf-section">
        <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">💡 ${t('recommendations')}</h2>
        <ul style="padding-left: 20px; font-size: 13px; line-height: 1.8;">
      `

      recommendations.forEach(rec => {
        html += `<li>${rec}</li>`
      })

      html += `</ul>
        </div>
      `
    } else {
      html += `
        <div class="pdf-section">
        <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px;">💡 ${t('recommendations')}</h2>
        <p style="font-size: 14px; color: #64748b;">No hay recomendaciones registradas en esta sesión.</p>
        </div>
      `
    }
  }

  html += `
    <div class="pdf-section" style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} - ${t('generated')} ${new Date().toLocaleString()}
    </div>
  `

  return html
}

// ============================================================
// GENERAR Y DESCARGAR PDF
// ============================================================
const generateReport = () => {
  showConfig.value = true
}

const generateWithConfig = async () => {
  generating.value = true
  try {
    reportHTML.value = generateReportHTML()
    showPreview.value = true
    showConfig.value = false
  } catch (error) {
    console.error('Error generando reporte:', error)
    $q.notify({ type: 'negative', message: 'Error al generar el reporte' })
  } finally {
    generating.value = false
  }
}

// ------------------------------------------------------------
// Mapa de tamaños de página en puntos (jsPDF unit: 'pt')
// ------------------------------------------------------------
const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
}

const downloadPDF = async () => {
  downloading.value = true
  try {
    await nextTick()

    const container = document.querySelector('.report-preview') as HTMLElement
    if (!container) {
      throw new Error('No se encontró el contenido del reporte')
    }

    // Cada bloque .pdf-section se captura y se coloca como una unidad
    // indivisible en el PDF: si no cabe en el espacio restante de la
    // página actual, se pasa a una hoja nueva en vez de cortarlo.
    const sections = Array.from(container.querySelectorAll('.pdf-section')) as HTMLElement[]
    const blocks = sections.length > 0 ? sections : [container]

    const pageFormat = PAGE_SIZES[reportConfig.value.pageSize] || PAGE_SIZES.a4
    const marginPt = 24
    const contentWidthPt = pageFormat.width - marginPt * 2
    const maxContentHeightPt = pageFormat.height - marginPt * 2

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [pageFormat.width, pageFormat.height],
    })

    let cursorY = marginPt
    let isFirstBlockOnPage = true

    for (const block of blocks) {
      if (!block || block.offsetHeight === 0) continue

      const canvas = await html2canvas(block, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidthPt = contentWidthPt
      const imgHeightPt = (canvas.height * imgWidthPt) / canvas.width

      if (imgHeightPt <= maxContentHeightPt) {
        // El bloque completo cabe en una página: si no hay espacio
        // suficiente en la página actual, saltamos a una nueva hoja
        // para no cortarlo por la mitad.
        if (!isFirstBlockOnPage && cursorY + imgHeightPt > marginPt + maxContentHeightPt) {
          pdf.addPage()
          cursorY = marginPt
          isFirstBlockOnPage = true
        }

        pdf.addImage(imgData, 'PNG', marginPt, cursorY, imgWidthPt, imgHeightPt)
        cursorY += imgHeightPt
        isFirstBlockOnPage = false
      } else {
        // Bloque más alto que una página completa (ej. una tabla muy
        // larga): en este caso sí se divide en varias hojas, pero
        // siempre empezando en una página nueva y limpia.
        if (!isFirstBlockOnPage) {
          pdf.addPage()
          cursorY = marginPt
        }

        let renderedHeightPt = 0
        const canvasPageHeightPx = (maxContentHeightPt * canvas.width) / imgWidthPt

        while (renderedHeightPt < imgHeightPt) {
          if (renderedHeightPt > 0) {
            pdf.addPage()
          }
          const remainingPx = canvas.height - (renderedHeightPt * canvas.width) / imgWidthPt
          const slicePx = Math.min(canvasPageHeightPx, remainingPx)

          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = slicePx
          const ctx = pageCanvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, (renderedHeightPt * canvas.width) / imgWidthPt,
              canvas.width, slicePx,
              0, 0,
              canvas.width, slicePx
            )
          }
          const sliceImgData = pageCanvas.toDataURL('image/png')
          const sliceHeightPt = (slicePx * imgWidthPt) / canvas.width
          pdf.addImage(sliceImgData, 'PNG', marginPt, marginPt, imgWidthPt, sliceHeightPt)

          renderedHeightPt += sliceHeightPt
        }

        cursorY = marginPt + ((imgHeightPt) % maxContentHeightPt)
        isFirstBlockOnPage = false
      }
    }

    pdf.save(`Reporte_Sesion_${props.session?.sessionId || 'sesion'}.pdf`)

    $q.notify({
      type: 'positive',
      message: '📄 Reporte descargado exitosamente'
    })

    showPreview.value = false
  } catch (error) {
    console.error('Error descargando PDF:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al descargar el reporte'
    })
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.report-preview {
  font-family: Arial, sans-serif;
  color: #1e293b;
}

.report-preview h1 {
  color: #1e3a8a;
}

.report-preview hr {
  border: 1px solid #e2e8f0;
}
</style>