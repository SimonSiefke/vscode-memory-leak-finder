import * as Assert from '../Assert/Assert.js'

export const getDifference = (sortedBefore, sortedAfter) => {
  Assert.array(sortedBefore)
  Assert.array(sortedAfter)
  const result = []
  const beforeMap = Object.create(null)
  for (const value of sortedBefore) {
    beforeMap[value.url] = value.count
  }
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
