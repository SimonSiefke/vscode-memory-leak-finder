import * as Assert from '../Assert/Assert.ts'
import * as DeduplicateDetachedDomNodes from '../DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.ts'

type DetachedDomNode = {
  readonly description: string
  readonly count: number
  readonly [key: string]: unknown
}

const getDifference = (prettyBefore: readonly DetachedDomNode[], prettyAfter: readonly DetachedDomNode[]): readonly (DetachedDomNode & { beforeCount: number })[] => {
  const beforeMap: { readonly [description: string]: number } = Object.create(null)
  for (const element of prettyBefore) {
    beforeMap[element.description] = element.count
  }
  const result: (DetachedDomNode & { beforeCount: number })[] = []
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

export const compareDetachedDomNodesDifference = (before: readonly unknown[], after: readonly unknown[]): readonly (DetachedDomNode & { beforeCount: number })[] => {
  Assert.array(before)
  Assert.array(after)
  const prettyBefore = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(before)
  const prettyAfter = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(after)
  const difference = getDifference(prettyBefore, prettyAfter)
  return difference
}
