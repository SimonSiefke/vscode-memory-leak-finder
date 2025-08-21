import type { UndefinedNode } from '../AstNode/AstNode.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'

export const printUndefined = (_node: UndefinedNode): PrintedValue => {
  return undefined
}
