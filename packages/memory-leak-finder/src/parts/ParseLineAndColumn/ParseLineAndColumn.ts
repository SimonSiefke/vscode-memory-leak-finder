import type { Dynamic } from '../Types/Types.ts'
const RE_LINE_COLUMN = /(\d+):(\d+)/
export const parseLineAndColumn = (line: Dynamic) => {
  if (!line) {
    return undefined
  }
  const match = line.match(RE_LINE_COLUMN)
  if (!match) {
    return undefined
  }
  return {
    column: Number.parseInt(match[2]),
    line: Number.parseInt(match[1]),
  }
}
