import { compareHeapSnapshotFunctionsInternal } from '../CompareHeapSnapshotsFunctionsInternal/CompareHeapSnapshotsFunctionsInternal.js'
import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.js'

const prepareFunctions = async (path) => {
  const snapshot = await prepareHeapSnapshot(path)
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(
    snapshot.metaData.data.meta.location_fields,
  )
  const map = getUniqueLocationMap(snapshot.locations, itemsPerLocation, scriptIdOffset, lineOffset, columnOffset)
  return {
    locations: snapshot.locations,
    metaData: snapshot.metaData,
    map,
  }
}

export const compareHeapSnapshotFunctions = async (pathA, pathB) => {
  // TODO parsing could be done in parallel using worker threads and transfering the result buffers
  console.time('parse')
  const resultA = await prepareFunctions(pathA)
  const resultB = await prepareFunctions(pathB)
  console.timeEnd('parse')
  console.time('compare')
  const result = compareHeapSnapshotFunctionsInternal(resultA, resultB, resultA.metaData.data.meta.location_fields)
  console.timeEnd('compare')
  return result
}
