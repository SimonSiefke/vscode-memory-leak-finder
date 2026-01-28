interface NodeWithIdNameType {
  readonly id: number
  readonly name: string
  readonly type: string
}

export const cleanNode = (node: NodeWithIdNameType): NodeWithIdNameType => {
  const { id, name, type } = node
  return {
    id,
    name,
    type,
  }
}
