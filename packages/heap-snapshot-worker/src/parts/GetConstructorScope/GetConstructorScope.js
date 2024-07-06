import * as IsIgnoredConstructorScopeEdge from '../IsIgnoredConstructorScopeEdge/IsIgnoredConstructorScopeEdge.js'

export const getConstructorScope = (parsedNodes, graph, node) => {
  const nodeIndex = parsedNodes.indexOf(node)
  for (const parsedNode of parsedNodes) {
    const edges = graph[parsedNode.id]
    for (const edge of edges) {
      if (edge.index === nodeIndex) {
        if (IsIgnoredConstructorScopeEdge.isIgnoredConstructorScopeEdge(edge)) {
          continue
        }
        return parsedNode
      }
    }
  }
  return undefined
}
