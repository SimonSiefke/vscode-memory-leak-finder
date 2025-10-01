import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.ts'
import * as Hash from '../Hash/Hash.ts'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.ts'
import * as SourceMap from '../SourceMap/SourceMap.ts'

interface SourceMapUrlMap {
  [key: string]: number[]
}

interface CleanPositionMap {
  [key: string]: any[]
}

export const getCleanPositionsMap = async (
  sourceMapUrlMap: SourceMapUrlMap,
  classNames: boolean,
  hash: string,
): Promise<CleanPositionMap> => {
  console.log(`[SourceMapWorker] getCleanPositionsMap called with ${Object.keys(sourceMapUrlMap).length} source maps, classNames: ${classNames}`)
  const startTime = performance.now()

  const cleanPositionMap: CleanPositionMap = Object.create(null)
  for (const [key, value] of Object.entries(sourceMapUrlMap)) {
    console.log(`[SourceMapWorker] Processing source map: ${key} with ${value.length} positions`)
    const mapStartTime = performance.now()

    if (!key) {
      cleanPositionMap[key] = []
      continue
    }
    const hash = Hash.hash(key)

    console.log(`[SourceMapWorker] Loading source map for ${key}`)
    const loadTime = performance.now()
    const sourceMap = await LoadSourceMap.loadSourceMap(key, hash)
    console.log(`[SourceMapWorker] Source map loaded in ${(performance.now() - loadTime).toFixed(2)}ms`)

    console.log(`[SourceMapWorker] Getting original positions for ${key}`)
    const positionsTime = performance.now()
    const originalPositions = await SourceMap.getOriginalPositions(sourceMap, value, classNames, hash)
    console.log(`[SourceMapWorker] Original positions retrieved in ${(performance.now() - positionsTime).toFixed(2)}ms`)

    console.log(`[SourceMapWorker] Cleaning positions for ${key}`)
    const cleanTime = performance.now()
    const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
    console.log(`[SourceMapWorker] Positions cleaned in ${(performance.now() - cleanTime).toFixed(2)}ms`)

    cleanPositionMap[key] = cleanPositions
    console.log(`[SourceMapWorker] Completed processing ${key} in ${(performance.now() - mapStartTime).toFixed(2)}ms`)
  }

  const totalTime = performance.now() - startTime
  console.log(`[SourceMapWorker] getCleanPositionsMap completed in ${totalTime.toFixed(2)}ms`)
  return cleanPositionMap
}
