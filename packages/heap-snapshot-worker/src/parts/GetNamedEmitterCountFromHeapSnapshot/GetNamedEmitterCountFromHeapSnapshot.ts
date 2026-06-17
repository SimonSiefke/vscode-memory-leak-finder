import * as Assert from '../Assert/Assert.ts'
import * as GetNamedConstructorCountFromHeapSnapshot from '../GetNamedConstructorCountFromHeapSnapshot/GetNamedConstructorCountFromHeapSnapshot.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'

<<<<<<< HEAD
export const getNamedEmitterCountFromHeapSnapshot = async (id: any) => {
=======
export const getNamedEmitterCountFromHeapSnapshot = async (id: number) => {
>>>>>>> origin/main
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  const constructorName = 'Emitter'
  const info = GetNamedConstructorCountFromHeapSnapshot.getNamedConstructorCountFromHeapSnapshot(heapsnapshot, constructorName)
  return info
}
