import * as PrettifyInstanceCountsWithSourceMap from '../PrettifyInstanceCountsWithSourceMap/PrettifyInstanceCountsWithSourceMap.ts'

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
        beforeCount,
      })
    }
  }
  const prettyLeaked = await PrettifyInstanceCountsWithSourceMap.prettifyInstanceCountsWithSourceMap(leaked)
  return prettyLeaked
}
