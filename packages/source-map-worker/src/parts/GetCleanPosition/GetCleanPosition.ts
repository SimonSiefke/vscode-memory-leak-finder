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
  const { source, sourcesHash } = position
  return {
    ...position,
    source: CleanSource.cleanSource(source),
    sourcesHash,
  }
}
