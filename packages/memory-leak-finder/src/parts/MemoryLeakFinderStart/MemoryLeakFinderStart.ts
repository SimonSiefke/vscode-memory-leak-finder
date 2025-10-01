import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'

const doStart = async (connectionId: number): Promise<any> => {
  console.log(`[MemoryLeakFinder] Starting measure for connection ${connectionId}`)
  const startTime = performance.now()

  const measure = MemoryLeakFinderState.get(connectionId)
  if (!measure) {
    throw new Error(`no measure found`)
  }

  console.log(`[MemoryLeakFinder] Measure found, calling measure.start() - connection ${connectionId}`)
  const measureStartTime = performance.now()
  const result = await measure.start()
  console.log(
    `[MemoryLeakFinder] measure.start() completed in ${(performance.now() - measureStartTime).toFixed(2)}ms - connection ${connectionId}`,
  )

  const totalTime = performance.now() - startTime
  console.log(`[MemoryLeakFinder] Total start time: ${totalTime.toFixed(2)}ms - connection ${connectionId}`)
  return result
}

export const start = async (connectionId: number, electronTargetId: string): Promise<void> => {
  console.log('starting...')
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStart(connectionId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && intermediateResult.crashed) {
    throw new Error('target crashed')
  }
  crashInfo.dispose()
  MemoryLeakFinderState.update(connectionId, { before: intermediateResult })
}
