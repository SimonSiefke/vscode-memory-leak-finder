import * as IsIgnoredConstructorScopeEdge from '../IsIgnoredConstructorScopeEdge/IsIgnoredConstructorScopeEdge.js'

export const getConstructorScopeMap = (parsedNodes, graph) => {
  const scopeMap = new Uint32Array(parsedNodes.length)
  const edgeMap = [...new Array(parsedNodes.length).fill('')]
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
