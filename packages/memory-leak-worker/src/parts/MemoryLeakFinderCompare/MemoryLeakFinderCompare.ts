import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'

export const compare = async (instanceId: string, before: any, after: any): Promise<any> => {
  const measure = MemoryLeakFinderState.get(instanceId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  return measure.compare(before, after)
}
