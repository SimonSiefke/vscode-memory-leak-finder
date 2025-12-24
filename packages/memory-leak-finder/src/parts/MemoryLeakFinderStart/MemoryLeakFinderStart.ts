import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'
import * as SessionState from '../SessionState/SessionState.ts'

const doStart = async (connectionId: number): Promise<any> => {
  const measure = MemoryLeakFinderState.get(connectionId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const sessions = SessionState.getAllSessions()
  // for(const )
  // console.log({ sessions, measure })
  const workerSessions = sessions.filter((session) => session.type === 'worker')
  console.log({ workerSessions })
  const result = await measure.start(workerSessions)
  return result
}

export const start = async (connectionId: number, electronTargetId: string): Promise<void> => {
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStart(connectionId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && intermediateResult.crashed) {
    throw new Error('target crashed')
  }
  crashInfo.dispose()
  MemoryLeakFinderState.update(connectionId, { before: intermediateResult })
}
