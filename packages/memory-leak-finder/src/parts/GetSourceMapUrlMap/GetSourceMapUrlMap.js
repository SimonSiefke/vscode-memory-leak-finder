import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.js'

export const getSourceMapUrlMap = (eventListeners) => {
  const map = Object.create(null)
  for (const eventListener of eventListeners) {
    const { sourceMapUrl, line, column } = GetSourceMapUrl.getSourceMapUrl(eventListener)
    map[sourceMapUrl] ||= []
    map[sourceMapUrl].push({ line, column })
  }
  return map
}
