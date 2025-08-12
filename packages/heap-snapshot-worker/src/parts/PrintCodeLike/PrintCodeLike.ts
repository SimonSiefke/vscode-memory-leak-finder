import type { CodeNode } from '../AstNode/AstNode.ts'

export type PrintedValue = unknown

export const printCodeLike = (node: CodeNode): PrintedValue => {
  if (
    typeof node.scriptId === 'number' &&
    typeof node.line === 'number' &&
    typeof node.column === 'number'
  ) {
    return `[function: ${node.scriptId}:${node.line}:${node.column}]`
  }
  return `[${node.type} ${node.id}]`
}


