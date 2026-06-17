import type { Session } from '../Session/Session.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetMeasure from '../GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'

export const getCombinedMeasure = async (session: Session, measureId: string, connectionId: number, pid: number): Promise<any> => {
  Assert.object(session)
  Assert.string(measureId)
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, measureId)
  if (!measure) {
    throw new Error(`measure not found ${measureId}`)
  }
  if (!measure.create) {
    throw new Error(`measure.create not available for ${measureId}`)
  }
  const measureArgs = measure.create({ ...session, pid })
  const combinedMeasure = MemoryLeakFinder.combine(measureArgs)
  return combinedMeasure
}
