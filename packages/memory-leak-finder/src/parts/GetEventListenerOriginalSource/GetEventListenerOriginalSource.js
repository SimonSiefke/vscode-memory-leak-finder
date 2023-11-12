import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.js'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.js'
import * as ParseLineAndColumn from '../ParseLineAndColumn/ParseLineAndColumn.js'
import * as SourceMap from '../SourceMap/SourceMap.js'

export const getEventListenerOriginalSource = async (eventListener) => {
  const { stack, sourceMaps } = eventListener
  if (!stack || !sourceMaps) {
    return undefined
  }
  const firstStackLine = stack[0]
  const parsed = ParseLineAndColumn.parseLineAndColumn(firstStackLine)
  if (!parsed) {
    return undefined
  }
  const firstSourceMapUrl = sourceMaps[0]
  const sourceMap = await LoadSourceMap.loadSourceMap(firstSourceMapUrl)
  const originalPosition = await SourceMap.getOriginalPosition(sourceMap, parsed.line, parsed.column)
  const cleanPosition = GetCleanPosition.getCleanPosition(originalPosition)
  return cleanPosition
}
