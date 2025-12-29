import type { MapNode } from '../AstNode/AstNode.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'
import { printAst } from '../PrintAst/PrintAst.ts'

export const printMapLike = (node: MapNode): PrintedValue => {
  return node.entries.map((entry) => ({ key: printAst(entry.key), value: printAst(entry.value) }))
}
