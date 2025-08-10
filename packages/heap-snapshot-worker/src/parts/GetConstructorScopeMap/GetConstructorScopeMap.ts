import * as IsIgnoredConstructorScopeEdge from '../IsIgnoredConstructorScopeEdge/IsIgnoredConstructorScopeEdge.js'

interface ParsedNode {
  id: number
}

interface Edge {
  index: number
  name: string
}

interface Graph {
  [nodeId: number]: Edge[]
}

interface ConstructorScopeResult {
  scopeMap: Uint32Array
  edgeMap: string[]
}

export const getConstructorScopeMap = (parsedNodes: ParsedNode[], graph: Graph): ConstructorScopeResult => {
  const scopeMap = new Uint32Array(parsedNodes.length)
  const edgeMap: string[] = [...new Array(parsedNodes.length).fill('')]
  for (let i = 0; i < parsedNodes.length; i++) {
    const node = parsedNodes[i]
    const edges = graph[node.id]
    for (const edge of edges) {
      if (IsIgnoredConstructorScopeEdge.isIgnoredConstructorScopeEdge(edge)) {
        continue
      }
      if (scopeMap[edge.index]) {
        continue
      }
      scopeMap[edge.index] = i
      edgeMap[edge.index] = edge.name
    }
  }
  return {
    scopeMap,
    edgeMap,
  }
}
