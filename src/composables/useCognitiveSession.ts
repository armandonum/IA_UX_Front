// composables/useCognitiveSession.ts
import { ref, computed } from 'vue'
import { useCognitiveApi } from './useCognitiveApi'

export const useCognitiveSession = () => {
  const api = useCognitiveApi()

  // State
  const sessionId = ref<string | null>(null)
  const evaluationId = ref<string | null>(null)
  const currentTask = ref<any>(null)
  const currentStepIndex = ref(0)
  const flowClicks = ref<any[]>([])
  const responses = ref<any[]>([])
  const isRecording = ref(false)
  const elapsedMs = ref(0)
  const startTimestamp = ref<number | null>(null)
  const emotionReadings = ref<any[]>([])
  const textSentiments = ref<any[]>([])
  const events = ref<any[]>([])
  const comments = ref<any[]>([])
  const completedTaskIds = ref<Set<string>>(new Set())

  // Computed
 const currentStep = computed(() => {
    return flowClicks.value[currentStepIndex.value] || null
  })

  const isLastStep = computed(() => {
    return currentStepIndex.value >= flowClicks.value.length - 1
  })

  const progress = computed(() => {
    if (flowClicks.value.length === 0) return 0
    return Math.round(((currentStepIndex.value + 1) / flowClicks.value.length) * 100)
  })

  const totalSteps = computed(() => flowClicks.value.length)

 const initSession = async (evalId: string, taskId: string, fileKey: string, userId: string) => {
    console.log('🔧 initSession llamado con:', { evalId, taskId, fileKey, userId })
    
    const payload = {
      proyectId: evalId,
      userId: userId,
      taskId: taskId,
      fileKey: fileKey,
      nodeIdInicial: '0-1',
      taskDescription: currentTask.value?.description || 'Recorrido cognitivo',
      deviceType: /Mobi/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent,
      evaluationType: 'cognitive',
    }
    
    console.log('📤 Payload a enviar:', payload)
    
    try {
      const response = await api.createCognitiveSession(payload)
      console.log('📥 Respuesta del backend:', response)
      
      // 🔥 CORREGIDO: Manejar diferentes formatos de respuesta
      let sessionIdValue: string
      
      if (typeof response === 'string') {
        // Si la respuesta es un string (solo el ID)
        sessionIdValue = response
      } else if (response && typeof response === 'object') {
        // Si la respuesta es un objeto
        sessionIdValue = response.sessionId || response.id || response.session_id
      } else {
        throw new Error('Formato de respuesta inválido')
      }
      
      console.log('✅ Session ID obtenido:', sessionIdValue)
      
      sessionId.value = sessionIdValue
      evaluationId.value = evalId
      startTimestamp.value = Date.now()
      isRecording.value = true
      
      return { sessionId: sessionIdValue }
    } catch (error: any) {
      console.error('❌ Error en initSession:', error.response?.data || error.message)
      throw error
    }
  }

  const finishSession = async (status: 'completed' | 'abandoned') => {
    if (!sessionId.value) return
    await api.finishCognitiveSession(sessionId.value, {
      status,
      durationSeconds: Math.floor(elapsedMs.value / 1000)
    })
    isRecording.value = false
  }

  const loadTask = async (task: any) => {
    currentTask.value = task
    currentStepIndex.value = 0
    responses.value = []
    flowClicks.value = []
  }

  const setFlowClicks = async (clicks: any[]) => {
    flowClicks.value = clicks
    currentStepIndex.value = 0
  }

  const nextStep = () => {
    if (currentStepIndex.value < flowClicks.value.length - 1) {
      currentStepIndex.value++
    }
  }

  const prevStep = () => {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
    }
  }

  const goToStep = (index: number) => {
    if (index >= 0 && index < flowClicks.value.length) {
      currentStepIndex.value = index
    }
  }

  const saveResponse = async (responseData: any) => {
    const response = await api.createCognitiveResponse({
      sessionId: sessionId.value,
      taskId: currentTask.value.id,
      flowClickId: currentStep.value?.clickId || null,
      stepIndex: currentStepIndex.value,
      ...responseData
    })
    responses.value.push(response)
    return response
  }

  const saveEmotion = async (data: any) => {
    const reading = await api.saveEmotionReading({
      sessionId: sessionId.value,
      ...data
    })
    emotionReadings.value.push(reading)
    return reading
  }

  const saveTextSentiment = async (data: any) => {
    const sentiment = await api.saveTextSentiment({
      sessionId: sessionId.value,
      ...data
    })
    textSentiments.value.push(sentiment)
    return sentiment
  }

  const saveEvent = async (data: any) => {
    const event = await api.saveUsabilityEvent({
      sessionId: sessionId.value,
      ...data
    })
    events.value.push(event)
    return event
  }

  const saveComment = async (data: any) => {
    const comment = await api.saveSessionComment({
      sessionId: sessionId.value,
      ...data
    })
    comments.value.push(comment)
    return comment
  }

  const getElapsedMs = () => {
    if (!startTimestamp.value) return 0
    return Date.now() - startTimestamp.value
  }

  const getTimeFormatted = () => {
    const totalSeconds = Math.floor(getElapsedMs() / 1000)
    const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const sec = (totalSeconds % 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  }

  return {
    // State
    sessionId,
    evaluationId,
    currentTask,
    currentStep,
    currentStepIndex,
    flowClicks,
    responses,
    isRecording,
    elapsedMs,
    startTimestamp,
    emotionReadings,
    textSentiments,
    events,
    comments,
    completedTaskIds,
    // Computed
    isLastStep,
    progress,
    totalSteps,
    // Methods
    initSession,
    finishSession,
    loadTask,
    setFlowClicks,
    nextStep,
    prevStep,
    goToStep,
    saveResponse,
    saveEmotion,
    saveTextSentiment,
    saveEvent,
    saveComment,
    getElapsedMs,
    getTimeFormatted,
  }
}