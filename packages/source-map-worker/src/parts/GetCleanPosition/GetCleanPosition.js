import * as CleanSource from '../CleanSource/CleanSource.ts'

interface Position {
  source?: string
  line?: number
  column?: number
  name?: string
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
