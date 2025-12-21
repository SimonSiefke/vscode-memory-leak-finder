import * as LoadMemoryLeakFinder from '../LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'

export const getEventListenerCount = async (session: any): Promise<number> => {
  const MemoryLeakFinder = await LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = MemoryLeakFinder.Measures.MeasureEventListenerCount
  const instance = measure.create(session)
  return await instance.start()
}
