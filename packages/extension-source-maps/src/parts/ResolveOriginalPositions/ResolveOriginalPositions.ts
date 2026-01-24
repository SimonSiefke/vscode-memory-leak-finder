import type { PositionPointer } from '../PositionPointer/PositionPointer.ts'
import * as ApplyOriginalPositions from '../ApplyOriginalPositions/ApplyOriginalPositions.ts'
import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
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

interface ResolveResult {
  originalUrl?: string | null
  originalLine?: number | null
  originalColumn?: number | null
  originalName?: string | null
  originalSource?: string | null
  originalLocation?: string | null
}

export const resolveOriginalPositions = async (
  enriched: any[],
  sourceMapUrlToPositions: Record<string, number[]>,
  positionPointers: PositionPointer[],
): Promise<void> => {
  // Resolve original positions using source-map-worker
  try {
    await using rpc = await LaunchSourceMapWorker.launchSourceMapWorker()
    const extendedOriginalNames = true
    const cleanPositionMap = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlToPositions, extendedOriginalNames)
    ApplyOriginalPositions.applyOriginalPositions(enriched, cleanPositionMap, positionPointers)
  } catch (error) {
    console.log({ error })
    // ignore sourcemap resolution errors
  }
}

export const resolveOriginalPositionsToResults = async (
  results: ResolveResult[],
  sourceMapUrlToPositions: Record<string, number[]>,
  positionPointers: PositionPointer[],
): Promise<void> => {
  // Resolve original positions using source-map-worker
  try {
    await using rpc = await LaunchSourceMapWorker.launchSourceMapWorker()
    const extendedOriginalNames = true
    const cleanPositionMap: CleanPositionMap = await rpc.invoke(
      'SourceMap.getCleanPositionsMap',
      sourceMapUrlToPositions,
      extendedOriginalNames,
    )

    // Apply original positions to results
    const offsetMap: Record<string, number> = Object.create(null)
    for (const pointer of positionPointers) {
      const positions = cleanPositionMap[pointer.sourceMapUrl] || []
      const offset = offsetMap[pointer.sourceMapUrl] || 0
      const original = positions[offset]
      offsetMap[pointer.sourceMapUrl] = offset + 1

      if (original) {
        const normalizedSource = NormalizeSourcePath.normalizeSourcePath(original.source ?? null)
        results[pointer.index] = {
          originalUrl: normalizedSource,
          originalLine: original.line ?? null,
          originalColumn: original.column ?? null,
          originalName: original.name ?? null,
          originalSource: normalizedSource,
          originalLocation:
            normalizedSource && original.line !== null && original.column !== null
              ? `${normalizedSource}:${original.line}:${original.column}`
              : null,
        }
      }
    }
  } catch (error) {
    console.log({ error })
    // ignore sourcemap resolution errors
  }
}
