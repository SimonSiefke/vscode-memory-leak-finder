import * as GetNamedArrayCount from '../GetNamedArrayCount/GetNamedArrayCount.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

export const getNamedArrayCountForConnection = async (connectionId: number, objectGroup: string, id: number): Promise<any> => {
  const state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    throw new Error('no measure found')
  }
  return GetNamedArrayCount.getNamedArrayCount(state.rpc as any, objectGroup, id)
}
