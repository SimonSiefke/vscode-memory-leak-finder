interface ParsedNode {
  readonly id: number
  readonly name: string
}

interface GraphEdge {
  readonly index: number
  readonly name: string
}

type Graph = Record<number, readonly GraphEdge[]>

interface NameMapValue {
  readonly edgeName: string
  readonly nodeName: string
}

export const createNameMap = (
  parsedNodes: readonly ParsedNode[],
  graph: Graph,
): Record<number, NameMapValue> => {
  const nameMap = Object.create(null)
  for (const node of parsedNodes) {
    const edges = graph[node.id]
    for (const edge of edges) {
      const toNode = parsedNodes[edge.index]
      nameMap[toNode.id] ||= {
        edgeName: edge.name,
        nodeName: toNode.name,
      }
    }
  }
  return nameMap
}
