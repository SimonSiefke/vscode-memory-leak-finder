import * as CompareDetachedDomNode from '../CompareDetachedDomNode/CompareDetachedDomNode.js'
import * as DeduplicateDetachedDomNodes from '../DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.js'
import * as GetDomNodeKey from '../GetDomNodeKey/GetDomNodeKey.js'

export const compareDetachedDomNodes = (before, after) => {
  const map = Object.create(null)
  console.log({ before, after })
  for (const domNode of before) {
    const key = GetDomNodeKey.getDomNodeKey(domNode)
    map[key] ||= 0
    map[key]++
  }
  const leaked = []
  for (const domNode of after) {
    const key = GetDomNodeKey.getDomNodeKey(domNode)
    if (!map[key]) {
      const { objectId, ...rest } = domNode
      leaked.push(rest)
    } else {
      map[key]--
    }
  }
  const deduplicated = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(leaked)
  deduplicated.sort(CompareDetachedDomNode.compareDetachedDomNode)
  return {
    leaked: deduplicated,
  }
}
