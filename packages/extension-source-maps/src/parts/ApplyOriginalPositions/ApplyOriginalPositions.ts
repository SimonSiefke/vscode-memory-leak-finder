import type { PositionPointer } from '../PositionPointer/PositionPointer.ts'
import * as NormalizeSourcePath from '../NormalizeSourcePath/NormalizeSourcePath.ts'

interface OriginalPosition {
  column?: number | null
  line?: number | null
  name?: string | null
  source?: string | null
}

interface CleanPositionMap {
  [key: string]: OriginalPosition[]
}

interface EnrichedItem {
  [key: string]: any
  originalColumn?: number | null
  originalLine?: number | null
  originalLocation?: string | null
  originalName?: string | null
  originalSource?: string | null
  originalUrl?: string | null
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
      const target = enriched[pointer.index]
<<<<<<< HEAD
      const normalizedSource = NormalizeSourcePath.normalizeSourcePath(original.source ?? null)
      target.originalSource = normalizedSource
      target.originalUrl = normalizedSource
=======
      target.originalSource = original.source ?? null
      target.originalUrl = original.source ?? null
>>>>>>> origin/main
      target.originalLine = original.line ?? null
      target.originalColumn = original.column ?? null
      target.originalName = original.name ?? null
      if (target.originalUrl && target.originalLine !== null && target.originalColumn !== null) {
        target.originalLocation = `${target.originalUrl}:${target.originalLine}:${target.originalColumn}`
      }
    }
  }
}
