import * as GetDomNodeHash from '../GetDomNodeHash/GetDomNodeHash.ts'

interface DomNode {
  readonly type: string
  readonly subtype: string
  readonly className: string
  readonly description: string
  readonly objectId: string
  readonly stackTrace: string[]
  readonly originalStack: string[]
  readonly sourcesHash: string | null
  readonly count?: number
  readonly delta?: number
  readonly beforeCount?: number
  readonly afterCount?: number
  readonly [key: string]: any
}

interface NodeWithDelta extends DomNode {
  readonly count: number
  readonly delta: number
  readonly beforeCount: number
  readonly afterCount: number
}

interface FormattedNodeWithDelta {
  readonly className: string
  readonly description: string
  readonly stackTrace: string[]
  readonly originalStack: string[]
  readonly sourcesHash: string | null
  readonly count: number
  readonly delta: number
  readonly [key: string]: any
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

const getNodesWithDeltas = (
  afterCountMap: Record<string, number>,
  beforeCountMap: Record<string, number>,
  beforeNodeMap: Record<string, DomNode>,
  after: DomNode[],
  runs: number,
): NodeWithDelta[] => {
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
  return afterWithDeltas
}

const formatOutput = (nodes: NodeWithDelta[]): FormattedNodeWithDelta[] => {
  return nodes.map(({ type, subtype, objectId, beforeCount, afterCount, ...rest }) => rest as FormattedNodeWithDelta)
}

export const compareDetachedDomNodesWithStackTraces = (before: DomNode[], after: DomNode[], context?: Context): readonly FormattedNodeWithDelta[] => {
  const runs = context?.runs || 1

  // Create maps for before and after nodes by hash and count occurrences
  const beforeCountMap = getBeforeCountMap(before)
  const afterCountMap = getAfterCountMap(after)
  const beforeNodeMap = getBeforeNodeMap(before)

  // Calculate deltas for nodes that exist in after
  const afterWithDeltas = getNodesWithDeltas(afterCountMap, beforeCountMap, beforeNodeMap, after, runs)

  // Sort by delta descending
  const sorted = afterWithDeltas.toSorted(compareNode)

  const formatted = formatOutput(sorted)
  return formatted
}
