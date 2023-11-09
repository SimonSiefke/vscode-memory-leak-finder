import * as CompareDetachedDomNode from '../CompareDetachedDomNode/CompareDetachedDomNode.js'
import * as CompareMapLeak from '../CompareMapLeak/CompareMapLeak.js'
import * as DeduplicateDetachedDomNodes from '../DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.js'
import * as GetDomNodeHash from '../GetDomNodeHash/GetDomNodeHash.js'

export const compareDetachedDomNodes = (before, after) => {
  const leaked = CompareMapLeak.compareMapLeak(before, after, GetDomNodeHash.getDomNodeHash)
  const deduplicated = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(leaked)
  deduplicated.sort(CompareDetachedDomNode.compareDetachedDomNode)
  return {
    leaked: deduplicated,
  }
}
