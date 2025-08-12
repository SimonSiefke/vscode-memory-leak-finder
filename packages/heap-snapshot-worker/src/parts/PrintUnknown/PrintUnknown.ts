import type { UnknownNode } from '../AstNode/AstNode.ts'

export type PrintedValue = unknown

export const printUnknown = (node: UnknownNode): PrintedValue => {
  return node.value ?? `[unknown ${node.id}]`
}


