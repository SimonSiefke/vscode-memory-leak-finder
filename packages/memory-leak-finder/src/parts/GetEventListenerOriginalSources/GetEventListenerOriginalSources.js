import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.js'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.js'
import * as SourceMap from '../SourceMap/SourceMap.js'

const RE_LINE_COLUMN = /(\d+):(\d+)/

const parseLineAndColumn = (line) => {
  const match = line.match(RE_LINE_COLUMN)
  if (!match) {
    return undefined
  }
  return {
    line: parseInt(match[1]),
    column: parseInt(match[2]),
  }
}

const emptySourceMapUrl = {
  sourceMapUrl: '',
  line: 0,
  column: 0,
}

const getSourceMapUrl = (eventListener) => {
  const { stack, sourceMaps } = eventListener
  if (!stack || !sourceMaps) {
    return emptySourceMapUrl
  }
  const firstStackLine = stack[0]
  const parsed = parseLineAndColumn(firstStackLine)
  if (!parsed) {
    return emptySourceMapUrl
  }
  const sourceMapUrl = sourceMaps[0]
  return {
    sourceMapUrl,
    line: parsed.line,
    column: parsed.column,
  }
}

const getSourceMapUrlMap = (eventListeners) => {
  const map = Object.create(null)
  for (const eventListener of eventListeners) {
    const { sourceMapUrl, line, column } = getSourceMapUrl(eventListener)
    map[sourceMapUrl] ||= []
    map[sourceMapUrl].push({ line, column })
  }
  return map
}

const getCleanPositionsMap = async (map) => {
  const cleanPositionMap = Object.create(null)
  for (const [key, value] of Object.entries(map)) {
    console.log({ key, value })
    const sourceMap = await LoadSourceMap.loadSourceMap(key)
    const originalPositions = await SourceMap.getOriginalPositions(sourceMap, value)
    console.log({ originalPositions })
    const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
    cleanPositionMap[key] = cleanPositions
  }
  return cleanPositionMap
}

const getCleanEventlisteners = (cleanPositionMap, eventListeners) => {
  const newEventListeners = []
  const indexMap = Object.create(null)
  for (const eventListener of eventListeners) {
    const { sourceMapUrl } = getSourceMapUrl(eventListener)
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
  const map = getSourceMapUrlMap(eventListeners)
  const cleanPositionMap = await getCleanPositionsMap(map)
  const cleanEventListeners = getCleanEventlisteners(cleanPositionMap, eventListeners)
  return cleanEventListeners
}
