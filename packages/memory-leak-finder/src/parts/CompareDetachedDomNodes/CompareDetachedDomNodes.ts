import type { Dynamic } from '../Types/Types.ts'
import * as DeduplicateDetachedDomNodes from '../DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.ts'
export const compareDetachedDomNodes = (before: Dynamic, after: Dynamic) => {
  const prettyBefore = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(before)
  const prettyAfter = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(after)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
