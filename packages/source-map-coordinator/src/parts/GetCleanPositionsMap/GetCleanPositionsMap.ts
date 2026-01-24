import { cleanSourceMapUrlMap } from '../CleanSourceMapUrlMap/CleanSourceMapUrlMap.ts'
import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.ts'
import * as Hash from '../Hash/Hash.ts'
import { launchSourceMapWorker } from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.ts'

interface SourceMapUrlMap {
  [key: string]: number[]
}

interface CleanPositionMap {
  [key: string]: any[]
}

export const getCleanPositionsMap = async (sourceMapUrlMap: SourceMapUrlMap, classNames: boolean): Promise<CleanPositionMap> => {
  const platform = process.platform
  console.log({ sourceMapUrlMap })
  const cleanedSourceMapUrlMap = await cleanSourceMapUrlMap(sourceMapUrlMap, platform)
  console.log({ cleanedSourceMapUrlMap })
  await using sourceMapWorker = await launchSourceMapWorker()
  const cleanPositionMap: CleanPositionMap = Object.create(null)
  for (const [key, value] of Object.entries(cleanedSourceMapUrlMap)) {
    if (!key) {
      cleanPositionMap[key] = []
      continue
    }
    const hash = Hash.hash(key)
    const sourceMap = await LoadSourceMap.loadSourceMap(key, hash)
    const originalPositions = await sourceMapWorker.invoke('SourceMap.getCleanPositionsMap2', sourceMap, value, classNames, hash, key)
    const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
    cleanPositionMap[key] = cleanPositions
  }
  return cleanPositionMap
}
