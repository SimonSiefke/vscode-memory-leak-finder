import type { PositionPointer } from '../PositionPointer/PositionPointer.ts'
import * as ApplyOriginalPositions from '../ApplyOriginalPositions/ApplyOriginalPositions.ts'
import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'

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
