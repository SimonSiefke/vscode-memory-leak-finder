import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'
import * as SessionState from '../SessionState/SessionState.ts'

const doStart = async (instanceId: string): Promise<any> => {
  const measure = MemoryLeakFinderState.get(instanceId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const sessions = SessionState.getAllSessions()
  console.log({ sessions })
  const result = await measure.start()
  return result
}

export const start = async (instanceId: string, electronTargetId: string): Promise<any> => {
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStart(instanceId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && (intermediateResult as any).crashed) {
    throw new Error('target crashed')
  }
  crashInfo.cleanup()
  return intermediateResult
}
