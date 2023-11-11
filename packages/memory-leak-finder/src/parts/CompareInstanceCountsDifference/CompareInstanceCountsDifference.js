import * as PrettifyInstanceCounts from '../PrettifyInstanceCounts/PrettifyInstanceCounts.js'

export const compareInstanceCountsDifference = async (before, after) => {
  const beforeMap = Object.create(null)
  for (const element of before) {
    beforeMap[element.name] = element.count
  }
  const leaked = []
  for (const element of after) {
    const beforeCount = beforeMap[element.name] || 0
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
