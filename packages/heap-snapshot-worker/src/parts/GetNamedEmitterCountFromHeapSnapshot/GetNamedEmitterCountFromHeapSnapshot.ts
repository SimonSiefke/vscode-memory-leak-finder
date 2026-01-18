import * as Assert from '../Assert/Assert.ts'
import * as GetNamedConstructorCountFromHeapSnapshot from '../GetNamedConstructorCountFromHeapSnapshot/GetNamedConstructorCountFromHeapSnapshot.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'

export const getNamedEmitterCountFromHeapSnapshot = async (id: any) => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  const constructorName = 'Emitter'
  const info = GetNamedConstructorCountFromHeapSnapshot.getNamedConstructorCountFromHeapSnapshot(heapsnapshot, constructorName)
  return info
}
