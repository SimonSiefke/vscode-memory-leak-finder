import type { StringNode } from '../AstNode/AstNode.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'

export const printString = (node: StringNode): PrintedValue => {
  return node.value
}


