import * as CompareDetachedDomNode from '../CompareDetachedDomNode/CompareDetachedDomNode.js'
import * as DeduplicateDetachedDomNodes from '../DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.js'
import * as GetDomNodeHash from '../GetDomNodeHash/GetDomNodeHash.js'

export const compareDetachedDomNodes = (before, after) => {
  const map = Object.create(null)
  console.log({ before, after })
  for (const domNode of before) {
    const key = GetDomNodeHash.getDomNodeHash(domNode)
    map[key] ||= 0
    map[key]++
  }
  const leaked = []
  for (const domNode of after) {
    const key = GetDomNodeHash.getDomNodeHash(domNode)
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
