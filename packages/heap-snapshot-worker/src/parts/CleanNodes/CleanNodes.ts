import * as CleanNode from '../CleanNode/CleanNode.js'

interface Node {
  type: any
  name: any
  id: any
  [key: string]: any
}

interface CleanedNode {
  type: any
  name: any
  id: any
}

export const cleanNode = (nodes: Node[]): CleanedNode[] => {
  return nodes.map(CleanNode.cleanNode)
}
