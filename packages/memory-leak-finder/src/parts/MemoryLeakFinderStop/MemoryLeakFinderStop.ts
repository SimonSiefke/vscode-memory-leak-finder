import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'
import * as SessionState from '../SessionState/SessionState.ts'

<<<<<<< HEAD:packages/memory-leak-worker/src/parts/MemoryLeakFinderStop/MemoryLeakFinderStop.ts
const doStop = async (instanceId: string): Promise<any> => {
  const measure = MemoryLeakFinderState.get(instanceId)
  const session = SessionState.getAllSessions()
  // console.log({ session })
=======
const doStop = async (connectionId: number): Promise<any> => {
  const measure = MemoryLeakFinderState.get(connectionId)
>>>>>>> origin/main:packages/memory-leak-finder/src/parts/MemoryLeakFinderStop/MemoryLeakFinderStop.ts
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const result = await measure.stop()
  await measure.releaseResources()
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
