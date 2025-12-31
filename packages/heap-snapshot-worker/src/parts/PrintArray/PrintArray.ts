import type { ArrayNode, AstNode } from '../AstNode/AstNode.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'
import { printAst } from '../PrintAst/PrintAst.ts'

export const printArray = (node: ArrayNode): PrintedValue => {
  return node.elements.map((el: AstNode) => printAst(el))
}
