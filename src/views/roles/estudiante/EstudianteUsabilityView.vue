  <!-- views/roles/estudiante/EstudianteUsabilityView.vue -->

  <template>
    <div class="w-full h-screen relative">
      <!-- ====== CONSENTIMIENTO ====== -->
      <UsabilityConsentModal
        :show="status === 'consent'"
        v-model:checked="consentChecked"
        :loading="loadingPermissions"
        :error="permissionsError"
        @continuar="pedirPermisosYContinuar"
      />

      <!-- ====== PRETEST ====== -->
      <UsabilityPretestModal
        v-if="status === 'pretest' && pretestQuestionnaire"
        :show="status === 'pretest'"
        :questionnaire="pretestQuestionnaire"
        :loading="loadingQuestionnaire"
        @enviar="onPretestEnviado"
      />

      <!-- ====== LISTA DE TAREAS ====== -->
      <UsabilityTaskListModal
        :show="status === 'tasklist'"
        :tasks="tasks"
        :completed-task-ids="completedTaskIds"
        :loading="loadingTasks"
        @seleccionar-tarea="seleccionarTarea"
      />

      <!-- ====== INICIO DE TAREA ====== -->
  <UsabilityTaskStartModal
    :show="status === 'idle'"
    :task-description="currentTask?.description ?? ''"
    :camara-lista="camaraLista"
    :pantalla-lista="pantallaLista"
    :loading-start="loadingStart"
    @iniciar="iniciarRecorrido"
  />

      <!-- ====== PROTOTIPO EN CURSO ====== -->
      <template v-if="status === 'running'">
        <UsabilityPrototypeStage
          ref="stageRef"
          :figma-embed-url="figmaEmbedUrl"
        />

        <UsabilityStatusBar
          :tiempo="tiempoFormateado"
          :emocion-emoji="emocionActualEmoji"
          :emocion-label="emocionActualLabel"
          @finalizar="finalizarRecorrido"
        />
  <ReportModal
    :session-id="sessionId"
    :current-time-ms="elapsedMs" 
    :emotion-actual-label="emocionActualLabel"
    :evento-info="getNearestEvent(elapsedMs)"
    @seek="seekAbsoluto"
    @report="onReporteEnviado"
  />

        <UsabilityAudioBar
          :is-recording="isAudioRecording"
          :audio-level="audioLevel"
          :transcribed-text="transcribedText"
          :is-connected="isTextAIConnected"
          :last-sentiment="lastSentiment"
        />
      </template>

      <!-- ====== TAREA COMPLETADA ====== -->
  <UsabilityTaskCompleteModal
    :show="status === 'task-finished'"
    :subiendo-videos="subiendoVideos"
    :tiempo-formateado="tiempoFormateado"
    :eventos-registrados="eventosRegistrados"
    :lecturas-emocion-registradas="lecturasEmocionRegistradas"
    :quedan-tareas="tareasPendientes.length > 0"
    @continuar="volverAListaOTerminar"
  />

      <!-- ====== POSTEST ====== -->
      <UsabilityPosttestModal
        v-if="status === 'posttest' && posttestQuestionnaire"
        :show="status === 'posttest'"
        :questionnaire="posttestQuestionnaire"
        :loading="loadingQuestionnaire"
        @enviar="onPosttestEnviado"
      />

      <!-- ====== FINALIZACIÓN ====== -->
  <UsabilityFinishedModal
    :show="status === 'finished'"
    :subiendo-videos="false"
    :tiempo-formateado="tiempoFormateado"
    :eventos-registrados="eventosRegistrados"
    :lecturas-emocion-registradas="lecturasEmocionRegistradas"
  />
    </div>
  </template>

  <script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth.store'
  import { useFigmaSessionStore } from '@/stores/figmaSession.store'

  // Componentes
  import UsabilityConsentModal from '@/components/estudiante/usability/UsabilityConsentModal.vue'
  import UsabilityPretestModal from '@/components/estudiante/usability/UsabilityPretestModal.vue'
  import UsabilityTaskListModal from '@/components/estudiante/usability/UsabilityTaskListModal.vue'
  import UsabilityTaskStartModal from '@/components/estudiante/usability/UsabilityTaskStartModal.vue'
  import UsabilityPrototypeStage from '@/components/estudiante/usability/UsabilityPrototypeStage.vue'
  import UsabilityStatusBar from '@/components/estudiante/usability/UsabilityStatusBar.vue'
  import UsabilityAudioBar from '@/components/estudiante/usability/UsabilityAudioBar.vue'
  import UsabilityTaskCompleteModal from '@/components/estudiante/usability/UsabilityTaskCompleteModal.vue'
  import UsabilityPosttestModal from '@/components/estudiante/usability/UsabilityPosttestModal.vue'
  import UsabilityFinishedModal from '@/components/estudiante/usability/UsabilityFinishedModal.vue'
  import ReportModal from '@/components/estudiante/figma/ReportModal.vue'



  // Composables
  import { useAudioRecorder } from '@/composables/useAudioRecorder'
  import { useHeatmap } from '@/composables/useHeatmap'

  // Types
  import type { Task, Questionnaire, QuestionAnswer } from '@/types/usability'

  // ============================================================
  // NODO ACTUAL DE FIGMA
  // ============================================================
  const currentNodeId = ref<string | null>(null)  

  const auth = useAuthStore()
  const route = useRoute()
  const router = useRouter()
  const figmaSession = useFigmaSessionStore()

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================
  const NODE_ID = '1-759'
  const EMOTION_SERVICE_URL = 'http://localhost:8000/analyze-frame'
  const EMOTION_CAPTURE_INTERVAL_MS = 2000
  const TEXT_SERVICE_URL = 'http://localhost:8000/analyze-text'

  const fileKey = computed(
    () => (route.params.fileKey as string) || figmaSession.selectedProject?.fileKey || ''
  )
  const clientId = computed(() => figmaSession.clientId)
  const projectId = computed(() => figmaSession.selectedProject?.projectId || '')

  const figmaEmbedUrl = computed(() => {
    const params = new URLSearchParams({
      'node-id': NODE_ID,
      'embed-host': 'share',
      'client-id': clientId.value,
    })
    return `https://embed.figma.com/proto/${fileKey.value}?${params.toString()}`
  })

  // ============================================================
  // AUDIO
  // ============================================================
  const {
    isRecording: isAudioRecording,
    transcribedText,
    isSupported: isAudioSupported,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    cleanup: cleanupAudio,
    setAudioLevelCallback,
  } = useAudioRecorder()

  const audioLevel = ref(0)
  const isTextAIConnected = ref(false)
  const lastSentiment = ref<{ uxLabel: string; confidence: number } | null>(null)

  let audioLevelInterval: ReturnType<typeof setInterval> | null = null

  setAudioLevelCallback((level: number) => {
    audioLevel.value = level
  })

  // ============================================================
  // ESTADO GENERAL
  // ============================================================
  type Status =
    | 'consent'
    | 'pretest'
    | 'tasklist'
    | 'idle'
    | 'running'
    | 'task-finished'
    | 'posttest'
    | 'finished'

  const status = ref<Status>('consent')
  const consentChecked = ref(false)
  const loadingPermissions = ref(false)
  const permissionsError = ref<string | null>(null)
  const loadingStart = ref(false)
  const subiendoVideos = ref(false)
  const loadingQuestionnaire = ref(false)
  const loadingTasks = ref(false)

  const stageRef = ref<InstanceType<typeof UsabilityPrototypeStage> | null>(null)

  const sessionId = ref<string | null>(null)
  const startTimestamp = ref<number | null>(null)
  const elapsedMs = ref(0)
  const eventosRegistrados = ref(0)
  const lecturasEmocionRegistradas = ref(0)
  const emocionActual = ref<string | null>(null)
    const events = ref<any[]>([])       
  const comments = ref<any[]>([])      

  let timerInterval: ReturnType<typeof setInterval> | null = null
  let emotionInterval: ReturnType<typeof setInterval> | null = null

    

  // ============================================================
  // TAREAS / CUESTIONARIOS
  // ============================================================
  const tasks = ref<Task[]>([])
  const completedTaskIds = ref<Set<string>>(new Set())
  const currentTask = ref<Task | null>(null)

  const pretestQuestionnaire = ref<Questionnaire | null>(null)
  const posttestQuestionnaire = ref<Questionnaire | null>(null)
  const pretestCompleted = ref(false)
  const posttestCompleted = ref(false)

  const tareasPendientes = computed(() =>
    tasks.value.filter((t) => !completedTaskIds.value.has(t.taskId))
  )


  // ============================================================
  // STREAMS
  // ============================================================
  const camaraLista = ref(false)
  const pantallaLista = ref(false)

  const screenVideoEl = ref<HTMLVideoElement | null>(null)  
  const faceVideoEl = ref<HTMLVideoElement | null>(null)
  let faceStream: MediaStream | null = null
  let screenStream: MediaStream | null = null
  let faceRecorder: MediaRecorder | null = null
  let screenRecorder: MediaRecorder | null = null
  let faceChunks: Blob[] = []
  let screenChunks: Blob[] = []



  // ============================================================
  // COMPUTED
  // ============================================================
  const tiempoFormateado = computed(() => {
    const totalSeconds = Math.floor(elapsedMs.value / 1000)
    const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const sec = (totalSeconds % 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  })

  const emotionEmojis: Record<string, string> = {
    happy: '🙂', sad: '🙁', angry: '😠', surprise: '😮', disgust: '😖', fear: '😨',
  }
  const emotionLabelsEs: Record<string, string> = {
    happy: 'Felicidad', sad: 'Tristeza', angry: 'Enojo',
    surprise: 'Sorpresa', disgust: 'Asco', fear: 'Miedo',
  }

  const emocionActualEmoji = computed(() =>
    emocionActual.value ? emotionEmojis[emocionActual.value] ?? '—' : '—'
  )
  const emocionActualLabel = computed(() =>
    emocionActual.value ? emotionLabelsEs[emocionActual.value] ?? emocionActual.value : 'analizando…'
  )

  function tiempoActual() {
    const totalMs = startTimestamp.value ? Date.now() - startTimestamp.value : 0
    return {
      elapsed_ms_total: totalMs,
      elapsed_minute: Math.floor(totalMs / 60000),
      elapsed_second: Math.floor((totalMs % 60000) / 1000),
    }
  }

  // ============================================================
  // MÉTODOS
  // ============================================================


  // ============================================================
  // MAPA DE CALOR con nodeId dinámico
  // ============================================================
  const { 
    isCapturing: isHeatmapCapturing,
    startCapturing: startHeatmap,
    stopCapturing: stopHeatmap,
  } = useHeatmap({
    sessionId: sessionId,
    projectId: projectId,
    userId: ref(auth.user?.user_id || null),
    nodeId: currentNodeId, 
    enabled: true,
    captureMove: true,
    captureScroll: true,
    debounceMs: 500,
    getElapsedMs: () => tiempoActual().elapsed_ms_total,
  })
  // ============================================================
  // PASO 0: PERMISOS (cámara + pantalla + audio)
  // ============================================================
  async function pedirPermisosYContinuar() {
    loadingPermissions.value = true
    permissionsError.value = null

    try {
      // 🔥 Obtener video de la cámara Y audio del micrófono JUNTOS
      const faceStreamWithAudio = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true  // ✅ Ahora incluimos audio
      })
      faceStream = faceStreamWithAudio
      camaraLista.value = true
    } catch (e) {
      permissionsError.value = 'No se pudo acceder a la cámara o micrófono.'
      loadingPermissions.value = false
      return
    }

    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: false  // La pantalla sigue SIN audio
      })
      pantallaLista.value = true
    } catch (e) {
      permissionsError.value = 'No se pudo acceder a la pantalla.'
      loadingPermissions.value = false
      return
    }

    loadingPermissions.value = false
    await cargarProgreso()

    if (!pretestCompleted.value) {
      await cargarCuestionario('pretest')
      status.value = 'pretest'
      return
    }

    await irAListaDeTareas()
  }

  async function cargarProgreso() {
    const userId = auth.user?.user_id
    if (!userId) return

    try {
      const [pretestMeta, posttestMeta] = await Promise.all([
        fetchQuestionnaireMeta('pretest'),
        fetchQuestionnaireMeta('posttest'),
      ])

      const responsesRes = await fetch(`/api/questionnaire-responses/participant/${userId}`)
      const responses = responsesRes.ok ? await responsesRes.json() : []

      pretestCompleted.value = pretestMeta
        ? responses.some(
            (r: any) => r.questionnaire_id === pretestMeta.questionnaire_id && r.session_id === null
          )
        : true

      posttestCompleted.value = posttestMeta
        ? responses.some(
            (r: any) => r.questionnaire_id === posttestMeta.questionnaire_id && r.session_id === null
          )
        : true

      const sessionsRes = await fetch(`/api/usability-sessions`)
      const allSessions = sessionsRes.ok ? await sessionsRes.json() : []

      completedTaskIds.value = new Set<string>(
        allSessions
          .filter(
            (s: any) =>
              s.project_id === projectId.value &&
              s.user_id === userId &&
              s.status === 'completed' &&
              !!s.task_id
          )
          .map((s: any) => s.task_id)
      )
    } catch (e) {
      console.error('Error cargando progreso', e)
    }
  }

  async function fetchQuestionnaireMeta(tipo: 'pretest' | 'posttest') {
    const res = await fetch(`/api/questionnaires/project/${projectId.value}/type/${tipo}`)
    if (!res.ok) return null
    return await res.json()
  }

  async function cargarCuestionario(tipo: 'pretest' | 'posttest') {
    loadingQuestionnaire.value = true
    try {
      // 1. Obtener metadata del cuestionario
      const meta = await fetchQuestionnaireMeta(tipo)
      if (!meta) {
        if (tipo === 'pretest') pretestQuestionnaire.value = null
        else posttestQuestionnaire.value = null
        return
      }

      // 2. Obtener las preguntas del cuestionario
      const questionsRes = await fetch(`/api/questions/questionnaire/${meta.questionnaireId}`)
      if (!questionsRes.ok) {
        throw new Error('Error al cargar preguntas')
      }
      const questionsRaw = await questionsRes.json()

      // 3. Para CADA pregunta, cargar sus opciones si es de tipo opción múltiple
      const questionsConOpciones = await Promise.all(
        questionsRaw.map(async (q: any) => {
          // Determinar el ID correcto de la pregunta
          const questionId = q.questionId || q.id || q.question_id
          
          // Verificar si es una pregunta que necesita opciones
          const questionType = q.question_type || q.questionType || 'short_text'
          const esDeOpciones = questionType === 'single_choice' || questionType === 'multi_choice'
          
          // Si no es de opciones, devolver la pregunta sin opciones
          if (!esDeOpciones) {
            return {
              ...q,
              questionId: questionId,
              questionType: questionType,
              options: []
            }
          }

          // 🔥 IMPORTANTE: Hacer la consulta a /api/question-options/question/:questionId
          try {
            console.log(`🔍 Cargando opciones para pregunta: ${questionId}`)
            const optionsRes = await fetch(`/api/question-options/question/${questionId}`, {
              headers: {
                'accept': '*/*'
              }
            })
            
            if (!optionsRes.ok) {
              console.warn(`⚠️ No se pudieron cargar opciones para pregunta ${questionId}: ${optionsRes.status}`)
              return {
                ...q,
                questionId: questionId,
                questionType: questionType,
                options: []
              }
            }
            
            const options = await optionsRes.json()
            console.log(`✅ Opciones cargadas para pregunta ${questionId}:`, options)

            // Mapear las opciones al formato esperado por el frontend
            const opcionesMapeadas = options.map((opt: any) => ({
              optionId: opt.optionId || opt.id || opt.option_id,
              label: opt.label || opt.text || opt.option_text || 'Opción sin texto',
              orderIndex: opt.order_index || opt.orderIndex || 0,
            }))

            // Ordenar opciones por orderIndex
            opcionesMapeadas.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))

            return {
              ...q,
              questionId: questionId,
              questionType: questionType,
              options: opcionesMapeadas,
            }
          } catch (error) {
            console.error(`❌ Error cargando opciones para pregunta ${questionId}:`, error)
            return {
              ...q,
              questionId: questionId,
              questionType: questionType,
              options: [],
            }
          }
        })
      )

      // 4. Mapear todas las preguntas al formato final
      const questionsMapeadas = questionsConOpciones.map((q: any) => ({
        questionId: q.questionId,
        questionText: q.question_text || q.questionText || q.text || 'Pregunta sin texto',
        questionType: q.question_type || q.questionType || 'short_text',
        isRequired: q.is_required !== undefined ? q.is_required : (q.isRequired !== undefined ? q.isRequired : true),
        orderIndex: q.order_index || q.orderIndex || 0,
        options: q.options || [],
        scaleMin: q.scale_min || q.scaleMin || 1,
        scaleMax: q.scale_max || q.scaleMax || 5,
        allowNotApplicable: q.allow_not_applicable || q.allowNotApplicable || false,
      }))

      // 5. Crear el objeto Questionnaire completo
      const questionnaireCompleto: Questionnaire = {
        questionnaire_id: meta.questionnaireId || meta.id || meta.questionnaire_id,
        title: meta.title || 'Cuestionario',
        description: meta.description || '',
        questions: questionsMapeadas.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0)),
      }

      console.log(`✅ Cuestionario ${tipo} completo:`, questionnaireCompleto)

      if (tipo === 'pretest') {
        pretestQuestionnaire.value = questionnaireCompleto
      } else {
        posttestQuestionnaire.value = questionnaireCompleto
      }

    } catch (e) {
      console.error('❌ Error cargando cuestionario', e)
    } finally {
      loadingQuestionnaire.value = false
    }
  }
  async function irAListaDeTareas() {
    loadingTasks.value = true
    try {
      if (tasks.value.length === 0) {
        const res = await fetch(`/api/tasks/projectId/${projectId.value}`)
        if (res.ok) {
          tasks.value = await res.json()
        }
      }
      status.value = 'tasklist'
    } finally {
      loadingTasks.value = false
    }
  }

  function seleccionarTarea(task: Task) {
    currentTask.value = task
    status.value = 'idle'
  }

  async function volverAListaOTerminar() {
    await nextTick()
    
    const pendientes = tareasPendientes.value
    
    if (pendientes.length > 0) {
      status.value = 'tasklist'
      return
    }

    if (!posttestCompleted.value) {
      await cargarCuestionario('posttest')
      if (posttestQuestionnaire.value) {
        status.value = 'posttest'
        return
      }
    }

    status.value = 'finished'
  }

  // ============================================================
  // CUESTIONARIOS
  // ============================================================
  async function enviarRespuestasCuestionario(
    questionnaireId: string,
    answers: QuestionAnswer[]
  ) {
    const participantId = auth.user?.user_id

    const responseRes = await fetch('/api/questionnaire-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionnaireId,
        participantId,
        sessionId: null,
      }),
    })
    if (!responseRes.ok) throw new Error('No se pudo crear la respuesta')
    const response = await responseRes.json()
    const responseId = response.responseId ?? response.response_id ?? response.id

    await Promise.all(
      answers.map(async (answer) => {
        const answerRes = await fetch('/api/question-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responseId,
            questionId: answer.questionId,
            answerText: answer.answerText || null,
            selectedOptionId: answer.selectedOptionId || null,
            scaleValue: answer.scaleValue ?? null,
            booleanValue: answer.booleanValue ?? null,
            isNotApplicable: answer.isNotApplicable ?? false,
          }),
        })
        if (!answerRes.ok) return

        if (answer.selectedOptionIds && answer.selectedOptionIds.length > 0) {
          const created = await answerRes.json()
          const answerId = created.answerId ?? created.answer_id ?? created.id
          await Promise.all(
            answer.selectedOptionIds.map((optionId) =>
              fetch('/api/question-answer-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answerId, optionId }),
              })
            )
          )
        }
      })
    )
  }

  async function onPretestEnviado(answers: QuestionAnswer[]) {
    if (pretestQuestionnaire.value) {
      await enviarRespuestasCuestionario(pretestQuestionnaire.value.questionnaire_id, answers)
    }
    pretestCompleted.value = true
    await irAListaDeTareas()
  }

  async function onPosttestEnviado(answers: QuestionAnswer[]) {
    if (posttestQuestionnaire.value) {
      await enviarRespuestasCuestionario(posttestQuestionnaire.value.questionnaire_id, answers)
    }
    posttestCompleted.value = true
    status.value = 'finished'
  }

  // ============================================================
  // ANÁLISIS DE TEXTO
  // ============================================================
  watch(transcribedText, async (newText) => {
    if (newText && newText.trim().length > 0) {
      await analyzeText(newText.trim())
    }
  })

  onMounted(() => {
    checkTextAIConnection()
    if (!isAudioSupported) {
      console.warn('⚠️ Tu navegador no soporta reconocimiento de voz')
    }
  })

  async function checkTextAIConnection() {
    try {
      const res = await fetch('http://localhost:8000/health')
      isTextAIConnected.value = res.ok
    } catch {
      isTextAIConnected.value = false
    }
  }

  async function analyzeText(text: string) {
    if (!text.trim() || !sessionId.value) return

    try {
      const response = await fetch(TEXT_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (response.ok) {
        const result = await response.json()
        
        lastSentiment.value = {
          uxLabel: result.ux_label || result.uxLabel || 'Neutral',
          confidence: result.confidence || 0,
        }

        await saveTextSentiment(text, result)
      }
    } catch (error) {
      console.error('Error analizando texto:', error)
    }
  }

  async function saveTextSentiment(text: string, result: any) {
    try {
      const payload = {
        sessionId: sessionId.value,
        text: text,
        originalLabel: result.original_label || result.originalLabel || 'unknown',
        uxLabel: result.ux_label || result.uxLabel || 'Neutral',
        confidence: result.confidence || 0,
        scoresJson: result.scores || {},
        elapsedMsTotal: tiempoActual().elapsed_ms_total,
        timestampReal: new Date().toISOString(),
        authorId: auth.user?.user_id || null,
      }

      await fetch('http://localhost:3000/api/text-sentiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      console.error('Error guardando sentimiento:', error)
    }
  }

  // ============================================================
  // SESIÓN Y GRABACIÓN
  // ============================================================
  async function crearSesion() {
    const res = await fetch('/api/usability-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proyectId: figmaSession.selectedProject?.projectId,
        userId: auth.user?.user_id,
        fileKey: fileKey.value,
        nodeIdInicial: NODE_ID,
        taskId: currentTask.value?.taskId ?? null,
        taskDescription: currentTask.value?.description ?? '',
        deviceType: /Mobi/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        browser: navigator.userAgent,
      }),
    })
    if (!res.ok) throw new Error('No se pudo crear la sesión')
    const data = await res.json()
    return data.sessionId as string
  }

  async function cerrarSesion(status: 'completed' | 'abandoned') {
    if (!sessionId.value) return
    await fetch(`/api/usability-sessions/${sessionId.value}/finish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }

  async function registrarEvento(eventType: string, payload: unknown, nodeId?: string) {
    if (!sessionId.value) return
    const tiempo = tiempoActual()
    eventosRegistrados.value++

    fetch('/api/usability-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId.value,
        event_type: eventType,
        event_type_normalizado: 'navegacion',
        node_id: nodeId ?? null,
        screen_name: nodeId ? 'Pantalla' : null,
        elapsed_minute: tiempo.elapsed_minute,
        elapsed_second: tiempo.elapsed_second,
        elapsed_ms_total: tiempo.elapsed_ms_total,
        timestamp_real: new Date().toISOString(),
        raw_payload: payload ?? null,
      }),
    }).catch(() => {})
  }

  async function registrarLecturaEmocion(reading: {
    elapsed_ms_total: number
    dominant_emotion: string | null
    scores: Record<string, number> | null
    face_detected: boolean
  }) {
    if (!sessionId.value) return
    lecturasEmocionRegistradas.value++


    fetch('/api/emotion-readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.value,
        elapsedMsTotal: reading.elapsed_ms_total,
        timestampReal: new Date().toISOString(),
        dominantEmotion: reading.dominant_emotion,
        scoresJson: reading.scores,
      }),
    }).catch(() => {})  
  }

  async function subirVideo(blob: Blob, tipo: 'screen' | 'face'): Promise<string | null> {
    if (!sessionId.value) return null

    const formData = new FormData()
    formData.append('file', blob, `${tipo}_${sessionId.value}.webm`)
    formData.append('session_id', sessionId.value)
    formData.append('video_type', tipo)

    try {
      const response = await fetch('/api/usability-sessions/upload/video', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('No se pudo subir el video')
      const data = await response.json()
      return data.videoKey
    } catch (error) {
      console.error(`Error subiendo video ${tipo}:`, error)
      return null
    }
  }

  // ============================================================
  // ANÁLISIS DE EMOCIONES FACIALES
  // ============================================================
  function capturarFrameBase64(): string | null {
    const video = stageRef.value?.faceVideoEl
    const canvas = stageRef.value?.captureCanvas
    if (!video || !canvas) return null
    if (!video.videoWidth || !video.videoHeight) return null

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  async function analizarEmocionActual() {
    const imageBase64 = capturarFrameBase64()
    if (!imageBase64 || !sessionId.value) return

    const tiempo = tiempoActual()

    try {
      const res = await fetch(EMOTION_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId.value,
          elapsed_ms_total: tiempo.elapsed_ms_total,
          image_base64: imageBase64,
        }),
      })
      if (!res.ok) return
      const data = await res.json()

      emocionActual.value = data.face_detected ? data.dominant_emotion : null

      registrarLecturaEmocion({
        elapsed_ms_total: tiempo.elapsed_ms_total,
        dominant_emotion: data.dominant_emotion ?? null,
        scores: data.scores ?? null,
        face_detected: data.face_detected,
      })
    } catch (e) {
      console.warn('Servicio de emociones no disponible en este intervalo', e)
    }
  }

  // ============================================================
  // EVENTOS DE FIGMA
  // ============================================================
  function handleMessage(event: MessageEvent) {
    const figmaOrigin = 'https://www.figma.com'
    if (event.origin !== figmaOrigin) return
    const data = event.data
    if (!data?.type || status.value !== 'running') return
    // 🔥 Guardar el nodeId actual cuando cambia
    if (data.type === 'PRESENTED_NODE_CHANGED' && data.data?.presentedNodeId) {
      currentNodeId.value = data.data.presentedNodeId
    }
    switch (data.type) {
      case 'INITIAL_LOAD':
        registrarEvento('INITIAL_LOAD', data.data)
        break
      case 'PRESENTED_NODE_CHANGED':
        registrarEvento('PRESENTED_NODE_CHANGED', data.data, data.data?.presentedNodeId)
        break
      case 'NEW_STATE':
        registrarEvento('NEW_STATE', data.data)
        break
      case 'MOUSE_PRESS_OR_RELEASE':
        registrarEvento('MOUSE_PRESS_OR_RELEASE', data.data)
        break
      default:
        registrarEvento(data.type, data.data)
    }
  }

  // ============================================================
  // INICIAR Y FINALIZAR RECORRIDO
  // ============================================================
  async function iniciarRecorrido() {
    loadingStart.value = true
    try {
      sessionId.value = await crearSesion()
      startTimestamp.value = Date.now()
      elapsedMs.value = 0
      eventosRegistrados.value = 0
      lecturasEmocionRegistradas.value = 0
      status.value = 'running'

      await nextTick()

      if (stageRef.value?.faceVideoEl && faceStream) {
        stageRef.value.faceVideoEl.srcObject = faceStream
      }

      if (faceStream) {
        faceChunks = []
        faceRecorder = new MediaRecorder(faceStream, { mimeType: 'video/webm' })
        faceRecorder.ondataavailable = (e) => { if (e.data.size > 0) faceChunks.push(e.data) }
        faceRecorder.start()
      }
      

      if (screenStream) {
        screenChunks = []
        screenRecorder = new MediaRecorder(screenStream, { mimeType: 'video/webm' })
        screenRecorder.ondataavailable = (e) => { if (e.data.size > 0) screenChunks.push(e.data) }
        screenRecorder.start()
        screenStream.getVideoTracks()[0]?.addEventListener('ended', finalizarRecorrido)
      }

      // Iniciar audio automáticamente
      if (!isAudioRecording.value) {
        const started = await startAudioRecording()
        if (started) {
          console.log('🎤 Grabación de audio iniciada automáticamente')
          audioLevelInterval = setInterval(() => {}, 50)
        }
      }
      // 🔥 Iniciar captura de mapa de calor
      startHeatmap()

      window.addEventListener('message', handleMessage)
      window.addEventListener('beforeunload', handleBeforeUnload)

      timerInterval = setInterval(() => {
        if (startTimestamp.value) elapsedMs.value = Date.now() - startTimestamp.value
      }, 250)

      emotionInterval = setInterval(analizarEmocionActual, EMOTION_CAPTURE_INTERVAL_MS)
      
    } catch (e) {
      console.error(e)
    } finally {
      loadingStart.value = false
    }
  }

  async function finalizarRecorrido() {
    // 🔥 Detener captura de mapa de calor
    stopHeatmap()
    if (isAudioRecording.value) {
      const finalText = await stopAudioRecording()
      if (finalText) {
        await analyzeText(finalText)
      }
      if (audioLevelInterval) {
        clearInterval(audioLevelInterval)
        audioLevelInterval = null
      }
    }

    if (timerInterval) clearInterval(timerInterval)
    if (emotionInterval) clearInterval(emotionInterval)
    window.removeEventListener('message', handleMessage)
    window.removeEventListener('beforeunload', handleBeforeUnload)

    status.value = 'task-finished'
    subiendoVideos.value = true

    await cerrarSesion('completed')
    await detenerYSubirGrabaciones()

    if (currentTask.value) {
      completedTaskIds.value.add(currentTask.value.taskId)
    }

    await nextTick()
    subiendoVideos.value = false
    await volverAListaOTerminar()
  }

  function detenerRecorder(recorder: MediaRecorder | null): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!recorder || recorder.state === 'inactive') {
        resolve(null)
        return
      }
      recorder.onstop = () => {
        const chunks = recorder === faceRecorder ? faceChunks : screenChunks
        resolve(new Blob(chunks, { type: 'video/webm' }))
      }
      recorder.stop()
    })
  }

  async function detenerYSubirGrabaciones() {
    const [faceBlob, screenBlob] = await Promise.all([
      detenerRecorder(faceRecorder),
      detenerRecorder(screenRecorder),
    ])

    if (faceBlob) await subirVideo(faceBlob, 'face')
    if (screenBlob) await subirVideo(screenBlob, 'screen')
  }

  function handleBeforeUnload() {
    if (status.value === 'running') {
      navigator.sendBeacon?.(
        `/api/usability-sessions/${sessionId.value}`,
        JSON.stringify({ status: 'abandoned', duration_seconds: Math.floor(elapsedMs.value / 1000) })
      )
    }
  }

  // ============================================================
  // FUNCIÓN PARA OBTENER EVENTO MÁS CERCANO
  // ============================================================
  function getNearestEvent(ms: number): any | null {
    if (!events.value.length) return null
    return events.value.reduce((closest, ev) => {
      const diff1 = Math.abs(ev.elapsed_ms_total - ms)
      const diff2 = Math.abs(closest.elapsed_ms_total - ms)
      return diff1 < diff2 ? ev : closest
    })
  }

  // ============================================================
  // FUNCIÓN PARA MANEJAR REPORTES
  // ============================================================
  async function onReporteEnviado(data: any) {
    try {
      // Preparar el payload según el formato esperado por el backend
      const payload = {
        sessionId: data.sessionId,
        elapsedMsTotal: data.elapsedMsTotal,
        text: data.text,
        emotionLabel: data.emotionLabel || null,
        authorId: auth.user?.user_id || null,
      }

      // Enviar al backend
      const response = await fetch('http://localhost:3000/api/session-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Error al guardar el reporte: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Reporte guardado:', result)

      // Agregar el comentario a la lista local
      comments.value.push({
        commentId: result.commentId || crypto.randomUUID(),
        sessionId: data.sessionId,
        elapsed_ms_total: data.elapsedMsTotal,
        text: data.text,
        createdAt: new Date().toISOString(),
      })

    } catch (error) {
      console.error('Error al enviar reporte:', error)
    }
  }
  // ============================================================
  // ACCIONES PRINCIPALES
  // ============================================================
  // Asegúrate de que seekAbsoluto existe
  function seekAbsoluto(ms: number) {
    const seconds = Math.max(0, ms) / 1000
    if (screenVideoEl.value) screenVideoEl.value.currentTime = seconds
    if (faceVideoEl.value) faceVideoEl.value.currentTime = seconds
    elapsedMs.value = Math.max(0, ms)
  }

  // ============================================================
  // CLEANUP
  // ============================================================
  onBeforeUnmount(() => {
    if (timerInterval) clearInterval(timerInterval)
    if (emotionInterval) clearInterval(emotionInterval)
    if (audioLevelInterval) clearInterval(audioLevelInterval)
    window.removeEventListener('message', handleMessage)
    window.removeEventListener('beforeunload', handleBeforeUnload)
    faceStream?.getTracks().forEach((t) => t.stop())
    screenStream?.getTracks().forEach((t) => t.stop())
    cleanupAudio()
  })
  </script>