import type { SetNode } from '../AstNode/AstNode.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'
import { printAst } from '../PrintAst/PrintAst.ts'

export const printSetLike = (node: SetNode): PrintedValue => {
  return node.elements.map((el) => printAst(el))
}
