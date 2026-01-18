import * as CompareDetachedDomNodes from '../CompareDetachedDomNodes/CompareDetachedDomNodes.ts'

type DetachedDomNode = {
  readonly description: string
  readonly count: number
  readonly [key: string]: unknown
}

export const compareDetachedDomNodesWithStackTraces = (before: readonly unknown[], after: readonly unknown[]): { after: readonly DetachedDomNode[]; before: readonly DetachedDomNode[] } => {
  const result = CompareDetachedDomNodes.compareDetachedDomNodes(before, after)
  return {
    after: result.after,
    before: result.before,
  }
}
