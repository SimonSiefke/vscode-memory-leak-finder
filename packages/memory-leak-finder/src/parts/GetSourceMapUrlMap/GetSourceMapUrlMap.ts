import * as FormatUrl from '../FormatUrl/FormatUrl.ts'
import * as GetSourceMapUrl from '../GetSourceMapUrl/GetSourceMapUrl.ts'

const getUniqueInputs = (inputs) => {
  const seen = Object.create(null)
  const result: any[] = []
  for (const input of inputs) {
    const { column, line, sourceMapUrl } = input
    const key = FormatUrl.formatUrl(sourceMapUrl, line, column)
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
    const { column, line, sourceMapUrl } = input
    map[sourceMapUrl] ||= []
    map[sourceMapUrl].push(line, column)
  }
  return map
}
