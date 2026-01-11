import * as FormatUrl from '../FormatUrl/FormatUrl.ts'

const RE_URL = /(.*)\((.*):(\d+):(\d+)\)/s

const parseUrl = (stackLine) => {
  const urlMatch = stackLine.match(RE_URL)
  if (!urlMatch) {
    return {
      column: 0,
      line: 0,
      url: '',
    }
  }
  return {
    column: Number.parseInt(urlMatch[4]),
    line: Number.parseInt(urlMatch[3]),
    prefix: urlMatch[1],
    url: urlMatch[2],
  }
}

export const getEventListenerQuery = (stacks, scriptMap) => {
  const reverseScriptMap = Object.create(null)
  for (const value of Object.values(scriptMap)) {
    const v: any = value as any
    reverseScriptMap[v.url] = v.sourceMapUrl
  }
  let originalIndex = 0
  const allQueries: any[] = []
  for (const stack of stacks) {
    originalIndex++
    for (const stackLine of stack) {
      originalIndex++
      const { column, line, prefix, url } = parseUrl(stackLine)
      const sourceMapUrl = reverseScriptMap[url]
      const formattedUrl = FormatUrl.formatUrl(url, line - 1, column)
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
