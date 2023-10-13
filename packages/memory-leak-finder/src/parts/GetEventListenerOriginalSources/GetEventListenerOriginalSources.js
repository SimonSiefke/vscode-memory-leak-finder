import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.js'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.js'
import * as GetSourceMapUrlMap from '../GetSourceMapUrlMap/GetSourceMapUrlMap.js'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.js'
import * as SourceMap from '../SourceMap/SourceMap.js'

const getCleanPositionsMap = async (map) => {
  const cleanPositionMap = Object.create(null)
  for (const [key, value] of Object.entries(map)) {
    const sourceMap = await LoadSourceMap.loadSourceMap(key)
    const originalPositions = await SourceMap.getOriginalPositions(sourceMap, value)
    const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
    cleanPositionMap[key] = cleanPositions
  }
  return cleanPositionMap
}

const getCleanEventlisteners = (cleanPositionMap, eventListeners) => {
  const newEventListeners = []
  const indexMap = Object.create(null)
  for (const eventListener of eventListeners) {
    const { sourceMapUrl } = GetSourceMapUrl.getSourceMapUrl(eventListener)
    indexMap[sourceMapUrl] ||= 0
    const index = indexMap[sourceMapUrl]++
    const cleanPosition = cleanPositionMap[sourceMapUrl][index]
    if (cleanPosition) {
      newEventListeners.push({
        ...eventListener,
        originalStack: [`${cleanPosition.source}:${cleanPosition.line}:${cleanPosition.column}`],
      })
    } else {
      newEventListeners.push(eventListener)
    }
  }
  return newEventListeners
}

export const getEventListenerOriginalSources = async (eventListeners) => {
  const map = GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)
  const cleanPositionMap = await getCleanPositionsMap(map)
  const cleanEventListeners = getCleanEventlisteners(cleanPositionMap, eventListeners)
  return cleanEventListeners
}
