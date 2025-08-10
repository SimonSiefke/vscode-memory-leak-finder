import * as CleanSource from '../CleanSource/CleanSource.ts'

interface Position {
  source?: string | null
  line?: number | null
  column?: number | null
  name?: string | null
}

export const getCleanPosition = (position: Position | null | undefined): Position | undefined => {
  if (!position) {
    return undefined
  }
  const { source } = position
  return {
    ...position,
    source: CleanSource.cleanSource(source),
  }
}
