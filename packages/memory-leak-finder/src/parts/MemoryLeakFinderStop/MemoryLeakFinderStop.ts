import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'

const doStop = async (connectionId: number): Promise<any> => {
  console.log(`[MemoryLeakFinder] Stopping measure for connection ${connectionId}`)
  const startTime = performance.now()

  const measure = MemoryLeakFinderState.get(connectionId)
  if (!measure) {
    throw new Error(`no measure found`)
  }

  console.log(`[MemoryLeakFinder] Measure found, calling measure.stop() - connection ${connectionId}`)
  const measureStopTime = performance.now()
  const result = await measure.stop()
  console.log(`[MemoryLeakFinder] measure.stop() completed in ${(performance.now() - measureStopTime).toFixed(2)}ms - connection ${connectionId}`)

  console.log(`[MemoryLeakFinder] Calling measure.releaseResources() - connection ${connectionId}`)
  const releaseTime = performance.now()
  await measure.releaseResources()
  console.log(`[MemoryLeakFinder] measure.releaseResources() completed in ${(performance.now() - releaseTime).toFixed(2)}ms - connection ${connectionId}`)

  const totalTime = performance.now() - startTime
  console.log(`[MemoryLeakFinder] Total stop time: ${totalTime.toFixed(2)}ms - connection ${connectionId}`)
  return result
}

export const stop = async (connectionId: number, electronTargetId: string): Promise<void> => {
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStop(connectionId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && intermediateResult.crashed) {
    throw new Error('target crashed')
  }
  crashInfo.dispose()
  MemoryLeakFinderState.update(connectionId, {
    after: intermediateResult,
  })
}
