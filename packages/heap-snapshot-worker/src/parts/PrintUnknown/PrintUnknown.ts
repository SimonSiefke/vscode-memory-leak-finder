import type { UnknownNode } from '../AstNode/AstNode.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'

export const printUnknown = (node: UnknownNode): PrintedValue => {
  return node.value ?? `[unknown ${node.id}]`
}
