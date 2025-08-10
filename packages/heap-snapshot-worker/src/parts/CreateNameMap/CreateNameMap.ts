interface ParsedNode {
  id: number
  name: string
}

interface Edge {
  index: number
  name: string
}

interface Graph {
  [nodeId: number]: Edge[]
}

interface NameMapEntry {
  edgeName: string
  nodeName: string
}

export const createNameMap = (parsedNodes: ParsedNode[], graph: Graph): Record<number, NameMapEntry> => {
  const nameMap: Record<number, NameMapEntry> = Object.create(null)
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
