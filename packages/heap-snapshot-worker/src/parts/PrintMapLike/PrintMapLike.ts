import type { MapNode } from '../AstNode/AstNode.ts'
import { printAst } from '../PrintAst/PrintAst.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'

export const printMapLike = (node: MapNode): PrintedValue => {
  return node.entries.map((entry) => ({ key: printAst(entry.key), value: printAst(entry.value) }))
}
