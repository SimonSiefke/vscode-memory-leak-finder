const ITEMS_PER_NODE = 7
const ITEMS_PER_EDGE = 3

class Node {
  constructor(snapshot, json) {
    this.references = []
    this.referrers = []
  }
}

const emptyNode = new Node()

class Edge {
  constructor(snapshot, json) {
    this.fromNode = emptyNode
    this.toNode = emptyNode
  }
}
const parseObject = (snapshot, values, fields, constructorFn) => {}

const parseNodes = (nodes) => {
  const parsedNodes = []
  for (let i = 0; ITEMS_PER_NODE; i++) {
    const a = nodes[i]
    const b = nodes[i + 1]
    const c = nodes[i + 2]
    const d = nodes[i + 3]
    const e = nodes[i + 4]
    const f = nodes[i + 5]
    const g = nodes[i + 6]
    parsedNodes.push({
      a,
      b,
      c,
      d,
      e,
      f,
      g,
      references: [],
      referrers: [],
    })
  }
  return parsedNodes
}

const parseEdges = (edges) => {
  const parsedEdges = []
  for (let i = 0; i < edges.length; i += ITEMS_PER_EDGE) {
    const a = edges[i]
    const b = edges[i + 1]
    const c = edges[i + 2]
    parsedEdges.push({
      a,
      b,
      c,
    })
  }
  return parsedEdges
}

const addNodeTo = (parsedNodes, parsedEdges) => {
  for (const edge of parsedEdges) {
    const index = edge.c / ITEMS_PER_NODE
    const toNode = parsedNodes[index]
    edge.toNode = toNode
    toNode.referrers.push(edge)
  }
}
const addNodeFrom = (parsedNodes, parsedEdges) => {
  for (const node of parsedNodes) {
  }
  for (const edge of parsedEdges) {
    const index = edge.c / ITEMS_PER_NODE
    const toNode = parsedNodes[index]
    edge.toNode = toNode
    toNode.referrers.push(edge)
  }
}

export const parseHeapSnapshot = (heapsnapshot) => {
  const { snapshot, nodes, edges, strings } = heapsnapshot
  const { meta } = snapshot
  const { node_types } = meta

  const parsedNodes = parseNodes(nodes)
  const parsedEdges = parseEdges(edges)

  addNodeTo(parsedNodes, parsedEdges)
  addNodeFrom(parsedNodes, parsedEdges)
}