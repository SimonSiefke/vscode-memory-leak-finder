import type { ArrayNode, AstNode } from '../AstNode/AstNode.ts'
import { printAst } from '../PrintAst/PrintAst.ts'

export type PrintedValue = unknown

export const printArray = (node: ArrayNode): PrintedValue => {
  return node.elements.map((el: AstNode) => printAst(el))
}


