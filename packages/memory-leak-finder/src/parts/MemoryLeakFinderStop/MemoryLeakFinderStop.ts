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
  try {
    return await measure.stop()
  } finally {
    await measure.releaseResources()
  }
}

export const stop = async (connectionId: number, electronTargetId: string): Promise<unknown> => {
  const state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    throw new Error('no measure found')
  }
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId, state.rpc)
  const resultPromise = doStop(connectionId)
  let intermediateResult
  try {
    intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
    if (isRecord(intermediateResult) && intermediateResult.crashed) {
      await state.rpc.dispose()
      throw new Error('Application crashed: target crashed')
    }
  } finally {
    crashInfo.dispose()
  }
  if (isRecord(intermediateResult) && intermediateResult.connectionClosed) {
    return { connectionClosed: true }
  }
  MemoryLeakFinderState.update(connectionId, {
    after: intermediateResult,
  })
  return intermediateResult
}
