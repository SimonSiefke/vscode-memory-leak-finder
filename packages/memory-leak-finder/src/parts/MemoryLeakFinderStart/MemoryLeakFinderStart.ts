import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'
import * as LogMemoryUsage from '../LogMemoryUsage/LogMemoryUsage.ts'

const doStart = async (connectionId: number): Promise<any> => {
  const measure = MemoryLeakFinderState.get(connectionId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  LogMemoryUsage.logMemoryUsage(`before starting measurement for connection ${connectionId}`)
  const result = await measure.start()
  LogMemoryUsage.logMemoryUsage(`after starting measurement for connection ${connectionId}`)
  return result
}

export const start = async (connectionId: number, electronTargetId: string): Promise<void> => {
  LogMemoryUsage.logMemoryUsage(`starting memory leak finder for connection ${connectionId}`)
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStart(connectionId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && intermediateResult.crashed) {
    throw new Error('target crashed')
  }
  crashInfo.dispose()
  MemoryLeakFinderState.update(connectionId, { before: intermediateResult })
  LogMemoryUsage.logMemoryUsage(`completed memory leak finder start for connection ${connectionId}`)
}
