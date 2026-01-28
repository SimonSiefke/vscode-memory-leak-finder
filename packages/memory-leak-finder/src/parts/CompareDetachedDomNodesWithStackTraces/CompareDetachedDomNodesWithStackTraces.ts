import * as GetDomNodeHash from '../GetDomNodeHash/GetDomNodeHash.ts'

interface DomNode {
  readonly className: string
  readonly description: string
  readonly [key: string]: any
}

interface NodeWithDelta extends DomNode {
  readonly count: number
  readonly delta: number
  readonly beforeCount: number
  readonly afterCount: number
}

interface Context {
  readonly runs?: number
}

const compareNode = (a: NodeWithDelta, b: NodeWithDelta): number => {
  return b.delta - a.delta
}

const getBeforeCountMap = (before: DomNode[]): Record<string, number> => {
  const beforeCountMap: Record<string, number> = Object.create(null)
  for (const node of before) {
    const hash = GetDomNodeHash.getDomNodeHash(node)
    beforeCountMap[hash] = (beforeCountMap[hash] || 0) + 1
  }
  return beforeCountMap
}

const getAfterCountMap = (after: DomNode[]): Record<string, number> => {
  const afterCountMap: Record<string, number> = Object.create(null)
  for (const node of after) {
    const hash = GetDomNodeHash.getDomNodeHash(node)
    afterCountMap[hash] = (afterCountMap[hash] || 0) + 1
  }
  return afterCountMap
}

const getBeforeNodeMap = (before: DomNode[]): Record<string, DomNode> => {
  const beforeNodeMap: Record<string, DomNode> = Object.create(null)
  for (const node of before) {
    const hash = GetDomNodeHash.getDomNodeHash(node)
    if (!(hash in beforeNodeMap)) {
      beforeNodeMap[hash] = node
    }
  }
  return beforeNodeMap
}

export const compareDetachedDomNodesWithStackTraces = (
  before: DomNode[],
  after: DomNode[],
  context?: Context,
): readonly NodeWithDelta[] => {
  const runs = context?.runs || 1

  // Create maps for before and after nodes by hash and count occurrences
  const beforeCountMap = getBeforeCountMap(before)
  const afterCountMap = getAfterCountMap(after)
  const beforeNodeMap = getBeforeNodeMap(before)

  // Calculate deltas for nodes that exist in after
  const afterWithDeltas: NodeWithDelta[] = []
  for (const hash in afterCountMap) {
    const afterCount = afterCountMap[hash]
    const beforeCount = beforeCountMap[hash] || 0
    const delta = afterCount - beforeCount
    const node = beforeNodeMap[hash] || Array.from(after).find((n) => GetDomNodeHash.getDomNodeHash(n) === hash)

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

  return sorted
}
