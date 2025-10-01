import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as Assert from '../Assert/Assert.ts'

export const compare = async (connectionId: number, context: any): Promise<any> => {
  console.log(`[MemoryLeakFinder] Starting compare for connection ${connectionId}`)
  const startTime = performance.now()

  Assert.number(connectionId)
  const measure = MemoryLeakFinderState.get(connectionId)
  if (!measure) {
    throw new Error(`no measure found`)
  }
  const { before, after } = measure
  if (!before) {
    throw new Error(`before missing`)
  }
  if (!after) {
    throw new Error(`after missing`)
  }

  console.log(`[MemoryLeakFinder] Calling measure.compare() - connection ${connectionId}`)
  const compareTime = performance.now()
  const result = await measure.compare(before, after, context)
  console.log(`[MemoryLeakFinder] measure.compare() completed in ${(performance.now() - compareTime).toFixed(2)}ms - connection ${connectionId}`)

  const totalTime = performance.now() - startTime
  console.log(`[MemoryLeakFinder] Total compare time: ${totalTime.toFixed(2)}ms - connection ${connectionId}`)
  return result
}
