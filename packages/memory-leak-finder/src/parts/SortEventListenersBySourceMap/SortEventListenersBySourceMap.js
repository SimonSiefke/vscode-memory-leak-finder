import * as Arrays from '../Arrays/Arrays.js'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.js'

const compareEventListener = (a, b) => {
  const sourceA = GetSourceMapUrl.getSourceMapUrl(a)
  const sourceB = GetSourceMapUrl.getSourceMapUrl(b)
  return sourceA.sourceMapUrl.localeCompare(sourceB.sourceMapUrl) || sourceB.line - sourceA.line || sourceB.column - sourceA.column
}

export const sortEventListenersBySourceMap = (eventListeners) => {
  return Arrays.toSorted(eventListeners, compareEventListener)
}
