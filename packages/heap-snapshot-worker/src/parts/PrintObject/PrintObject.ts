import type { ObjectNode } from '../AstNode/AstNode.ts'
import { printAst } from '../PrintAst/PrintAst.ts'

export type PrintedValue = unknown

export const printObject = (node: ObjectNode): PrintedValue => {
  const out: Record<string, PrintedValue> = {}
  for (const prop of node.properties) {
    if (!prop.name) continue
    out[prop.name] = printAst(prop.value)
  }
  return out
}


