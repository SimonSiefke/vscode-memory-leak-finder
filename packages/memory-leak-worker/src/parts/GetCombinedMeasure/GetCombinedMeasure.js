import * as Assert from '../Assert/Assert.js'
import * as GetMeasure from '../GetMeasure/GetMeasure.js'
import * as LoadMemoryLeakFinder from '../LoadMemoryLeakFinder/LoadMemoryLeakFinder.js'

export const getCombinedMeasure = async (session, scriptMap, measureId) => {
  Assert.object(session)
  Assert.string(measureId)
  const MemoryLeakFinder = await LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, measureId)
  if (!measure) {
    throw new Error(`measure not found ${measureId}`)
  }
  const combinedMeasure = MemoryLeakFinder.combine(measure.create(session, scriptMap))
  return combinedMeasure
}
