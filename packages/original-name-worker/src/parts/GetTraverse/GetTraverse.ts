import traverse from '@babel/traverse'
import type { Visitor } from '@babel/traverse'
import type * as t from '@babel/types'

// Handle different module formats for @babel/traverse
const getTraverseFunction = (): ((ast: t.File, visitors: Visitor) => void) => {
  return typeof traverse === 'function' ? traverse : (traverse as any).default || (traverse as any).traverse
}

export const traverseAst = (ast: t.File, visitors: Visitor): void => {
  const traverseFn = getTraverseFunction()
  traverseFn(ast, visitors)
}
