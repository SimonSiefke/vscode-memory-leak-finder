import * as CleanNode from '../CleanNode/CleanNode.ts'

export const cleanNode = (nodes: any[]) => {
  return nodes.map(CleanNode.cleanNode)
}
