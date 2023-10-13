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

export const getSourceMapUrlMap = (eventListeners) => {
  const map = Object.create(null)
  for (const eventListener of eventListeners) {
    const { sourceMapUrl, line, column } = getSourceMapUrl(eventListener)
    map[sourceMapUrl] ||= []
    map[sourceMapUrl].push({ line, column })
  }
  return map
}
