import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'

export const start = async (instanceId) => {
  const measure = MemoryLeakFinderState.get(instanceId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  return measure.start()
}
