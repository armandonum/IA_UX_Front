// src/composables/useMediaDevices.ts
import { ref } from 'vue'

export interface MediaDeviceOption {
  deviceId: string
  label: string
  kind: 'videoinput' | 'audioinput' | 'audiooutput'
  groupId?: string
}

export function useMediaDevices() {
  const videoDevices = ref<MediaDeviceOption[]>([])
  const audioDevices = ref<MediaDeviceOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Lista los dispositivos disponibles.
   * ⚠️ getDevices() solo devuelve labels si YA hay permisos concedidos.
   * Por eso primero pedimos permiso básico.
   */
  async function listDevices(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Paso 1: pedir permiso básico para poder leer labels
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        // Cerrar inmediatamente, solo queríamos el permiso
        tempStream.getTracks().forEach((t) => t.stop())
      } catch (permError: any) {
        console.warn('Permiso básico no concedido:', permError)
        // Continuar: quizás ya hay permisos previos
      }

      // Paso 2: enumerar dispositivos
      const devices = await navigator.mediaDevices.enumerateDevices()

      videoDevices.value = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Cámara ${i + 1}`,
          kind: 'videoinput' as const,
          groupId: d.groupId,
        }))

      audioDevices.value = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Micrófono ${i + 1}`,
          kind: 'audioinput' as const,
          groupId: d.groupId,
        }))

      if (videoDevices.value.length === 0) {
        error.value = 'No se detectaron cámaras en este dispositivo.'
      } else if (audioDevices.value.length === 0) {
        error.value = 'No se detectaron micrófonos en este dispositivo.'
      }
    } catch (e: any) {
      error.value = 'No se pudieron enumerar los dispositivos: ' + (e.message || '')
    } finally {
      loading.value = false
    }
  }

  async function testVideoDevice(deviceId: string): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    })
  }

  async function testAudioDevice(deviceId: string): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      video: false,
      audio: { deviceId: { exact: deviceId } },
    })
  }

  async function testBothDevices(
    videoDeviceId: string | null,
    audioDeviceId: string | null,
  ): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
      audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
    }
    return navigator.mediaDevices.getUserMedia(constraints)
  }

  return {
    videoDevices,
    audioDevices,
    loading,
    error,
    listDevices,
    testVideoDevice,
    testAudioDevice,
    testBothDevices,
  }
}