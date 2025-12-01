import * as CreateCountMap from '../CreateCountMap/CreateCountMap.ts'
import * as PrettifyInstanceCounts from '../PrettifyInstanceCounts/PrettifyInstanceCounts.ts'

export const compareInstanceCountsDifference = async (before, after) => {
  const beforeMap = CreateCountMap.createCountMap(before, 'name')
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
