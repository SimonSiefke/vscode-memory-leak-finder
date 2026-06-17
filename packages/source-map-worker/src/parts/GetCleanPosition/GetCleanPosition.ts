import * as CleanSource from '../CleanSource/CleanSource.ts'

interface Position {
  readonly column?: number | null | undefined
  readonly line?: number | null | undefined
  readonly name?: string | null | undefined
  readonly source?: string | null | undefined
  readonly sourcesHash?: string | null | undefined
}

export const getCleanPosition = (position: Position | null | undefined): Position | undefined => {
  if (!position) {
    return undefined
  }
  const { source, sourcesHash, column, line, name } = position
  const result: Position = {
    source: CleanSource.cleanSource(source),
  }
  if (sourcesHash !== undefined && sourcesHash !== null) {
    result.sourcesHash = sourcesHash
  }
  if (column !== undefined && column !== null) {
    result.column = column
  }
  if (line !== undefined && line !== null) {
    result.line = line
  }
  if (name !== undefined && name !== null) {
    result.name = name
  }
  return result
}
