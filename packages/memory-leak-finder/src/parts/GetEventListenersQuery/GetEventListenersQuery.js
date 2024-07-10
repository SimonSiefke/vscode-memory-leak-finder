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

export const getEventListenerQuery = (stack, scriptMap) => {
  const reverseScriptMap = Object.create(null)
  for (const value of Object.values(scriptMap)) {
    reverseScriptMap[value.url] = value.sourceMapUrl
  }
  const itemQueryStack = []
  let sourceMapUrl = ''
  for (const stackLine of stack) {
    const { prefix, url, line, column } = parseUrl(stackLine)
    sourceMapUrl ||= reverseScriptMap[url]
    const formattedUrl = FormatUrl.formatUrl(url, line - 1, column)
    const newStackLine = `${prefix}(${formattedUrl})`
    itemQueryStack.push(newStackLine)
  }
  return {
    stack: itemQueryStack,
    sourceMaps: [sourceMapUrl],
  }
}
