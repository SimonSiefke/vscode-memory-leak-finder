import * as DeduplicateDetachedDomNodes from '../DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.js'

export const compareDetachedDomNodes = (before, after) => {
  const prettyBefore = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(before)
  const prettyAfter = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(after)
  return {
    before: prettyBefore,
    after: prettyAfter,
  }
}
