import * as Assert from '../Assert/Assert.js'
import * as GetNamedConstructorCountFromHeapSnapshot from '../GetNamedConstructorCountFromHeapSnapshot/GetNamedConstructorCountFromHeapSnapshot.js'

export const getNamedEmitterCountFromHeapSnapshot = async (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const constructorName = 'Emitter'
  const info = GetNamedConstructorCountFromHeapSnapshot.getNamedConstructorCountFromHeapSnapshot(heapsnapshot, constructorName)
  return info
}
