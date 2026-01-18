import * as CleanSource from '../CleanSource/CleanSource.ts'

interface Position {
  column?: number | null
  line?: number | null
  name?: string | null
  source?: string | null
  sourcesHash?: string | null
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
