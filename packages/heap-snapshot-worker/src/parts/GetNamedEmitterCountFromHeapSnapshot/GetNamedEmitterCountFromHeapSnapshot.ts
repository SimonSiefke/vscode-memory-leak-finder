import * as Assert from '../Assert/Assert.js'
import * as GetNamedConstructorCountFromHeapSnapshot from '../GetNamedConstructorCountFromHeapSnapshot/GetNamedConstructorCountFromHeapSnapshot.js'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'

export const getNamedEmitterCountFromHeapSnapshot = async (id) => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  const constructorName = 'Emitter'
  const info = GetNamedConstructorCountFromHeapSnapshot.getNamedConstructorCountFromHeapSnapshot(heapsnapshot, constructorName)
  return info
}
