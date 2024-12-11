import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'

const doStart = async (instanceId) => {
  const measure = MemoryLeakFinderState.get(instanceId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const result = await measure.start()
  return result
}

export const start = async (instanceId) => {
  const measure = MemoryLeakFinderState.get(instanceId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const result = await measure.start()
  return result
}
