import type { AstNode } from '../AstNode/AstNode.ts'
import { getObjectsWithPropertiesInternalAst } from '../GetObjectsWithPropertiesInternalAst/GetObjectsWithPropertiesInternalAst.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { signatureFor } from '../SignatureForAstNode/SignatureForAstNode.ts'

const compareAsts = (astBefore: readonly AstNode[], astAfter: readonly AstNode[], depth: number): readonly AstNode[] => {
  // Build multiset (signature -> count) for before
  const counts = Object.create(null) as Record<string, number>
  for (const node of astBefore) {
    const sig = signatureFor(node, depth)
    counts[sig] = (counts[sig] || 0) + 1
  }

  const added: AstNode[] = []
  for (const node of astAfter) {
    const sig = signatureFor(node, depth)
    const current = counts[sig] || 0
    if (current > 0) {
      counts[sig] = current - 1
      continue
    }
    added.push(node)
  }
  return added
}

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
  const added = compareAsts(astBefore, astAfter, depth)
  return added
}
