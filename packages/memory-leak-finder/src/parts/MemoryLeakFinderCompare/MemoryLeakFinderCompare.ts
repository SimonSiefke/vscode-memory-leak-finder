import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

export const compare = async (connectionId: number, before: any, after: any): Promise<any> => {
  const measure = MemoryLeakFinderState.get(connectionId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  return measure.compare(before, after)
}
