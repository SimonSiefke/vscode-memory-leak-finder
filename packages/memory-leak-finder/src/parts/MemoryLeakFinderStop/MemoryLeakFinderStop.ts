import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'
import type { UnknownRecord } from '../Types/Types.ts'

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === 'object' && value !== null
}

const doStop = async (connectionId: number): Promise<unknown> => {
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

export const stop = async (connectionId: number, electronTargetId: string): Promise<unknown> => {
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStop(connectionId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (isRecord(intermediateResult) && intermediateResult.crashed) {
    throw new Error('target crashed')
  }
  crashInfo.dispose()
  if (isRecord(intermediateResult) && intermediateResult.connectionClosed) {
    return { connectionClosed: true }
  }
  MemoryLeakFinderState.update(connectionId, {
    after: intermediateResult,
  })
  return intermediateResult
}
