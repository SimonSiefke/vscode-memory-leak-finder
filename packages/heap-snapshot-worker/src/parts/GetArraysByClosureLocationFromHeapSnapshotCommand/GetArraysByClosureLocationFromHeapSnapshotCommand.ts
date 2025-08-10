import * as Assert from '../Assert/Assert.js'
import { getArraysByClosureLocationFromHeapSnapshot } from '../GetArraysByClosureLocationFromHeapSnapshot/GetArraysByClosureLocationFromHeapSnapshot.js'

export const getArraysByClosureLocationFromHeapSnapshotCommand = async (id: string, scriptMap: any): Promise<any> => {
  Assert.string(id)
  Assert.object(scriptMap)
  const result = await getArraysByClosureLocationFromHeapSnapshot(id, scriptMap)
  return result
}
