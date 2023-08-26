const loadMemoryLeakFinder = async () => {
  const MemoryLeakFinder = await import('../../../../memory-leak-finder/src/index.js')
  return MemoryLeakFinder
}

export const create = async (context) => {
  const MemoryLeakFinder = await loadMemoryLeakFinder()
  const session = context.firstWindow.rpc
  const measure = MemoryLeakFinder.combine(MemoryLeakFinder.Measures.MeasureEventListenerCount.create(session))
  return measure
}
