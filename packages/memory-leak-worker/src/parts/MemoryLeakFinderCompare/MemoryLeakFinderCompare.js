import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'

export const compare = async (instanceId, before, after) => {
  const measure = MemoryLeakFinderState.get(instanceId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  return measure.compare(before, after)
}
