import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'
import * as LogMemoryUsage from '../LogMemoryUsage/LogMemoryUsage.ts'

const doStop = async (connectionId: number): Promise<any> => {
  const measure = MemoryLeakFinderState.get(connectionId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  LogMemoryUsage.logMemoryUsage(`before stopping measurement for connection ${connectionId}`)
  const result = await measure.stop()
  await measure.releaseResources()
  LogMemoryUsage.logMemoryUsage(`after stopping measurement for connection ${connectionId}`)
  return result
}

export const stop = async (connectionId: number, electronTargetId: string): Promise<void> => {
  LogMemoryUsage.logMemoryUsage(`stopping memory leak finder for connection ${connectionId}`)
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
  LogMemoryUsage.logMemoryUsage(`completed memory leak finder stop for connection ${connectionId}`)
}
