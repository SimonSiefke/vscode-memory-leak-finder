import * as GetHeapSnapshot from '../GetHeapSnapshot/GetHeapSnapshot.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

export const getHeapSnapshotForConnection = async (connectionId: number, id: number): Promise<string> => {
  const state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    throw new Error('no measure found')
  }
  return GetHeapSnapshot.getHeapSnapshot(state.rpc as any, id)
}