import type { AstNode } from '../AstNode/AstNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getAddedObjectsWithPropertiesInternalAst = (
  before: Snapshot,
  after: Snapshot,
  propertyName: string,
  depth: number,
): readonly AstNode[] => {
  return []
}
