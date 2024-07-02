import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'

export const stop = async (instanceId) => {
  const measure = MemoryLeakFinderState.get(instanceId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const result = await measure.stop()
  await measure.releaseResources()
  return result
}
