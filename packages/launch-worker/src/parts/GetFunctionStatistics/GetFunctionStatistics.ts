import * as FunctionTrackerState from '../FunctionTrackerState/FunctionTrackerState.ts'

export const getFunctionStatistics = async (): Promise<Record<string, number>> => {
  const functionTrackerRpc = FunctionTrackerState.getFunctionTrackerRpc()
  if (!functionTrackerRpc) {
    return {}
  }
  try {
    const statistics = await functionTrackerRpc.invoke('FunctionTracker.getFunctionStatistics')
    return statistics || {}
  } catch (error) {
    console.error('Error getting function statistics:', error)
    return {}
  }
}
