import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'

export const resolveOriginalPositions = async (
  enriched: any[],
  sourceMapUrlToPositions: Record<string, number[]>,
  positionPointers: { index: number; sourceMapUrl: string }[],
): Promise<void> => {
  // Resolve original positions using source-map-worker
  try {
    await using rpc = await LaunchSourceMapWorker.launchSourceMapWorker()
    const extendedOriginalNames = true
    const cleanPositionMap = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlToPositions, extendedOriginalNames)
    const offsetMap: Record<string, number> = Object.create(null)
    for (const pointer of positionPointers) {
      const positions = cleanPositionMap[pointer.sourceMapUrl] || []
      const offset = offsetMap[pointer.sourceMapUrl] || 0
      const original = positions[offset]
      offsetMap[pointer.sourceMapUrl] = offset + 1
      if (original) {
        const target = enriched[pointer.index] as any
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
  } catch (error) {
    console.log({ error })
    // ignore sourcemap resolution errors
  }
}

