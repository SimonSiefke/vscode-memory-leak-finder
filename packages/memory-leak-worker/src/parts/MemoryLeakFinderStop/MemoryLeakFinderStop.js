import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.js'

const doStop = async (instanceId) => {
  const measure = MemoryLeakFinderState.get(instanceId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const result = await measure.stop()
  await measure.releaseResources()
  return result
}

export const stop = async (instanceId, electronTargetId) => {
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStop(instanceId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && intermediateResult.crashed) {
    throw new Error('target crashed')
  }
  crashInfo.cleanup()
  return intermediateResult
}
