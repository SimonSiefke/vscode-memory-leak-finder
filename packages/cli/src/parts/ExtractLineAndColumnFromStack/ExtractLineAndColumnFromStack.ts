import * as EscapeRegExp from '../EscapeRegExp/EscapeRegExp.ts'

export interface Position {
  line: number
  col: number
}

export const RE_LINE_COL_PREFIX = (relativeFilePath: string): RegExp => {
  return new RegExp(`${EscapeRegExp.escapeRegExp(relativeFilePath)}:(\\d+):(\\d+)`)
}

export const extractLineAndColumnFromStack = (stack: string, relativeFilePath: string): Position | undefined => {
  if (!stack || !relativeFilePath) {
    return undefined
  }
  const re = RE_LINE_COL_PREFIX(relativeFilePath)
  const match = stack.match(re)
  if (!match) {
    return undefined
  }
  const line = Number(match[1])
  const col = Number(match[2])
  if (Number.isNaN(line) || Number.isNaN(col)) {
    return undefined
  }
  return { line, col }
}


