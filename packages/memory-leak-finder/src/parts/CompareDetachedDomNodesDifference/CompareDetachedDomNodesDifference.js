import * as DeduplicateDetachedDomNodes from '../DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.js'
import * as Assert from '../Assert/Assert.js'

const getDifference = (prettyBefore, prettyAfter) => {
  const beforeMap = Object.create(null)
  for (const element of prettyBefore) {
    beforeMap[element.description] = element.count
  }
  const result = []
  for (const element of prettyAfter) {
    const beforeCount = beforeMap[element.description] || 0
    if (element.count >= beforeCount) {
      result.push({
        ...element,
        beforeCount,
      })
    }
  }
  return result
}

export const compareDetachedDomNodesDifference = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const prettyBefore = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(before)
  const prettyAfter = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(after)
  const difference = getDifference(prettyBefore, prettyAfter)
  return difference
}
