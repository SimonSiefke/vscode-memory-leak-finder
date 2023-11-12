import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.js'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.js'
import * as SourceMap from '../SourceMap/SourceMap.js'

export const getCleanPositionsMap = async (map, classNames) => {
  const cleanPositionMap = Object.create(null)
  for (const [key, value] of Object.entries(map)) {
    if (!key) {
      cleanPositionMap[key] = []
      continue
    }
    const sourceMap = await LoadSourceMap.loadSourceMap(key)
    const originalPositions = await SourceMap.getOriginalPositions(sourceMap, value, classNames)
    const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
    cleanPositionMap[key] = cleanPositions
  }
  return cleanPositionMap
}
