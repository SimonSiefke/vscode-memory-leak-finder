import * as ParseLineAndColumn from '../ParseLineAndColumn/ParseLineAndColumn.js'

const emptySourceMapUrl = {
  sourceMapUrl: '',
  line: 0,
  column: 0,
}

export const getSourceMapUrl = (eventListener) => {
  const { stack, sourceMaps } = eventListener
  if (!stack || !sourceMaps) {
    return emptySourceMapUrl
  }
  const firstStackLine = stack[0]
  const parsed = ParseLineAndColumn.parseLineAndColumn(firstStackLine)
  if (!parsed) {
    return emptySourceMapUrl
  }
  const sourceMapUrl = sourceMaps[0] || ''
  return {
    sourceMapUrl,
    line: parsed.line,
    column: parsed.column,
  }
}
