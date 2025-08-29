import type * as t from '@babel/types'

export const isLocationInside = (node: t.Node, line: number, column: number): boolean => {
  if (!node.loc) {
    return false
  }
  const startLine: number = node.loc.start.line - 1
  const endLine: number = node.loc.end.line - 1
  if (line < startLine) {
    return false
  }
  if (line > endLine) {
    return false
  }
  if (line === startLine && node.loc.start.column > column) {
    return false
  }
  if (line === endLine && node.loc.end.column < column) {
    return false
  }
  return true
}
