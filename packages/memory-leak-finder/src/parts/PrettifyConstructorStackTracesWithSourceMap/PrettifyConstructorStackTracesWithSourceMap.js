import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as CompareInstance from '../CompareInstance/CompareInstance.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.js'

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

export const prettifyConstructorStackTracesWithSourceMap = async (constructorStackTraces, scriptMap) => {
  const first = constructorStackTraces[0]
  const reverseScriptMap = Object.create(null)
  for (const value of Object.values(scriptMap)) {
    reverseScriptMap[value.url] = value.sourceMapUrl
  }
  const eventListeners = first.map((stackLine, index) => {
    const { prefix, url, line, column } = parseUrl(stackLine)
    const sourceMapUrl = reverseScriptMap[url]
    const newStackLine = `${prefix}(${url}:${line - 1}:${column})`
    return {
      url,
      uuid: index,
      stack: [newStackLine],
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
