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
  const { source, sourcesHash } = position
  return {
    ...position,
    source: CleanSource.cleanSource(source),
    sourcesHash,
  }
}
