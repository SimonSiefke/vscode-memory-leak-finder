import type { AstNode } from '../AstNode/AstNode.ts'
import { compareAsts } from '../CompareAsts/CompareAsts.ts'
import { getObjectsWithPropertiesInternalAst } from '../GetObjectsWithPropertiesInternalAst/GetObjectsWithPropertiesInternalAst.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getAddedObjectsWithPropertiesInternalAst = (
  before: Snapshot,
  after: Snapshot,
  propertyName: string,
  depth: number = 1,
): readonly AstNode[] => {
  console.time('ast-before')
  const astBefore = getObjectsWithPropertiesInternalAst(before, propertyName, depth)
  console.timeEnd('ast-before')
  console.time('ast-after')
  const astAfter = getObjectsWithPropertiesInternalAst(after, propertyName, depth)
  console.timeEnd('ast-after')
  console.time('compare')
  const added = compareAsts(astBefore, astAfter, depth)
  console.timeEnd('compare')
  console.log('addedCount', added.length)
  return added
}
