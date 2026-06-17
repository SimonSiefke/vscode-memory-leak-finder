import * as DeduplicateDetachedDomNodes from '../DeduplicateDetachedDomNodes/DeduplicateDetachedDomNodes.ts'

type DetachedDomNode = {
  readonly description: string
  readonly count: number
  readonly [key: string]: unknown
}

export const compareDetachedDomNodes = (before: readonly unknown[], after: readonly unknown[]): { after: readonly DetachedDomNode[]; before: readonly DetachedDomNode[] } => {
  const prettyBefore = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(before as readonly Record<string, unknown>[])
  const prettyAfter = DeduplicateDetachedDomNodes.deduplicatedDetachedDomNodes(after as readonly Record<string, unknown>[])
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
