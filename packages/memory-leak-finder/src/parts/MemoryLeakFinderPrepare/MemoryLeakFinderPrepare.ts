import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

export const prepare = async (connectionId: number): Promise<boolean | { connectionClosed: true }> => {
  const state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    throw new Error('no measure found')
  }
  if (state.rpc.connectionClosed?.()) {
    return { connectionClosed: true }
  }
  return (await state.measure.prepare?.()) || false
}
