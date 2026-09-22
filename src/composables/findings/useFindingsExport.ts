// composables/useFindingsExport.ts
import { ref } from "vue";
import { useQuasar } from "quasar";
import * as XLSX from "xlsx";
import { useFigmaNodes } from "../useFigmaNodes";

export const useFindingsExport = () => {
  const $q = useQuasar();
  const isExporting = ref(false);
  const progress = ref(0);
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
  // ✅ Usar el composable de FigmaNodes
  const { getNodeName, getNodeType, loadFigmaNodes, nodeCache } =
    useFigmaNodes();

  // Traducción de emociones
  const emotionTranslations: Record<string, string> = {
    happy: "Felicidad 😊",
    sad: "Tristeza 😔",
    angry: "Enojo 😠",
    surprise: "Sorpresa 😮",
    disgust: "Asco 😖",
    fear: "Miedo 😨",
    neutral: "Neutral 😐",
    frustration: "Frustración 😤",
    confusion: "Confusión 😕",
    disappointment: "Decepción 😞",
    anxiety: "Ansiedad 😰",
    joy: "Alegría 😊",
    love: "Amor ❤️",
    shame: "Vergüenza 😳",
    pride: "Orgullo 😌",
    relief: "Alivio 😮‍💨",
    satisfaction: "Satisfacción 😊",
    dissatisfaction: "Insatisfacción 😒",
    enthusiasm: "Entusiasmo 🤩",
    boredom: "Aburrimiento 😴",
    interest: "Interés 🤔",
    trust: "Confianza 🤝",
    anticipation: "Anticipación 🤗",
    rage: "Ira 🤬",
    terror: "Terror 😱",
    sadness: "Tristeza 😢",
  };

  // Traducción de sentimientos
  const sentimentTranslations: Record<string, string> = {
    positive: "Positivo ✅",
    negative: "Negativo ❌",
    neutral: "Neutral ⚪",
    frustration: "Frustración 😤",
    difficulty: "Dificultad 😓",
    confusion: "Confusión 😕",
    satisfaction: "Satisfacción 😊",
    dissatisfaction: "Insatisfacción 😒",
    surprise: "Sorpresa 😮",
    annoyance: "Molestia 😑",
    happiness: "Felicidad 😊",
    sadness: "Tristeza 😢",
    anxiety: "Ansiedad 😰",
    anger: "Enojo 😠",
    fear: "Miedo 😨",
    enjoyment: "Disfrute 😄",
    distress: "Angustia 😣",
    interest: "Interés 🧐",
    boredom: "Aburrimiento 😴",
  };

  // Traducción de tipos de hallazgo
  const typeTranslations: Record<string, string> = {
    problem: "Problema 🐛",
    difficulty: "Dificultad 😓",
    accessibility: "Accesibilidad ♿",
    friction: "Fricción ⚡",
    positive: "Positivo ✅",
    opportunity: "Oportunidad 💡",
    usability: "Usabilidad 🎯",
    emotional: "Emocional 😊",
    sentiment: "Sentimiento 🧠",
    expert: "Experto 🔍",
    mixed: "Mixto 🔄",
  };

  // Traducción de severidad
  const severityTranslations: Record<string, string> = {
    critical: "Crítico 🚨",
    high: "Alto ⚠️",
    medium: "Medio 📊",
    low: "Bajo 📉",
    info: "Informativo ℹ️",
  };

  // Traducción de estado
  const statusTranslations: Record<string, string> = {
    pending: "Pendiente ⏳",
    reviewed: "Revisado ✅",
    approved: "Aprobado ✓",
    rejected: "Rechazado ✗",
    in_progress: "En Progreso 🔄",
    resolved: "Resuelto ✔️",
    not_resolved: "No Resuelto ❌",
    kept: "Conservado 📌",
  };

  // Traducción de impacto
  const impactTranslations: Record<string, string> = {
    high: "Alto 🔴",
    medium: "Medio 🟡",
    low: "Bajo 🟢",
  };

  // Traducción de prioridad
  const priorityTranslations: Record<string, string> = {
    high: "Alta 🔴",
    medium: "Media 🟡",
    low: "Baja 🟢",
  };

  function translateEmotion(emotion: string | null | undefined): string {
    if (!emotion) return "—";
    return emotionTranslations[emotion.toLowerCase()] || emotion;
  }

  function translateSentiment(sentiment: string | null | undefined): string {
    if (!sentiment) return "—";
    return sentimentTranslations[sentiment.toLowerCase()] || sentiment;
  }

  function translateType(type: string | null | undefined): string {
    if (!type) return "—";
    return typeTranslations[type.toLowerCase()] || type;
  }

  function translateSeverity(severity: string | null | undefined): string {
    if (!severity) return "—";
    return severityTranslations[severity.toLowerCase()] || severity;
  }

  function translateStatus(status: string | null | undefined): string {
    if (!status) return "—";
    return statusTranslations[status.toLowerCase()] || status;
  }

  function translateImpact(impact: string | null | undefined): string {
    if (!impact) return "—";
    return impactTranslations[impact.toLowerCase()] || impact;
  }

  function translatePriority(priority: string | null | undefined): string {
    if (!priority) return "—";
    return priorityTranslations[priority.toLowerCase()] || priority;
  }

  /**
   * Obtiene el display_name del usuario desde el comentario del usuario
   */
  async function getUserDisplayName(
    userCommentId: string | null,
  ): Promise<string> {
    if (!userCommentId) return "—";

    try {
      // Obtener el comentario del usuario
      const response = await fetch(
        `${BASE_URL}/session-comments/${userCommentId}`,
      );
      if (!response.ok) return "—";

      const comment = await response.json();
      if (!comment.authorId) return "—";

      // Obtener el usuario
      const userResponse = await fetch(
        `${BASE_URL}/users/${comment.authorId}`,
      );
      if (!userResponse.ok) return "—";

      const user = await userResponse.json();
      return user.display_name || user.email || "—";
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      return "—";
    }
  }

  /**
   * Enriquecer hallazgos con información de Figma y usuarios
   */
  async function enrichFindings(
    findings: any[], 
    fileKey: string,
    nodeCache?: Map<string, { name: string; type: string; componentId?: string }>,
    getNodeName?: (id: string) => string,
    getNodeType?: (id: string) => string
  ): Promise<any[]> {
    // ✅ Si tenemos nodeCache y funciones, usarlas
    const hasNodeData = nodeCache && nodeCache.size > 0 && getNodeName && getNodeType
    
    if (!hasNodeData) {
      console.warn('⚠️ No hay datos de nodos disponibles para la exportación')
    }

    const enriched = []
    
    for (const finding of findings) {
      // ✅ Usar los datos pasados si están disponibles
      let nodeName = 'N/A'
      let nodeType = 'N/A'
      let screenName = 'N/A'
      
      if (finding.nodeId && hasNodeData) {
        // ✅ Usar las funciones pasadas desde SessionDetailView
        nodeName = getNodeName!(finding.nodeId)
        nodeType = getNodeType!(finding.nodeId)
        
        // ✅ Buscar pantalla (Frame) que contiene el nodo
        for (const [id, info] of nodeCache!) {
          if (finding.nodeId !== id && finding.nodeId.includes(id) && info.type === 'FRAME') {
            screenName = info.name
            break
          }
        }
        if (screenName === 'N/A') {
          screenName = nodeName
        }
      } else if (finding.nodeId && !hasNodeData) {
        // ✅ Fallback: usar el nodeId como nombre si no hay datos
        nodeName = finding.nodeId
        nodeType = 'N/A'
        screenName = finding.nodeId
      }
      
      // ✅ Obtener usuario si existe userCommentId
      let userDisplayName = '—'
      if (finding.userCommentId) {
        userDisplayName = await getUserDisplayName(finding.userCommentId)
      }

      enriched.push({
        // Datos básicos
        'ID': finding.findingId || finding._tempId || 'N/A',
        'Tipo': translateType(finding.type),
        'Descripción': finding.description || '—',
        'Severidad': translateSeverity(finding.severity),
        'Impacto': translateImpact(finding.impact),
        'Prioridad': translatePriority(finding.priority),
        'Estado': translateStatus(finding.status),
        'Frecuencia': finding.frequency || 1,
        'Ocurrencias': finding.occurrences || 1,
        
        // ✅ Datos de Figma (ahora usando los datos pasados)
        'Node ID': finding.nodeId || 'N/A',
        'Nombre del Nodo': nodeName,
        'Pantalla': screenName,
        'Tipo de Nodo': nodeType,
        'Versión': finding.version || '1.0',
        
        // Datos emocionales
        'Emoción Inferida': translateEmotion(finding.emotionInferred),
        'Sentimiento Textual': translateSentiment(finding.textualSentiment),
        
        // Comentarios
        'Comentario del Usuario': finding.userComment || '—',
        'Usuario': userDisplayName,
        'Comentario del Experto': finding.expertComment || '—',
        
        // Recomendación
        'Recomendación': finding.recommendation || '—',
        
        // Metadatos
        'Fecha de Creación': finding.createdAt ? new Date(finding.createdAt).toLocaleString('es-ES') : '—',
        'Fecha de Actualización': finding.updatedAt ? new Date(finding.updatedAt).toLocaleString('es-ES') : '—',
      })
    }
    
    return enriched
  }

  /**
   * Exporta hallazgos a Excel
   */

  async function exportFindingsToExcel(
    findings: any[],
    fileKey: string,
    projectName: string = 'Proyecto',
    sessionId: string = '',
    nodeCache?: Map<string, { name: string; type: string; componentId?: string }>,
    getNodeName?: (id: string) => string,
    getNodeType?: (id: string) => string
  ) {
isExporting.value = true
    progress.value = 0
    
    try {
      // Enriquecer hallazgos con los datos pasados
      progress.value = 20
      const enrichedFindings = await enrichFindings(findings, fileKey, nodeCache, getNodeName, getNodeType)
      progress.value = 80

      // Crear workbook
      const wb = XLSX.utils.book_new();

      // Hoja principal
      const ws = XLSX.utils.json_to_sheet(enrichedFindings);

      // Ajustar anchos de columna
      const colWidths = [
        { wch: 38 }, // ID
        { wch: 20 }, // Tipo
        { wch: 50 }, // Descripción
        { wch: 15 }, // Severidad
        { wch: 15 }, // Impacto
        { wch: 15 }, // Prioridad
        { wch: 18 }, // Estado
        { wch: 12 }, // Frecuencia
        { wch: 12 }, // Ocurrencias
        { wch: 20 }, // Node ID
        { wch: 30 }, // Nombre del Nodo
        { wch: 35 }, // Pantalla
        { wch: 18 }, // Tipo de Nodo
        { wch: 12 }, // Versión
        { wch: 22 }, // Emoción Inferida
        { wch: 22 }, // Sentimiento Textual
        { wch: 45 }, // Comentario del Usuario
        { wch: 25 }, // Usuario
        { wch: 45 }, // Comentario del Experto
        { wch: 50 }, // Recomendación
        { wch: 22 }, // Fecha de Creación
        { wch: 22 }, // Fecha de Actualización
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Hallazgos");

      // Hoja de resumen
      const summaryData = [
        ["RESUMEN DE HALLAZGOS"],
        [""],
        ["Proyecto", projectName],
        ["Sesión", sessionId],
        ["Fecha de Exportación", new Date().toLocaleString("es-ES")],
        ["Total de Hallazgos", findings.length],
        [""],
        ["Distribución por Tipo"],
        ...Object.entries(
          findings.reduce((acc: any, f: any) => {
            const type = translateType(f.type);
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {}),
        ).map(([type, count]) => [type, count]),
        [""],
        ["Distribución por Severidad"],
        ...Object.entries(
          findings.reduce((acc: any, f: any) => {
            const severity = translateSeverity(f.severity);
            acc[severity] = (acc[severity] || 0) + 1;
            return acc;
          }, {}),
        ).map(([severity, count]) => [severity, count]),
        [""],
        ["Distribución por Estado"],
        ...Object.entries(
          findings.reduce((acc: any, f: any) => {
            const status = translateStatus(f.status);
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {}),
        ).map(([status, count]) => [status, count]),
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary["!cols"] = [{ wch: 30 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

      // Descargar
      progress.value = 90;
      const fileName = `Hallazgos_${projectName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      progress.value = 100;

      $q.notify({
        type: "positive",
        message: `✅ ${findings.length} hallazgos exportados a Excel`,
      });

      return true;
    } catch (error: any) {
      console.error("Error exportando hallazgos:", error);
      $q.notify({
        type: "negative",
        message: error.message || "Error al exportar hallazgos",
      });
      return false;
    } finally {
      isExporting.value = false;
      progress.value = 0;
    }
  }

  return {
    isExporting,
    progress,
    exportFindingsToExcel,
    // Exponer traducciones para usar en el componente
    translations: {
      emotion: emotionTranslations,
      sentiment: sentimentTranslations,
      type: typeTranslations,
      severity: severityTranslations,
      status: statusTranslations,
      impact: impactTranslations,
      priority: priorityTranslations,
    },
  };
};
