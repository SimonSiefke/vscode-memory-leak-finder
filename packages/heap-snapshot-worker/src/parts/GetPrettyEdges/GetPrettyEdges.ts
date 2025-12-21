export const getPrettyEdges = (nodes: Uint32Array, nodeEdges: Uint32Array, strings: readonly string[], nodeIdOffset: number) => {
  const pretty: any[] = []
  for (let i = 0; i < nodeEdges.length; i += 3) {
    pretty.push({
      type: nodeEdges[i],
      name: strings[nodeEdges[i + 1]],
      toNodeId: nodes[nodeEdges[i + 2] + nodeIdOffset],
    })
  }
  return pretty
}
