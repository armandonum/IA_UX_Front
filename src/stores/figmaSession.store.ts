//stores/figmaSession.store
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const CLIENT_ID_STORAGE_KEY = 'figma_client_id'

export interface SelectedFigmaProject {
  projectId: string
  fileKey: string
  projectName: string
}

export const useFigmaSessionStore = defineStore('figmaSession', () => {
  // El Client ID se recuerda en localStorage para no pedirlo cada vez.
  const clientId = ref<string>(localStorage.getItem(CLIENT_ID_STORAGE_KEY) ?? '')
  const selectedProject = ref<SelectedFigmaProject | null>(null)

  watch(clientId, (value) => {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, value)
  })

  function setClientId(value: string) {
    clientId.value = value.trim()
  }

  function selectProject(project: SelectedFigmaProject) {
    selectedProject.value = project
  }

  function clearSelection() {
    selectedProject.value = null
  }

  return {
    clientId,
    selectedProject,
    setClientId,
    selectProject,
    clearSelection,
  }
})