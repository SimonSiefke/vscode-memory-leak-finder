import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

export const releaseResources = async (connectionId: number): Promise<void> => {
  const state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    throw new Error('no measure found')
  }
  if (!state.rpc.connectionClosed?.()) {
    await state.measure.releaseResources()
  }
}
