import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as Assert from '../Assert/Assert.ts'

export const compare = async (connectionId: number): Promise<any> => {
  Assert.number(connectionId)
  const measure = MemoryLeakFinderState.get(connectionId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const { before, after } = measure
  return measure.compare(before, after)
}
