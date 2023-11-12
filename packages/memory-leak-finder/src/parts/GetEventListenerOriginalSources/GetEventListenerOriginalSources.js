import * as GetCleanPositionsMap from '../GetCleanPositionsMap/GetCleanPositionsMap.js'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.js'

const getCleanEventlisteners = (cleanPositionMap, eventListeners) => {
  const newEventListeners = []
  const indexMap = Object.create(null)
  for (const eventListener of eventListeners) {
    const { sourceMapUrl } = GetSourceMapUrl.getSourceMapUrl(eventListener)
    indexMap[sourceMapUrl] ||= 0
    const index = indexMap[sourceMapUrl]++
    const cleanPosition = cleanPositionMap[sourceMapUrl][index]
    if (cleanPosition) {
      const { sourceMaps, ...rest } = eventListener
      newEventListeners.push({
        ...rest,
        originalStack: [`${cleanPosition.source}:${cleanPosition.line}:${cleanPosition.column}`],
        originalName: cleanPosition.name,
      })
    } else {
      newEventListeners.push(eventListener)
    }
  }
  return newEventListeners
}

export const getEventListenerOriginalSources = async (eventListeners, sourceMapUrlMap, classNames) => {
  const cleanPositionMap = await GetCleanPositionsMap.getCleanPositionsMap(sourceMapUrlMap, classNames)
  const cleanEventListeners = getCleanEventlisteners(cleanPositionMap, eventListeners)
  return cleanEventListeners
}
