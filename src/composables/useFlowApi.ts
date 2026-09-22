// composables/useFlowApi.ts
import api from '@/api/axios'

export interface Flow {
  flowId: string
  taskId: string
  projectId: string
  name: string
  status: 'in_progress' | 'completed' | 'cancelled'
  startedAt: string
  finishedAt: string | null
}

export interface FlowClick {
  clickId: string
  flowId: string
  orderIndex: number
  nodeId: string
  presentedNodeId: string | null
  clickedAt: string
}

export const useFlowApi = () => {
  // ============================================================
  // FLOWS
  // ============================================================
  const createFlow = async (payload: { taskId: string; projectId: string; name: string }) => {
    const { data } = await api.post('/flows', payload)
    return data
  }

  const getFlows = async (taskId?: string) => {
    const url = taskId ? `/flows/task/${taskId}` : '/flows'
    const { data } = await api.get(url)
    return data
  }

  const getFlowById = async (id: string) => {
    const { data } = await api.get(`/flows/${id}`)
    return data
  }

  const updateFlow = async (id: string, payload: any) => {
    const { data } = await api.patch(`/flows/${id}`, payload)
    return data
  }

  const finishFlow = async (id: string) => {
    const { data } = await api.patch(`/flows/${id}/finish`)
    return data
  }

  const deleteFlow = async (id: string) => {
    await api.delete(`/flows/${id}`)
  }

  // ============================================================
  // FLOW CLICKS
  // ============================================================
  const createFlowClick = async (payload: {
    flowId: string
    orderIndex: number
    nodeId: string
    presentedNodeId?: string
  }) => {
    const { data } = await api.post('/flow-clicks', payload)
    return data
  }

  const getFlowClicks = async (flowId: string) => {
    const { data } = await api.get(`/flow-clicks/flow/${flowId}`)
    return data
  }

  const updateFlowClick = async (id: string, payload: any) => {
    const { data } = await api.put(`/flow-clicks/${id}`, payload)
    return data
  }

  const deleteFlowClick = async (id: string) => {
    await api.delete(`/flow-clicks/${id}`)
  }

  const deleteAllFlowClicks = async (flowId: string) => {
    const clicks = await getFlowClicks(flowId)
    for (const click of clicks) {
      await deleteFlowClick(click.clickId)
    }
  }

  return {
    // Flows
    createFlow,
    getFlows,
    getFlowById,
    updateFlow,
    finishFlow,
    deleteFlow,
    // Flow Clicks
    createFlowClick,
    getFlowClicks,
    updateFlowClick,
    deleteFlowClick,
    deleteAllFlowClicks,
  }
}