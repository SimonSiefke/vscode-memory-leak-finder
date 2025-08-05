import * as Assert from '../Assert/Assert.js'
import { getArraysByClosureLocationFromHeapSnapshot } from '../GetArraysByClosureLocationFromHeapSnapshot/GetArraysByClosureLocationFromHeapSnapshot.js'

export const getArraysByClosureLocationFromHeapSnapshotCommand = async (id, scriptMap) => {
  Assert.string(id)
  Assert.object(scriptMap)
  const result = await getArraysByClosureLocationFromHeapSnapshot(id, scriptMap)
  return result
}
