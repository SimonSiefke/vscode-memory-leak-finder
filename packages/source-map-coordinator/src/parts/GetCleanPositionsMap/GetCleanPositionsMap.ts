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

const getUnresolvedPositions = (positions: readonly number[]): any[] => {
  return new Array(positions.length / 2).fill(undefined)
}

export const getCleanPositionsMap = async (sourceMapUrlMap: SourceMapUrlMap, classNames: boolean): Promise<CleanPositionMap> => {
  await using sourceMapWorker = await launchSourceMapWorker()
  const cleanPositionMap: CleanPositionMap = Object.create(null)
  for (const [key, value] of Object.entries(sourceMapUrlMap)) {
    if (!key) {
      cleanPositionMap[key] = []
      continue
    }
    try {
      const hash = Hash.hash(key)
      const sourceMap = await LoadSourceMap.loadSourceMap(key, hash)
      const originalPositions = await sourceMapWorker.invoke('SourceMap.getCleanPositionsMap2', sourceMap, value, classNames, hash, key)
      const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
      cleanPositionMap[key] = cleanPositions
    } catch (error) {
      console.warn(`Failed to resolve source map ${key}`, error)
      cleanPositionMap[key] = getUnresolvedPositions(value)
    }
  }
  return cleanPositionMap
}
