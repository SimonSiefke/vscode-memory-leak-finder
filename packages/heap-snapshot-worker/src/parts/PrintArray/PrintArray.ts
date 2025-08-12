import type { ArrayNode, AstNode } from '../AstNode/AstNode.ts'
import { printAst } from '../PrintAst/PrintAst.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'

export const printArray = (node: ArrayNode): PrintedValue => {
  return node.elements.map((el: AstNode) => printAst(el))
}


