import type { BooleanNode } from '../AstNode/AstNode.ts'

export type PrintedValue = unknown

export const printBoolean = (node: BooleanNode): PrintedValue => {
  return node.value
}


