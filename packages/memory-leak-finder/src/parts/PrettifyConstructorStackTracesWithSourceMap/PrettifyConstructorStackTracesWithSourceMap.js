import * as Arrays from '../Arrays/Arrays.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

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
    line: parseInt(urlMatch[3]),
    column: parseInt(urlMatch[4]),
  }
}

const compareInstance = (a, b) => {
  return b.originalIndex - a.originalIndex || b.uuid - a.uuid
}

const getLine = (instance) => {
  return instance.originalStack[0]
}

const getEventListenerQuery = (stackLines, scriptMap, index) => {
  const reverseScriptMap = Object.create(null)
  for (const value of Object.values(scriptMap)) {
    reverseScriptMap[value.url] = value.sourceMapUrl
  }
  const eventListeners = stackLines.map((stackLine, index) => {
    const { prefix, url, line, column } = parseUrl(stackLine)
    const sourceMapUrl = reverseScriptMap[url]
    const newStackLine = `${prefix}(${url}:${line - 1}:${column})`
    return {
      url,
      originalIndex: index,
      uuid: index,
      stack: [newStackLine],
      sourceMaps: [sourceMapUrl],
    }
  })
  return eventListeners
}

const sortOriginal = (cleanInstances) => {
  const cleaned = []
  const sorted = Arrays.toSorted(cleanInstances)
  let current = []
  let currentIndex = -1
  for (const value of sorted) {
    if (value.originalIndex > currentIndex) {
      currentIndex = value.originalIndex
      current = []
      cleaned.push(current)
    }
    const originalStack = value.originalStack || []
    current.push(originalStack[0])
  }
  return cleaned
}

export const prettifyConstructorStackTracesWithSourceMap = async (constructorStackTraces, scriptMap) => {
  const fullQuery = []
  for (let i = 0; i < constructorStackTraces.length; i++) {
    const stackTrace = constructorStackTraces[i]
    const eventListeners = getEventListenerQuery(stackTrace, scriptMap, i)
    fullQuery.push(...eventListeners)
  }
  const cleanPrettyInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
  const sorted = sortOriginal(cleanPrettyInstances)
  return sorted
}
