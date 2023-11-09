import * as GetCleanPositionsMap from '../GetCleanPositionsMap/GetCleanPositionsMap.js'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.js'
import * as GetSourceMapUrlMap from '../GetSourceMapUrlMap/GetSourceMapUrlMap.js'

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
  const cleanPositionMap = await GetCleanPositionsMap.getCleanPositionsMap(map)
  const cleanEventListeners = getCleanEventlisteners(cleanPositionMap, eventListeners)
  return cleanEventListeners
}
