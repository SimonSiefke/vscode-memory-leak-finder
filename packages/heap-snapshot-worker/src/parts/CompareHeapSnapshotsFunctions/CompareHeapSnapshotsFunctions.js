import { compareHeapSnapshotFunctionsInternal } from '../CompareHeapSnapshotsFunctionsInternal/CompareHeapSnapshotsFunctionsInternal.js'
import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.js'

const prepareFunctions = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {})
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

export const compareHeapSnapshotFunctions = async (pathA, pathB, useParallel = true) => {
  console.log(`[CompareHeapSnapshotFunctions] Starting comparison between:`)
  console.log(`  - Path A: ${pathA}`)
  console.log(`  - Path B: ${pathB}`)
  console.log(`  - Parallel processing: ${useParallel}`)

  console.time('parse')
  const startTime = performance.now()

  let resultA, resultB

  if (useParallel) {
    // Parse both snapshots in parallel for better performance
    console.log(`[CompareHeapSnapshotFunctions] Starting to parse snapshots in parallel...`)
    const resultAPromise = prepareFunctions(pathA)
    const resultBPromise = prepareFunctions(pathB)

    // Wait for both to complete
    resultA = await resultAPromise
    resultB = await resultBPromise
  } else {
    // Parse snapshots sequentially to reduce CPU usage
    console.log(`[CompareHeapSnapshotFunctions] Starting to parse snapshot A (sequential mode)...`)
    resultA = await prepareFunctions(pathA)

    console.log(`[CompareHeapSnapshotFunctions] Starting to parse snapshot B (sequential mode)...`)
    resultB = await prepareFunctions(pathB)
  }

  console.timeEnd('parse')
  const parseEndTime = performance.now()
  console.log(`[CompareHeapSnapshotFunctions] Both snapshots parsed in ${(parseEndTime - startTime).toFixed(2)}ms`)

  console.time('compare')
  const compareStartTime = performance.now()
  const result = compareHeapSnapshotFunctionsInternal(resultA, resultB, resultA.metaData.data.meta.location_fields)
  console.timeEnd('compare')
  const compareEndTime = performance.now()
  console.log(`[CompareHeapSnapshotFunctions] Comparison completed in ${(compareEndTime - compareStartTime).toFixed(2)}ms`)

  return result
}
