import type { AstNode } from '../AstNode/AstNode.ts'

const removePropertiesMaybe = (asts: readonly AstNode[], includeProperties: boolean): readonly AstNode[] => {
  if (includeProperties) {
    return asts
  }
  return asts.map((item) => {
    return {
      ...item,
      properties: [],
    }
  })
}

const collapseAstsMaybe = (asts: readonly AstNode[], collapse: boolean): readonly AstNode[] => {
  if (!collapse) {
    return asts
  }
  return asts
}

export const formatAsts = (asts: readonly AstNode[], includeProperties: boolean, collapse: boolean): readonly AstNode[] => {
  const result1 = removePropertiesMaybe(asts, includeProperties)
  const result2 = collapseAstsMaybe(result1, collapse)
  return result2
}
