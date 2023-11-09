import * as DeduplicateDetachedDomNodes from '../DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.js'
import * as GetDomNodeHash from '../GetDomNodeHash/GetDomNodeHash.js'

const compareDetachedDomNode = (a, b) => {
  if (!a.description) {
    return b
  }
  if (!b.description) {
    return a
  }
  return a.description.localeCompare(b.description)
}

export const compareDetachedDomNodes = (before, after) => {
  const map = Object.create(null)
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
  deduplicated.sort(compareDetachedDomNode)
  return {
    leaked: deduplicated,
  }
}
