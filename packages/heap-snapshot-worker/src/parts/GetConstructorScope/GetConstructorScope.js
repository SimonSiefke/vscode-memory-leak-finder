const isIgnoredEdge = (edge) => {
  return edge.name === 'this' || edge.name === 'bound_this'
}

export const getConstructorScope = (parsedNodes, graph, node) => {
  const nodeIndex = parsedNodes.indexOf(node)
  for (const parsedNode of parsedNodes) {
    const edges = graph[parsedNode.id]
    for (const edge of edges) {
      if (edge.index === nodeIndex) {
        if (isIgnoredEdge(edge)) {
          continue
        }
        return parsedNode
      }
    }
  }
  return undefined
}
