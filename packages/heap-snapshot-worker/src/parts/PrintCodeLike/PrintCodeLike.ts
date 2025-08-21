import type { CodeNode } from '../AstNode/AstNode.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'

export const printCodeLike = (node: CodeNode): PrintedValue => {
  if (typeof node.scriptId === 'number' && typeof node.line === 'number' && typeof node.column === 'number') {
    return `[function: ${node.scriptId}:${node.line}:${node.column}]`
  }
  return `[${node.type} ${node.id}]`
}
