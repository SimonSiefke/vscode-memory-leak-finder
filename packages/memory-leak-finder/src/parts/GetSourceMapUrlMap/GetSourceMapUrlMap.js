import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.js'

const getUniqueInputs = (inputs) => {
  const seen = Object.create(null)
  const result = []
  for (const input of inputs) {
    const { sourceMapUrl, line, column } = input
    const key = `${sourceMapUrl}:${line}:${column}`
    if (key in seen) {
      continue
    }
    seen[key] = true
    result.push(input)
  }
  return result
}

export const getSourceMapUrlMap = (eventListeners) => {
  const map = Object.create(null)
  const inputs = eventListeners.map(GetSourceMapUrl.getSourceMapUrl)
  const uniqueInputs = getUniqueInputs(inputs)
  for (const input of uniqueInputs) {
    const { sourceMapUrl, line, column } = input
    map[sourceMapUrl] ||= []
    map[sourceMapUrl].push(line, column)
  }
  return map
}
