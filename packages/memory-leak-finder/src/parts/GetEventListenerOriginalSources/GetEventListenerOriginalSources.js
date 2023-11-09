import * as GetCleanPositionsMap from '../GetCleanPositionsMap/GetCleanPositionsMap.js'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.js'
import * as GetSourceMapUrlMap from '../GetSourceMapUrlMap/GetSourceMapUrlMap.js'

const getChunkItemOriginalStack = (cleanPosition) => {
  return `${cleanPosition.source}:${cleanPosition.line}:${cleanPosition.column}`
}

const getChunkOriginalStack = (cleanPositions) => {
  return cleanPositions.map(getChunkItemOriginalStack)
}

const getCleanEventlisteners = (cleanPositionMap, eventListeners) => {
  const newEventListeners = []
  const indexMap = Object.create(null)
  for (const eventListener of eventListeners) {
    const { sourceMapUrl } = GetSourceMapUrl.getSourceMapUrl(eventListener)
    indexMap[sourceMapUrl] ||= 0
    const stackLength = eventListener.stack.length
    const startIndex = indexMap[sourceMapUrl]
    const endIndex = startIndex + stackLength
    indexMap[sourceMapUrl] = endIndex
    const chunk = cleanPositionMap[sourceMapUrl].slice(startIndex, endIndex)
    if (chunk.length > 0) {
      newEventListeners.push({
        ...eventListener,
        originalStack: getChunkOriginalStack(chunk),
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
