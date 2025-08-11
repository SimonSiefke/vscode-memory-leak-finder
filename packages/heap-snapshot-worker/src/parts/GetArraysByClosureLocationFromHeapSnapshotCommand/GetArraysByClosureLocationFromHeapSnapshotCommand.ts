import * as Assert from '../Assert/Assert.ts'
import { getArraysByClosureLocationFromHeapSnapshot } from '../GetArraysByClosureLocationFromHeapSnapshot/GetArraysByClosureLocationFromHeapSnapshot.ts'

export const getArraysByClosureLocationFromHeapSnapshotCommand = async (id, scriptMap) => {
  Assert.string(id)
  Assert.object(scriptMap)
  const result = await getArraysByClosureLocationFromHeapSnapshot(id, scriptMap)
  return result
}
