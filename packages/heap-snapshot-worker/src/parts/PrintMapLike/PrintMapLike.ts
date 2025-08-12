import type { MapNode } from '../AstNode/AstNode.ts'
import { printAst } from '../PrintAst/PrintAst.ts'

export type PrintedValue = unknown

export const printMapLike = (node: MapNode): PrintedValue => {
  return node.entries.map((entry) => ({ key: printAst(entry.key), value: printAst(entry.value) }))
}


