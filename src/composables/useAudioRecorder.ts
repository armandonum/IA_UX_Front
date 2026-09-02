// composables/useAudioRecorder.ts

import { ref, onBeforeUnmount } from 'vue'

// ============================================================
// 🔥 DECLARACIÓN DE TIPOS PARA WEB SPEECH API
// ============================================================

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
}

// ============================================================
// COMPOSABLE
// ============================================================

export function useAudioRecorder() {
  const isRecording = ref(false)
  const isPaused = ref(false)
  const transcribedText = ref('')
  const interimText = ref('')
  const isSupported = ref(false)

  let recognition: SpeechRecognition | null = null
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let dataArray: Uint8Array<ArrayBuffer> | null = null
  let audioLevelInterval: ReturnType<typeof setInterval> | null = null
  let onAudioLevel: ((level: number) => void) | null = null

  // Verificar soporte
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
  isSupported.value = !!SpeechRecognitionAPI

  function initRecognition(): SpeechRecognition | null {
    if (!isSupported.value) {
      console.warn('Web Speech API no soportada en este navegador')
      return null
    }

    const recognitionInstance = new SpeechRecognitionAPI()
    recognitionInstance.continuous = true
    recognitionInstance.interimResults = true
    recognitionInstance.lang = 'es-ES'
    recognitionInstance.maxAlternatives = 1

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += transcript
        } else {
          interim += transcript
        }
      }

      if (finalText) {
        transcribedText.value = finalText
      }
      interimText.value = interim
    }

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Error en reconocimiento de voz:', event.error)
      if (event.error === 'not-allowed') {
        isRecording.value = false
      }
    }

    recognitionInstance.onend = () => {
      if (isRecording.value) {
        try {
          recognitionInstance.start()
        } catch (e) {
          // Ignorar
        }
      }
    }

    return recognitionInstance
  }

  async function startRecording(): Promise<boolean> {
    if (!isSupported.value) {
      console.error('Web Speech API no soportada')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      dataArray = new Uint8Array(analyser.frequencyBinCount)

      recognition = initRecognition()
      if (recognition) {
        recognition.start()
        isRecording.value = true
        isPaused.value = false
        transcribedText.value = ''
        interimText.value = ''

        audioLevelInterval = setInterval(() => {
          if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray)
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i]
            }
            const average = sum / dataArray.length
            const level = average / 255
            if (onAudioLevel) {
              onAudioLevel(level)
            }
          }
        }, 50)

        return true
      }
      return false
    } catch (error) {
      console.error('Error al iniciar grabación:', error)
      return false
    }
  }

  function setAudioLevelCallback(callback: (level: number) => void): void {
    onAudioLevel = callback
  }

  function pauseRecording(): void {
    if (recognition && isRecording.value) {
      try {
        recognition.stop()
        isPaused.value = true
      } catch (e) {
        console.error('Error al pausar:', e)
      }
    }
  }

  function resumeRecording(): void {
    if (recognition && isPaused.value) {
      try {
        recognition.start()
        isPaused.value = false
      } catch (e) {
        console.error('Error al reanudar:', e)
      }
    }
  }

  function stopRecording(): Promise<string> {
    return new Promise((resolve) => {
      if (audioLevelInterval) {
        clearInterval(audioLevelInterval)
        audioLevelInterval = null
      }

      if (recognition) {
        try {
          recognition.stop()
        } catch (e) {
          console.error('Error al detener reconocimiento:', e)
        }
        recognition = null
      }

      if (audioContext) {
        audioContext.close().catch(() => {})
        audioContext = null
      }

      isRecording.value = false
      isPaused.value = false
      const finalText = transcribedText.value || interimText.value || ''
      resolve(finalText)
    })
  }

  function cleanup(): void {
    if (audioLevelInterval) {
      clearInterval(audioLevelInterval)
      audioLevelInterval = null
    }
    if (recognition) {
      try {
        recognition.stop()
      } catch (e) {}
      recognition = null
    }
    if (audioContext) {
      audioContext.close().catch(() => {})
      audioContext = null
    }
    isRecording.value = false
    isPaused.value = false
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    isRecording,
    isPaused,
    transcribedText,
    interimText,
    isSupported,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cleanup,
    setAudioLevelCallback,
  }
}