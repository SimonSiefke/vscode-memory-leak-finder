import * as CleanNode from '../CleanNode/CleanNode.ts'
import type { CleanedNode, ParsedNode } from '../Snapshot/Snapshot.ts'

export const cleanNode = (nodes: readonly ParsedNode[]): readonly CleanedNode[] => {
  return nodes.map(CleanNode.cleanNode)
}
