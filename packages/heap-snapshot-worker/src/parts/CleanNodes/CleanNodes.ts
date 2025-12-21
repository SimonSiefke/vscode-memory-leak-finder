import * as CleanNode from '../CleanNode/CleanNode.ts'

export const cleanNode = (nodes) => {
  return nodes.map(CleanNode.cleanNode)
}
