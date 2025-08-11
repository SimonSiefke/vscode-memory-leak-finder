export const createNameMap = (parsedNodes, graph) => {
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
