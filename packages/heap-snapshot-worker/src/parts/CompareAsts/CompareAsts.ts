import type { AstNode } from '../AstNode/AstNode.ts'
import { signatureFor } from '../SignatureForAstNode/SignatureForAstNode.ts'

export const compareAsts = (astBefore: readonly AstNode[], astAfter: readonly AstNode[], depth: number): readonly AstNode[] => {
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
