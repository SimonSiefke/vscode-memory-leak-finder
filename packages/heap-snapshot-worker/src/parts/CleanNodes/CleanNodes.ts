import * as CleanNode from '../CleanNode/CleanNode.js'

export const cleanNode = (nodes) => {
  return nodes.map(CleanNode.cleanNode)
}
