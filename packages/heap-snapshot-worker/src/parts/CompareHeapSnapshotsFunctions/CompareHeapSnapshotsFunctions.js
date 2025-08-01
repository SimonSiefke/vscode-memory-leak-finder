import { compareHeapSnapshotFunctionsInternal } from '../CompareHeapSnapshotsFunctionsInternal/CompareHeapSnapshotsFunctionsInternal.js'
import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

const prepareFunctions = async (path) => {
  const snapshot = await prepareHeapSnapshot(path)
  const map = getUniqueLocationMap(snapshot.locations)
  return {
    locations: snapshot.locations,
    map,
  }
}

export const compareHeapSnapshotFunctions = async (pathA, pathB) => {
  // TODO parsing could be done in parallal
  const resultA = await prepareFunctions(pathA)
  const resultB = await prepareFunctions(pathB)
  const result = compareHeapSnapshotFunctionsInternal(resultA, resultB)
  return result
}
