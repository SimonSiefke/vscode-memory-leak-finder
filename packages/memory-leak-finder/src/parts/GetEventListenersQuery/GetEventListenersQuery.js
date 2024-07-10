import * as FormatUrl from '../FormatUrl/FormatUrl.js'

const RE_URL = /(.*)\((.*):(\d+):(\d+)\)/s

const parseUrl = (stackLine) => {
  const urlMatch = stackLine.match(RE_URL)
  if (!urlMatch) {
    return {
      url: '',
      line: 0,
      column: 0,
    }
  }
  return {
    prefix: urlMatch[1],
    url: urlMatch[2],
    line: Number.parseInt(urlMatch[3]),
    column: Number.parseInt(urlMatch[4]),
  }
}

export const getEventListenerQuery = (stacks, scriptMap) => {
  const reverseScriptMap = Object.create(null)
  for (const value of Object.values(scriptMap)) {
    reverseScriptMap[value.url] = value.sourceMapUrl
  }
  let originalIndex = 0
  const allQueries = []
  for (const stack of stacks) {
    originalIndex++
    for (const stackLine of stack) {
      originalIndex++
      const { prefix, url, line, column } = parseUrl(stackLine)
      const sourceMapUrl = reverseScriptMap[url]
      const formattedUrl = FormatUrl.formatUrl(url, line - 1, column)
      const newStackLine = `${prefix}(${formattedUrl})`
      allQueries.push({
        originalIndex,
        stack: [newStackLine],
        sourceMaps: [sourceMapUrl],
      })
    }
  }
  return allQueries
}
