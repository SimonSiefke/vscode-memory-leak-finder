import * as LoadMemoryLeakFinder from '../LoadMemoryLeakFinder/LoadMemoryLeakFinder.js'

export const getCombinedMeasure = async (session) => {
  const MemoryLeakFinder = await LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = MemoryLeakFinder.Measures.MeasureEventListenerCount
  const combinedMeasure = MemoryLeakFinder.combine(measure.create(session))
  return combinedMeasure
}
