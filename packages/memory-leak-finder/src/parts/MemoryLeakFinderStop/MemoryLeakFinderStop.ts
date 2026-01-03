import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'

const doStop = async (connectionId: number): Promise<any> => {
  const state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    throw new Error(`no measure found`)
  }
  const { measure, rpc } = state
  if (rpc && typeof rpc.connectionClosed === 'function' && rpc.connectionClosed()) {
    return { connectionClosed: true }
  }
  const result = await measure.stop()
  await measure.releaseResources()
  return result
}

export const stop = async (connectionId: number, electronTargetId: string): Promise<any> => {
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStop(connectionId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && intermediateResult.crashed) {
    throw new Error('target crashed')
  }
  crashInfo.dispose()
  if (intermediateResult && intermediateResult.connectionClosed) {
    return { connectionClosed: true }
  }
  MemoryLeakFinderState.update(connectionId, {
    after: intermediateResult,
  })
  return intermediateResult
}
