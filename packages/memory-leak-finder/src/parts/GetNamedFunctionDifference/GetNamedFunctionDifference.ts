import type { Dynamic } from '../Types/Types.ts'
import * as Assert from '../Assert/Assert.ts'
import * as CreateCountMap from '../CreateCountMap/CreateCountMap.ts'
export const getDifference = (sortedBefore: Dynamic, sortedAfter: Dynamic) => {
  Assert.array(sortedBefore)
  Assert.array(sortedAfter)
  const result: Dynamic[] = []
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
