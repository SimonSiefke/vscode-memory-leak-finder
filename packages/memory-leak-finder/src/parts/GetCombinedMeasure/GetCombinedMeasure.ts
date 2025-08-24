import * as Assert from '../Assert/Assert.ts'
import * as GetMeasure from '../GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'

export const getCombinedMeasure = async (session: any, measureId: string, context?: any): Promise<any> => {
  Assert.object(session)
  Assert.string(measureId)
  const MemoryLeakFinder = await LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, measureId)
  if (!measure) {
    throw new Error(`measure not found ${measureId}`)
  }
  const combinedMeasure = MemoryLeakFinder.combine(measure.create(session, context))
  return combinedMeasure
}
