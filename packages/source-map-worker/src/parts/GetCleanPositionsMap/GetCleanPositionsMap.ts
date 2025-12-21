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
  const cleanPositionMap: CleanPositionMap = Object.create(null)
  for (const [key, value] of Object.entries(sourceMapUrlMap)) {
    if (!key) {
      cleanPositionMap[key] = []
      continue
    }
    const hash = Hash.hash(key)
    const sourceMap = await LoadSourceMap.loadSourceMap(key, hash)
    const originalPositions = await SourceMap.getOriginalPositions(sourceMap, value, classNames, hash)
    const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
    cleanPositionMap[key] = cleanPositions
  }
  return cleanPositionMap
}
