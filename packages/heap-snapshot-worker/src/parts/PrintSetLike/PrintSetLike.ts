import type { SetNode } from '../AstNode/AstNode.ts'
import { printAst } from '../PrintAst/PrintAst.ts'

export type PrintedValue = unknown

export const printSetLike = (node: SetNode): PrintedValue => {
  return node.elements.map((el) => printAst(el))
}


