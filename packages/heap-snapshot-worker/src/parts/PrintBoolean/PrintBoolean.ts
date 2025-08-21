import type { BooleanNode } from '../AstNode/AstNode.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'

export const printBoolean = (node: BooleanNode): PrintedValue => {
  return node.value
}
