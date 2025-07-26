import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.js'
import * as Hash from '../Hash/Hash.js'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.js'
import * as SourceMap from '../SourceMap/SourceMap.js'

export const getCleanPositionsMap = async (sourceMapUrlMap, classNames, hash) => {
  const cleanPositionMap = Object.create(null)
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
