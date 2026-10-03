import type { Dynamic } from '../Types/Types.ts'
import * as Assert from '../Assert/Assert.ts'
import * as DeduplicateDetachedDomNodes from '../DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.ts'
const getDifference = (prettyBefore: Dynamic, prettyAfter: Dynamic) => {
  const beforeMap = Object.create(null)
  for (const element of prettyBefore) {
    beforeMap[element.description] = element.count
  }
  const result: Dynamic[] = []
  for (const element of prettyAfter) {
    const beforeCount = beforeMap[element.description] || 0
    if (element.count > beforeCount) {
      result.push({
        ...element,
        beforeCount,
      })
    }
  }
  return result
}
export const compareDetachedDomNodesDifference = (before: Dynamic, after: Dynamic) => {
  Assert.array(before)
  Assert.array(after)
  const prettyBefore = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(before)
  const prettyAfter = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(after)
  const difference = getDifference(prettyBefore, prettyAfter)
  return difference
}
