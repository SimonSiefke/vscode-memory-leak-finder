import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

export const runCompletion = async (connectionId: number): Promise<unknown> => {
  const state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    throw new Error(`no measure found`)
  }
  const { measure, rpc } = state
  if (rpc && typeof rpc.connectionClosed === 'function' && rpc.connectionClosed()) {
    return { connectionClosed: true }
  }
  if (!measure.runCompletion) {
    return undefined
  }
  return measure.runCompletion()
}
