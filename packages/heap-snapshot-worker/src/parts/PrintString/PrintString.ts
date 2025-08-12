import type { StringNode } from '../AstNode/AstNode.ts'

export type PrintedValue = unknown

export const printString = (node: StringNode): PrintedValue => {
  return node.value
}


