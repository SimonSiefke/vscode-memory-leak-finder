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
  results: [],
}

const getSourceMapUrls = (eventListener) => {
  console.log(eventListener)
  const { stack, sourceMaps } = eventListener
  if (!stack || !sourceMaps) {
    return emptySourceMapUrl
  }
  const sourceMapUrl = sourceMaps[0]
  const results = []
  for (const stackLine of stack) {
    const parsed = parseLineAndColumn(stackLine)
    if (!parsed) {
      continue
    }
    results.push({
      line: parsed.line,
      column: parsed.column,
    })
  }
  return {
    sourceMapUrl,
    results,
  }
}

export const getSourceMapUrlMap = (eventListeners) => {
  const map = Object.create(null)
  for (const eventListener of eventListeners) {
    const { sourceMapUrl, results } = getSourceMapUrls(eventListener)
    map[sourceMapUrl] ||= []
    map[sourceMapUrl].push(...results)
  }
  return map
}
