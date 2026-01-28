import * as GetDomNodeHash from '../GetDomNodeHash/GetDomNodeHash.ts'

interface DomNode {
  className: string
  description: string
  [key: string]: any
}

interface NodeWithDelta extends DomNode {
  count: number
  delta: number
  beforeCount: number
  afterCount: number
}

interface Context {
  runs?: number
}

interface Result {
  after: NodeWithDelta[]
}

const compareNode = (a: NodeWithDelta, b: NodeWithDelta): number => {
  return b.delta - a.delta
}

export const compareDetachedDomNodesWithStackTraces = (before: DomNode[], after: DomNode[], context?: Context): Result => {
  const runs = context?.runs || 1

  // Create maps for before and after nodes by hash and count occurrences
  const beforeCountMap = new Map<string, number>()
  const afterCountMap = new Map<string, number>()
  const beforeNodeMap = new Map<string, DomNode>()

  // Process before nodes and count occurrences
  for (const node of before) {
    const hash = GetDomNodeHash.getDomNodeHash(node)
    beforeCountMap.set(hash, (beforeCountMap.get(hash) || 0) + 1)
    if (!beforeNodeMap.has(hash)) {
      beforeNodeMap.set(hash, node)
    }
  }

  // Process after nodes and count occurrences
  for (const node of after) {
    const hash = GetDomNodeHash.getDomNodeHash(node)
    afterCountMap.set(hash, (afterCountMap.get(hash) || 0) + 1)
  }

  // Calculate deltas for nodes that exist in after
  const afterWithDeltas: NodeWithDelta[] = []
  for (const [hash, afterCount] of afterCountMap) {
    const beforeCount = beforeCountMap.get(hash) || 0
    const delta = afterCount - beforeCount
    const node = beforeNodeMap.get(hash) || Array.from(after).find((n) => GetDomNodeHash.getDomNodeHash(n) === hash)

    // Only include nodes with delta >= runs
    if (delta >= runs && node) {
      afterWithDeltas.push({
        ...node,
        count: afterCount,
        delta,
        beforeCount,
        afterCount,
      })
    }
  }

  // Sort by delta descending
  const sorted = afterWithDeltas.toSorted(compareNode)

  return {
    after: sorted,
  }
}
