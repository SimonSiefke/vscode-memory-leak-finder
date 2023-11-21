import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as CompareInstance from '../CompareInstance/CompareInstance.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.js'

const RE_URL = /\((.*):(\d+):(\d+)\)/

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
    url: urlMatch[1],
    line: parseInt(urlMatch[2]),
    column: parseInt(urlMatch[3]),
  }
}

export const prettifyConstructorStackTracesWithSourceMap = async (constructorStackTraces, scriptMap) => {
  const first = constructorStackTraces[0]
  const reverseScriptMap = Object.create(null)
  for (const value of Object.values(scriptMap)) {
    reverseScriptMap[value.url] = value.sourceMapUrl
  }
  const eventListeners = first.map((stackLine, index) => {
    const { url, line, column } = parseUrl(stackLine)
    const sourceMapUrl = reverseScriptMap[url]
    return {
      url,
      line,
      column,
      uuid: index,
      stack: [stackLine],
      sourceMaps: [sourceMapUrl],
    }
  })

  console.log({ eventListeners, scriptMap })
  const cleanPrettyInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(eventListeners, false)
  console.log({ cleanPrettyInstances })
  // return cleanPrettyInstances
  return {
    constructorStackTraces,
    eventListeners,
    cleanPrettyInstances,
  }
}
