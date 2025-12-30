type OriginalPosition = {
  source?: string | null
  line?: number | null
  column?: number | null
  name?: string | null
}

type CleanPositionMap = Record<string, OriginalPosition[]>

type PositionPointer = {
  index: number
  sourceMapUrl: string
}

type EnrichedItem = {
  originalSource?: string | null
  originalUrl?: string | null
  originalLine?: number | null
  originalColumn?: number | null
  originalName?: string | null
  originalLocation?: string | null
  [key: string]: any
}

export const applyOriginalPositions = (
  enriched: EnrichedItem[],
  cleanPositionMap: CleanPositionMap,
  positionPointers: PositionPointer[],
): void => {
  const offsetMap: Record<string, number> = Object.create(null)
  for (const pointer of positionPointers) {
    const positions = cleanPositionMap[pointer.sourceMapUrl] || []
    const offset = offsetMap[pointer.sourceMapUrl] || 0
    const original = positions[offset]
    offsetMap[pointer.sourceMapUrl] = offset + 1
    if (original) {
      const target = enriched[pointer.index] as EnrichedItem
      target.originalSource = original.source ?? null
      target.originalUrl = original.source ?? null
      target.originalLine = original.line ?? null
      target.originalColumn = original.column ?? null
      target.originalName = original.name ?? null
      if (target.originalUrl && target.originalLine !== null && target.originalColumn !== null) {
        target.originalLocation = `${target.originalUrl}:${target.originalLine}:${target.originalColumn}`
      }
    }
  }
}

