const RE_LINE_COLUMN = /(\d+):(\d+)/

export const parseLineAndColumn = (line) => {
  if (!line) {
    return undefined
  }
  const match = line.match(RE_LINE_COLUMN)
  if (!match) {
    return undefined
  }
  return {
    line: Number.parseInt(match[1]),
    column: Number.parseInt(match[2]),
  }
}
