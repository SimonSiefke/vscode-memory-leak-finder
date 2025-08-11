import * as Assert from '../Assert/Assert.js'
import * as CreateCountMap from '../CreateCountMap/CreateCountMap.js'

export const getDifference = (sortedBefore, sortedAfter) => {
  Assert.array(sortedBefore)
  Assert.array(sortedAfter)
  const result = []
  const beforeMap = CreateCountMap.createCountMap(sortedBefore, 'url')
  for (const value of sortedAfter) {
    const beforeCount = beforeMap[value.url] || 0
    if (value.count <= beforeCount) {
      continue
    }
    result.push({
      name: value.name,
      count: value.count,
      beforeCount,
      url: value.url,
      sourceMapUrl: value.sourceMapUrl,
    })
  }
  return result
}
