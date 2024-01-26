import * as PrettifyInstanceCounts from '../PrettifyInstanceCounts/PrettifyInstanceCounts.js'

const getKey = (element) => {
  return `${element.scriptId}:${element.lineNumber}:${element.columnNumber}`
}

export const compareInstanceCountsDifferenceWithSourceMap = async (before, after) => {
  const beforeMap = Object.create(null)
  for (const element of before) {
    const key = getKey(element)
    beforeMap[key] = element.count
  }
  const leaked = []
  for (const element of after) {
    const key = getKey(element)
    const beforeCount = beforeMap[key] || 0
    const afterCount = element.count
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        ...element,
        delta,
      })
    }
  }
  const prettyLeaked = await PrettifyInstanceCounts.prettifyInstanceCounts(leaked)
  return prettyLeaked
}
