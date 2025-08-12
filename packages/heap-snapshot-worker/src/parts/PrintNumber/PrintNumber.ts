import type { NumberNode } from '../AstNode/AstNode.ts'

export type PrintedValue = unknown

export const printNumber = (node: NumberNode): PrintedValue => {
  return typeof node.value === 'number' ? node.value : Number(node.value)
}


