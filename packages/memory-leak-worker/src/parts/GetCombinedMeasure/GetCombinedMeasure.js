import * as LoadMemoryLeakFinder from '../LoadMemoryLeakFinder/LoadMemoryLeakFinder.js'

export const getCombinedMeasure = async (session) => {
  const MemoryLeakFinder = await LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = MemoryLeakFinder.combine(MemoryLeakFinder.Measures.MeasureEventListenerCount.create(session))
  return measure
}
