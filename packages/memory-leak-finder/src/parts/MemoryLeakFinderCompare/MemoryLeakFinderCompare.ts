import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

export const compare = async (connectionId: number, before: any, after: any): Promise<any> => {
  const state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    throw new Error(`no measure found`)
  }
  const measure = state.measure || state
  return measure.compare(before, after)
}
