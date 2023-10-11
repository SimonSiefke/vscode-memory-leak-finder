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

export const getEventListenerOriginalSource = async (eventListener) => {
  const { stack, sourceMaps } = eventListener
  if (!stack || !sourceMaps) {
    return undefined
  }
  const firstStackLine = stack[0]
  const parsed = parseLineAndColumn(firstStackLine)
  if (!parsed) {
    return undefined
  }
  const firstSourceMapUrl = sourceMaps[0]
  const sourceMap = await LoadSourceMap.loadSourceMap(firstSourceMapUrl)
  const originalPosition = await SourceMap.getOriginalPosition(sourceMap, parsed.line, parsed.column)
  const cleanPosition = GetCleanPosition.getCleanPosition(originalPosition)
  return cleanPosition
}
