import type { UndefinedNode } from '../AstNode/AstNode.ts'

export type PrintedValue = unknown

export const printUndefined = (_node: UndefinedNode): PrintedValue => {
  return undefined
}


