import * as IsImportantEdge from '../IsImportantEdge/IsImportantEdge.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

const isClosure = (node: any): boolean => {
  return node.type === 'closure'
}

const isContext = (edge: any): boolean => {
  return edge.name === 'context'
}

const getName = (node: any, contextNodes: any[]): string => {
  if (node.name) {
    return node.name
  }
  return contextNodes
    .map((node) => node.name)
    .join(':')
    .slice(0, 100)
}

const getClosureCounts = (parsedNodes: any[], graph: any): Map<string, number> => {
  const closures = parsedNodes.filter(isClosure)
  const nameToTotalCountMap = new Map<string, number>()

  for (const node of closures) {
    const edges = graph[node.id]
    if (!edges) {
      continue
    }
    const contextEdge = edges.find(isContext)
    if (!contextEdge) {
      continue
    }
    const contextNode = parsedNodes[contextEdge.index]
    if (!contextNode) {
      continue
    }
    const contextNodeEdges = graph[contextNode.id]?.filter(IsImportantEdge.isImportantEdge) || []
    const contextNodeCount = contextNodeEdges.length
    const name = getName(node, contextNodeEdges.map((edge: any) => parsedNodes[edge.index]).filter(Boolean))

    const currentTotal = nameToTotalCountMap.get(name) || 0
    nameToTotalCountMap.set(name, currentTotal + contextNodeCount)
  }

  return nameToTotalCountMap
}

export const compareNamedClosureCountFromHeapSnapshot = async (
  pathA: string,
  pathB: string,
): Promise<any[]> => {
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])

  // Parse both snapshots to get parsedNodes and graph
  const { parsedNodes: parsedNodesA, graph: graphA } = ParseHeapSnapshot.parseHeapSnapshot({
    nodes: snapshotA.nodes,
    strings: snapshotA.strings,
    edges: snapshotA.edges,
    snapshot: { meta: snapshotA.meta },
  } as any)

  const { parsedNodes: parsedNodesB, graph: graphB } = ParseHeapSnapshot.parseHeapSnapshot({
    nodes: snapshotB.nodes,
    strings: snapshotB.strings,
    edges: snapshotB.edges,
    snapshot: { meta: snapshotB.meta },
  } as any)

  // Get closure counts by name for both snapshots
  const countsA = getClosureCounts(parsedNodesA, graphA)
  const countsB = getClosureCounts(parsedNodesB, graphB)

  // Find leaked closures (where count increased)
  const leakedClosures: any[] = []

  for (const [name, countB] of countsB.entries()) {
    const countA = countsA.get(name) || 0
    const delta = countB - countA
    if (delta > 0) {
      // Find the closure in snapshot B to get full details
      const closures = parsedNodesB.filter(isClosure)
      for (const node of closures) {
        const edges = graphB[node.id]
        if (!edges) {
          continue
        }
        const contextEdge = edges.find(isContext)
        if (!contextEdge) {
          continue
        }
        const contextNode = parsedNodesB[contextEdge.index]
        if (!contextNode) {
          continue
        }
        const contextNodeEdges = graphB[contextNode.id]?.filter(IsImportantEdge.isImportantEdge) || []
        const closureName = getName(node, contextNodeEdges.map((edge: any) => parsedNodesB[edge.index]).filter(Boolean))

        if (closureName === name) {
          leakedClosures.push({
            ...node,
            name: closureName,
            contextNodeCount: contextNodeEdges.length,
            delta,
          })
          break // Only add one representative closure per name
        }
      }
    }
  }

  // Sort by delta descending, then by name
  const sorted = leakedClosures.toSorted((a, b) => {
    return b.delta - a.delta || a.name.localeCompare(b.name)
  })

  return sorted
}
