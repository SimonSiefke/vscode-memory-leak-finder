import type { CleanedNode, ParsedNode } from '../Snapshot/Snapshot.ts'

export const cleanNode = (node: ParsedNode): CleanedNode => {
  const { id, name, type } = node
  return {
    id,
    name,
    type,
  }
}
