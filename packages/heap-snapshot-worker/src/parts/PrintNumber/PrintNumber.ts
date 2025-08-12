import type { NumberNode } from '../AstNode/AstNode.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'

export const printNumber = (node: NumberNode): PrintedValue => {
  return typeof node.value === 'number' ? node.value : Number(node.value)
}


