import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'
import * as SessionState from '../SessionState/SessionState.ts'

const doStop = async (instanceId: string): Promise<any> => {
  const measure = MemoryLeakFinderState.get(instanceId)
  const session = SessionState.getAllSessions()
  // console.log({ session })
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const result = await measure.stop()
  await measure.releaseResources()
  return result
}

export const stop = async (instanceId: string, electronTargetId: string): Promise<any> => {
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStop(instanceId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && (intermediateResult as any).crashed) {
    throw new Error('target crashed')
  }
  crashInfo.cleanup()
  return intermediateResult
}
