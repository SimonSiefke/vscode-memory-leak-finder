import type { Dynamic } from '../Types/Types.ts'
import * as FormatUrl from '../FormatUrl/FormatUrl.ts'
const RE_URL = /(.*)\((.*):(\d+):(\d+)\)/s
const RE_BARE_URL = /(.*):(\d+):(\d+)$/
const parseUrl = (stackLine: Dynamic) => {
  const urlMatch = stackLine.match(RE_URL)
  if (urlMatch) {
    return {
      column: Number.parseInt(urlMatch[4]),
      line: Number.parseInt(urlMatch[3]),
      prefix: urlMatch[1],
      url: urlMatch[2],
    }
  }
  const bareUrlMatch = stackLine.match(RE_BARE_URL)
  if (bareUrlMatch) {
    return {
      column: Number.parseInt(bareUrlMatch[3]),
      line: Number.parseInt(bareUrlMatch[2]),
      prefix: '',
      url: bareUrlMatch[1],
    }
  }
  return {
    column: 0,
    line: 0,
    prefix: '',
    url: '',
  }
}

const getGeneratedLine = (prefix: Dynamic, line: Dynamic) => {
  // The synthetic listener frame comes from the Chrome DevTools Protocol and is
  // already zero-based. Browser stack frames are one-based.
  if (typeof prefix === 'string' && prefix.trim() === 'listener') {
    return line
  }
  return line - 1
}

export const getEventListenerQuery = (stacks: Dynamic, scriptMap: Dynamic) => {
  const reverseScriptMap = Object.create(null)
  for (const value of Object.values(scriptMap)) {
    const v: Dynamic = value as Dynamic
    reverseScriptMap[v.url] = v.sourceMapUrl
  }
  let originalIndex = 0
  const allQueries: Dynamic[] = []
  for (const stack of stacks) {
    originalIndex++
    for (const stackLine of stack) {
      originalIndex++
      const { column, line, prefix, url } = parseUrl(stackLine)
      const sourceMapUrl = reverseScriptMap[url]
      const formattedUrl = FormatUrl.formatUrl(url, getGeneratedLine(prefix, line), column)
      const newStackLine = `${prefix}(${formattedUrl})`
      allQueries.push({
        originalIndex,
        sourceMaps: [sourceMapUrl],
        stack: [newStackLine],
      })
    }
  }
  return allQueries
}
