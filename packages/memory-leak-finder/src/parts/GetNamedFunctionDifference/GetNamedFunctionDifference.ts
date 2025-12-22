import * as Assert from '../Assert/Assert.ts'
import * as CreateCountMap from '../CreateCountMap/CreateCountMap.ts'

export const getDifference = (sortedBefore, sortedAfter) => {
  Assert.array(sortedBefore)
  Assert.array(sortedAfter)
  const result: any[] = []
  const beforeMap = CreateCountMap.createCountMap(sortedBefore, 'url')
  for (const value of sortedAfter) {
    const beforeCount = beforeMap[value.url] || 0
    if (value.count <= beforeCount) {
      continue
    }
    result.push({
      beforeCount,
      count: value.count,
      name: value.name,
      sourceMapUrl: value.sourceMapUrl,
      url: value.url,
    })
  }
  return result
}
