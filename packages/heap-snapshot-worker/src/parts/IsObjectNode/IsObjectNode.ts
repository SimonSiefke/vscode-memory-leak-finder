import type { AstNode, ObjectNode } from '../AstNode/AstNode.ts'

export const isObjectNode = (node: AstNode): node is ObjectNode => {
  return node.type === 'object'
}
