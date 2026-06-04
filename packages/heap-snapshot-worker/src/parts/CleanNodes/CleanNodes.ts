import * as CleanNode from '../CleanNode/CleanNode.ts'

interface NodeWithIdNameType {
  readonly id: number
  readonly name: string
  readonly type: string
}

export const cleanNode = (nodes: readonly NodeWithIdNameType[]): readonly NodeWithIdNameType[] => {
  return nodes.map(CleanNode.cleanNode)
}
