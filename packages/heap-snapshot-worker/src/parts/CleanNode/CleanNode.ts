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

export const cleanNode = (node: Node): CleanedNode => {
  const { type, name, id } = node
  return {
    type,
    name,
    id,
  }
}
