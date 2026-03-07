import * as IsIgnoredConstructorScopeEdge from '../IsIgnoredConstructorScopeEdge/IsIgnoredConstructorScopeEdge.ts'

interface ParsedNode {
  readonly id: number
}

interface GraphEdge {
  readonly index: number
  readonly name: string
}

type Graph = Record<number, readonly GraphEdge[]>

interface ConstructorScopeMapResult {
  readonly edgeMap: readonly string[]
  readonly scopeMap: Uint32Array
}

export const getConstructorScopeMap = (
  parsedNodes: readonly ParsedNode[],
  graph: Graph,
): ConstructorScopeMapResult => {
  const scopeMap = new Uint32Array(parsedNodes.length)
  const edgeMap: string[] = Array.from({ length: parsedNodes.length }).fill('') as string[]
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
    edgeMap,
    scopeMap,
  }
}
